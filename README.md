# js-serverless

Simple rest server with serverless and jwt, this lambda is connected to a mongodb database( defined in varaibles.env).
For the newest version you need to create an account

## Install

https://www.serverless.com/framework/docs/getting-started

```bash
npm i serverless -g
```

```bash
npm install
```

## Test

```bash
npm run test
```

## Start local

```bash
sls offline start
```

## Simple calls for dev server

Before run:

```bash
brew install jq
```

then:

```bash
token=$(curl -d '{"username":"mark", "password":"password1"}'  -H "Content-Type: application/json" -X POST http://localhost:3000/dev/sessions | jq --raw-output '.token')
```

```bash
curl -H "Authorization: $token" -X GET  http://localhost:3000/dev/notes
```

```bash
curl -H "Authorization: $token" --request POST  --data '{"title":"xyz","content":"abc"}' http://localhost:3000/dev/notes
```
