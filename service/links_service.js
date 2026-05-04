"use strict";

const { randomBytes } = require("crypto");
const links = require("../model/links");
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");

const sqs = new SQSClient({ region: process.env.AWS_REGION || "us-east-1" });
const QUEUE_URL = process.env.CLICKS_QUEUE_URL;
const nanoid = (size = 7) => randomBytes(size).toString("base64url").slice(0, size);

const isValidUrl = (str) => {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const ok = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const err = (statusCode, message) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ error: message }),
});

module.exports.create = async (event) => {
  try {
    const { url, customCode } = JSON.parse(event.body);
    const username = event.requestContext?.authorizer?.username;

    if (!url) return err(400, "url is required");
    if (!isValidUrl(url)) return err(400, "url must be a valid http/https URL");

    const code = customCode || nanoid(7);
    const link = await links.create({ code, url, username });
    return ok(201, link);
  } catch (e) {
    if (e.name === "ConditionalCheckFailedException")
      return err(409, "That short code is already taken");
    console.error("create error:", e);
    return err(500, "Could not create link");
  }
};

module.exports.getOne = async (event) => {
  try {
    const { id } = event.pathParameters;
    const link = await links.findByCode(id);
    if (!link) return err(404, "Link not found");
    return ok(200, link);
  } catch (e) {
    console.error("getOne error:", e);
    return err(500, "Could not fetch link");
  }
};

module.exports.getAll = async (event) => {
  try {
    const username = event.requestContext?.authorizer?.username;
    const items = await links.findByUser(username);
    return ok(200, items);
  } catch (e) {
    console.error("getAll error:", e);
    return err(500, "Could not fetch links");
  }
};

module.exports.update = async (event) => {
  try {
    const { id } = event.pathParameters;
    const { url } = JSON.parse(event.body);

    if (!url) return err(400, "url is required");
    if (!isValidUrl(url)) return err(400, "url must be a valid http/https URL");

    const updated = await links.update(id, { url });
    return ok(200, updated);
  } catch (e) {
    if (e.name === "ConditionalCheckFailedException")
      return err(404, "Link not found");
    console.error("update error:", e);
    return err(500, "Could not update link");
  }
};

module.exports.remove = async (event) => {
  try {
    const { id } = event.pathParameters;
    await links.remove(id);
    return ok(200, { message: `Link ${id} deleted` });
  } catch (e) {
    if (e.name === "ConditionalCheckFailedException")
      return err(404, "Link not found");
    console.error("remove error:", e);
    return err(500, "Could not delete link");
  }
};

// Public redirect — fires SQS event, returns 301
module.exports.redirect = async (event) => {
  try {
    const { code } = event.pathParameters;
    const link = await links.findByCode(code);
    if (!link) return { statusCode: 404, body: "Not found" };

    // Fire-and-forget click event to SQS
    if (QUEUE_URL) {
      await sqs.send(
        new SendMessageCommand({
          QueueUrl: QUEUE_URL,
          MessageBody: JSON.stringify({
            code,
            ip: event.requestContext?.identity?.sourceIp,
            userAgent: event.headers?.["User-Agent"],
            referer: event.headers?.["Referer"] || "direct",
          }),
        })
      );
    }

    return {
      statusCode: 301,
      headers: { Location: link.url },
      body: "",
    };
  } catch (e) {
    console.error("redirect error:", e);
    return { statusCode: 500, body: "Could not redirect" };
  }
};