# js-serverless
Simple rest server with serverless and jwt

## Install ##

  ```bash
  npm install
  ```
## Start local ##
  
  ```bash
  sls offline start
  ```
## Simple calls for dev server ##
  Before run:
  
  ```bash
  brew install jq
  ```

  then:

  ```bash
  token=$(curl -d '{"username":"mark", "password":"password1"}'  -H "Content-Type: application/json" -X POST http://localhost:3000/dev/sessions | jq --raw-output '.token')

  curl -H "Authorization: $token" -X GET  http://localhost:3000/dev/notes
  curl -H "Authorization: $token" --request POST  --data '{"title":"xyz","content":"abc"}' http://localhost:3000/dev/notes
  ```
