#!/usr/bin/env node

"use strict";

const {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
} = require("@aws-sdk/client-dynamodb");

const ENDPOINT = "http://localhost:8000";
const STAGE = process.argv[2] || "dev";
const SERVICE = "url-shortener";

const client = new DynamoDBClient({
  region: "local",
  endpoint: ENDPOINT,
  credentials: { accessKeyId: "local", secretAccessKey: "local" },
});

const tableExists = async (name) => {
  try {
    await client.send(new DescribeTableCommand({ TableName: name }));
    return true;
  } catch {
    return false;
  }
};

const createTable = async (name, params) => {
  if (await tableExists(name)) {
    console.log(`  ✓ ${name} (already exists)`);
    return;
  }
  await client.send(new CreateTableCommand({ TableName: name, ...params }));
  console.log(`  ✓ ${name} (created)`);
};

const run = async () => {
  console.log(`🚀 Setting up local DynamoDB tables for stage: ${STAGE}`);
  console.log(`   Endpoint: ${ENDPOINT}\n`);

  try {
    await client.send(new DescribeTableCommand({ TableName: "ping" }));
  } catch (e) {
    if (e.name === "ResourceNotFoundException") {
      // DynamoDB Local is running — this is expected
    } else {
      console.error("❌ DynamoDB Local is not running.");
      console.error("   Start it with: docker run -d -p 8000:8000 amazon/dynamodb-local");
      process.exit(1);
    }
  }

  await createTable(`${SERVICE}-users-${STAGE}`, {
    AttributeDefinitions: [{ AttributeName: "username", AttributeType: "S" }],
    KeySchema: [{ AttributeName: "username", KeyType: "HASH" }],
    BillingMode: "PAY_PER_REQUEST",
  });

  await createTable(`${SERVICE}-links-${STAGE}`, {
    AttributeDefinitions: [
      { AttributeName: "code", AttributeType: "S" },
      { AttributeName: "username", AttributeType: "S" },
    ],
    KeySchema: [{ AttributeName: "code", KeyType: "HASH" }],
    BillingMode: "PAY_PER_REQUEST",
    GlobalSecondaryIndexes: [
      {
        IndexName: "username-index",
        KeySchema: [{ AttributeName: "username", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  });

  await createTable(`${SERVICE}-clicks-${STAGE}`, {
    AttributeDefinitions: [
      { AttributeName: "code", AttributeType: "S" },
      { AttributeName: "timestamp", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "code", KeyType: "HASH" },
      { AttributeName: "timestamp", KeyType: "RANGE" },
    ],
    BillingMode: "PAY_PER_REQUEST",
  });

  await createTable(`${SERVICE}-rollups-${STAGE}`, {
    AttributeDefinitions: [{ AttributeName: "date", AttributeType: "S" }],
    KeySchema: [{ AttributeName: "date", KeyType: "HASH" }],
    BillingMode: "PAY_PER_REQUEST",
  });

  console.log("\n✅ All tables ready. You can now run: sls offline start");
};

run().catch((e) => {
  console.error("❌ Setup failed:", e.message);
  process.exit(1);
});