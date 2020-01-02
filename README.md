# js-serverless
Simple rest server with serverless and jwt

## Install ##
  - npm install
## Start local ##
  - sls offline start --skipCacheInvalidation
## Simple calls ##
  - token=$(curl -d '{"username":"mark", "password":"password1"}'  -H "Content-Type: application/json" -X POST http://localhost:3000/sessions)
  - echo $token
  - curl -H "Authorization: $token" -X GET  http://localhost:3000/notes

