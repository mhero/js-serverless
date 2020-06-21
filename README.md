# js-serverless
Simple rest server with serverless and jwt

## Install ##
  - npm install
## Start local ##
  - sls offline start --skipCacheInvalidation
## Simple calls for dev server ##
  - curl -d '{"username":"mark", "password":"password1"}'  -H "Content-Type: application/json" -X POST http://localhost:3000/dev/sessions
  - curl -H "Authorization: $token" -X GET  http://localhost:3000/dev/notes

