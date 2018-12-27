"use strict";

require("dotenv").config();
const jwt = require("jsonwebtoken");
const { buildIAMPolicy } = require("./iamPolicy");

const JSECRET = process.env.JSECRET;

module.exports.handler = (event, _context, callback) => {
  const token = event.authorizationToken;
  try {
    const decoded = jwt.verify(token, JSECRET);
    const policy = buildIAMPolicy(
      decoded.username,
      "Allow",
      event.methodArn,
      { username: decoded.username }
    );
    callback(null, policy);
  } catch (e) {
    console.error("authorize error:", e.message);
    callback("Unauthorized");
  }
};