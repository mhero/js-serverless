"use strict";

const {
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");
const { docClient } = require("../db");

const TABLE = process.env.LINKS_TABLE || "links";

const create = async ({ code, url, username }) => {
  const item = {
    code,
    url,
    username,
    clicks: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
  return item;
};

const findByCode = async (code) => {
  const result = await docClient.send(
    new GetCommand({ TableName: TABLE, Key: { code } })
  );
  return result.Item || null;
};

const findByUser = async (username) => {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: "username-index",
      KeyConditionExpression: "username = :username",
      ExpressionAttributeValues: { ":username": username },
    })
  );
  return result.Items || [];
};

const update = async (code, { url }) => {
  const result = await docClient.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { code },
      UpdateExpression: "SET #url = :url, updatedAt = :updatedAt",
      ConditionExpression: "attribute_exists(code)",
      ExpressionAttributeNames: { "#url": "url" },
      ExpressionAttributeValues: {
        ":url": url,
        ":updatedAt": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
    })
  );
  return result.Attributes;
};

const remove = async (code) => {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE,
      Key: { code },
      ConditionExpression: "attribute_exists(code)",
    })
  );
};

const incrementClicks = async (code) => {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { code },
      UpdateExpression: "ADD clicks :one",
      ExpressionAttributeValues: { ":one": 1 },
    })
  );
};

module.exports = { create, findByCode, findByUser, update, remove, incrementClicks };