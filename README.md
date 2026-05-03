# url-shortener

Serverless URL shortener with click analytics, built with AWS Lambda, DynamoDB, SQS, and EventBridge. Includes JWT authentication with bcrypt password hashing.

## Architecture

```
POST /auth/register        → create account
POST /auth/login           → get JWT

POST   /links              → create short URL        (auth required)
GET    /links              → list your links + stats (auth required)
GET    /links/{id}         → get one link            (auth required)
PUT    /links/{id}         → update destination      (auth required)
DELETE /links/{id}         → delete link             (auth required)

GET    /{code}             → public redirect → fires SQS click event
```

**Lambdas beyond HTTP:**
- `analytics.js` — SQS-triggered, processes click events in batches and updates counters
- `rollup.js` — EventBridge daily cron, writes a top-10 summary to DynamoDB

## Stack

| Service | Purpose |
|---|---|
| AWS Lambda | Compute |
| DynamoDB | Users, links, clicks, rollups |
| SQS + DLQ | Async click event processing |
| EventBridge | Daily stats cron |
| SSM Parameter Store | Secrets (production) |
| JWT + bcrypt | Auth |

---

## Prerequisites

- Node.js 20+
- [Serverless Framework](https://www.serverless.com/framework/docs/getting-started)
- Docker (for local DynamoDB)
- AWS CLI — install for your platform:
  - Mac: download the pkg from https://aws.amazon.com/cli/
  - Linux: `curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && unzip awscliv2.zip && sudo ./aws/install`
  - Windows: download the MSI from https://aws.amazon.com/cli/

```bash
npm i serverless -g
npm install serverless-offline --save-dev
npm install
```

### Configure AWS CLI (local fake credentials)

You don't need a real AWS account for local development. DynamoDB Local just needs something to be there:

```bash
aws configure
```

Fill it in like this:
```
AWS Access Key ID: local
AWS Secret Access Key: local
Default region name: us-east-1
Default output format: json
```

---

## Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
IS_OFFLINE=true
JSECRET=your-secret-key-here
JWT_EXPIRATION_TIME=8h
USERS_TABLE=url-shortener-users-dev
LINKS_TABLE=url-shortener-links-dev
CLICKS_TABLE=url-shortener-clicks-dev
ROLLUPS_TABLE=url-shortener-rollups-dev
```

> In production, `JSECRET` is read from AWS SSM Parameter Store:
> ```bash
> aws ssm put-parameter --name /url-shortener/JSECRET --value "your-secret" --type SecureString
> ```

---

## Test

No Docker needed — tests use `aws-sdk-client-mock` to mock DynamoDB and SQS in memory.

```bash
npm test
```

---

## Run locally

Local dev requires Docker for DynamoDB Local. Follow these steps **in order**:

### 1. Start DynamoDB Local

```bash
docker run -d -p 8000:8000 amazon/dynamodb-local
```

### 2. Create the tables

> ⚠️ Use the Node script — NOT the AWS CLI. DynamoDB Local namespaces tables
> per credential set. The AWS CLI uses its own credential chain which maps to a
> different namespace than the SDK. The Node script uses the exact same client
> config as the app, so they always talk to the same namespace.

```bash
node scripts/setup-local-db.js
```

Optional: pass a stage name (defaults to `dev`):
```bash
node scripts/setup-local-db.js prod
```

The script is idempotent — safe to run multiple times, skips tables that already exist.

### 3. Start the server

```bash
sls offline start
```

> ⚠️ DynamoDB Local stores data **in memory** by default. Tables are lost when
> the Docker container stops. Run `node scripts/setup-local-db.js` again after
> restarting the container.

---

## Dev calls

Install `jq` first if you don't have it:
```bash
brew install jq        # Mac
sudo apt install jq    # Linux
```

**Register:**
```bash
curl -s -d '{"username":"mark","password":"password123"}' \
  -H "Content-Type: application/json" \
  -X POST http://localhost:3000/dev/auth/register | jq
```

**Login and save token:**
```bash
token=$(curl -s -d '{"username":"mark","password":"password123"}' \
  -H "Content-Type: application/json" \
  -X POST http://localhost:3000/dev/auth/login | jq -r '.token')
```

**Create a short link:**
```bash
curl -s -H "Authorization: $token" \
  -H "Content-Type: application/json" \
  -X POST http://localhost:3000/dev/links \
  --data '{"url":"https://example.com"}' | jq
```

**Create with a custom code:**
```bash
curl -s -H "Authorization: $token" \
  -H "Content-Type: application/json" \
  -X POST http://localhost:3000/dev/links \
  --data '{"url":"https://example.com","customCode":"mylink"}' | jq
```

**List your links:**
```bash
curl -s -H "Authorization: $token" \
  -X GET http://localhost:3000/dev/links | jq
```

**Get one link:**
```bash
curl -s -H "Authorization: $token" \
  -X GET http://localhost:3000/dev/links/{code} | jq
```

**Update a link:**
```bash
curl -s -H "Authorization: $token" \
  -H "Content-Type: application/json" \
  -X PUT http://localhost:3000/dev/links/{code} \
  --data '{"url":"https://newdestination.com"}' | jq
```

**Delete a link:**
```bash
curl -s -H "Authorization: $token" \
  -X DELETE http://localhost:3000/dev/links/{code} | jq
```

**Redirect (public):**
```bash
curl -v http://localhost:3000/dev/{code}
# returns 301 → Location: https://...
```

---

## Deploy

```bash
sls deploy --stage prod
```

---

## Troubleshooting

### `ResourceNotFoundException: Cannot do operations on a non-existent table`

The app is running but the tables don't exist in the local DynamoDB instance. This happens because DynamoDB Local stores data in memory and loses it when the container restarts.

**Fix:** run the setup script again (the container must be running):
```bash
node scripts/setup-local-db.js
```

Verify the tables exist using the Node script — do NOT use the AWS CLI for this, as it operates under a different credential namespace:
```bash
node -e "
const { DynamoDBClient, ListTablesCommand } = require('@aws-sdk/client-dynamodb');
const client = new DynamoDBClient({
  region: 'local',
  endpoint: 'http://localhost:8000',
  credentials: { accessKeyId: 'local', secretAccessKey: 'local' }
});
client.send(new ListTablesCommand({})).then(r => console.log('Tables:', r.TableNames)).catch(console.error);
"
```

> ⚠️ **Why not `aws dynamodb list-tables --endpoint-url http://localhost:8000`?**
> The AWS CLI uses a different credential namespace inside DynamoDB Local than
> the SDK does. The CLI may show tables that the app cannot see, or show empty
> when tables actually exist under the SDK's namespace. Always use the Node
> command above to verify what the app actually sees.

---

### `CredentialsProviderError: Could not load credentials from any providers`

The AWS CLI is not configured. Run:
```bash
aws configure
```
And enter these fake local values (no real AWS account needed):
```
AWS Access Key ID: local
AWS Secret Access Key: local
Default region name: us-east-1
Default output format: json
```

---

### `Failed to resolve variable '/url-shortener/JSECRET' with resolver 'ssm'`

Your `serverless.yml` is trying to fetch `JSECRET` from AWS SSM but you have no AWS credentials configured. Make sure your `.env` has:
```
JSECRET=your-secret-key-here
```
And that `serverless.yml` uses `${env:JSECRET}` not `${ssm:...}` for local dev.

---

### `DynamoDB Local is not running`

The Docker container has stopped. Restart it and recreate the tables:
```bash
docker run -d -p 8000:8000 amazon/dynamodb-local
node scripts/setup-local-db.js
```

---

### Tables keep disappearing between sessions

DynamoDB Local runs in-memory by default. To persist data across container restarts, mount a volume:
```bash
docker run -d -p 8000:8000 \
  -v $(pwd)/.dynamodb:/home/dynamodblocal/data \
  amazon/dynamodb-local \
  -jar DynamoDBLocal.jar -sharedDb -dbPath /home/dynamodblocal/data
```

Then add `.dynamodb/` to your `.gitignore`.