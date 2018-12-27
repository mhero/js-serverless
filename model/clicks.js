"use strict";

const { PutCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient } = require("../db");

const TABLE = process.env.CLICKS_TABLE || "clicks";

const record = async ({ code, ip, userAgent, referer }) => {
  const item = {
    code,
    timestamp: new Date().toISOString(),
    ip: ip || "unknown",
    userAgent: userAgent || "unknown",
    referer: referer || "direct",
  };
  await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
  return item;
};

const findByCode = async (code) => {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "code = :code",
      ExpressionAttributeValues: { ":code": code },
      ScanIndexForward: false, // newest first
    })
  );
  return result.Items || [];
};

module.exports = { record, findByCode };