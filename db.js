"use strict";

require("dotenv").config();

const { DynamoDBClient, ListTablesCommand } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const isOffline = process.env.IS_OFFLINE === "true";
const isTest = process.env.NODE_ENV === "test";
const useLocal = isOffline || isTest;

const clientConfig = useLocal
  ? {
      region: "local",
      endpoint: "http://localhost:8000",
      credentials: { accessKeyId: "local", secretAccessKey: "local" },
    }
  : { region: process.env.AWS_REGION || "us-east-1" };

const client = new DynamoDBClient(clientConfig);

// Verify connection on startup
if (useLocal) {
  client.send(new ListTablesCommand({}))
    .then((r) => console.log("✅ DynamoDB Local connected. Tables:", r.TableNames))
    .catch((e) => console.error("❌ DynamoDB Local connection failed:", e.message));
}

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

module.exports = { docClient };