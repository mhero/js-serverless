"use strict";

const TABLE = process.env.USERS_TABLE || "users";
const { PutCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient } = require("../db");


const create = async ({ username, hashedPassword }) => {
  const item = {
    username,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  };
  await docClient.send(
    new PutCommand({
      TableName: TABLE,
      Item: item,
      ConditionExpression: "attribute_not_exists(username)",
    })
  );
  return { username, createdAt: item.createdAt };
};

const findByUsername = async (username) => {
  const result = await docClient.send(
    new GetCommand({ TableName: TABLE, Key: { username } })
  );
  return result.Item || null;
};

module.exports = { create, findByUsername };