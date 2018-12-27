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

## Prerequisites

- Node.js 20+
- [Serverless Framework](https://www.serverless.com/framework/docs/getting-started)
- AWS CLI configured (`aws configure`)

```bash
npm i serverless -g
npm install serverless-offline --save-dev
npm install
```

## Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```
JSECRET=your-secret-key-here
JWT_EXPIRATION_TIME=8h
```

In production, `JSECRET` is read from AWS SSM Parameter Store:
```bash
aws ssm put-parameter --name /url-shortener/JSECRET --value "your-secret" --type SecureString
```

## Test

No Docker needed — tests use `aws-sdk-client-mock` to mock DynamoDB and SQS in memory.

```bash
npm test
```

## Run locally

```bash
sls offline start
```

## Dev calls

Install `jq` first if you don't have it:
```bash
brew install jq
```

**Register and login:**
```bash
curl -s -d '{"username":"mark","password":"password123"}' \
  -H "Content-Type: application/json" \
  -X POST http://localhost:3000/dev/auth/register | jq

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

## Deploy

```bash
sls deploy --stage prod
```

## Stack

| Service | Purpose |
|---|---|
| AWS Lambda | Compute |
| DynamoDB | Users, links, clicks, rollups |
| SQS + DLQ | Async click event processing |
| EventBridge | Daily stats cron |
| SSM Parameter Store | Secrets |
| JWT + bcrypt | Auth |