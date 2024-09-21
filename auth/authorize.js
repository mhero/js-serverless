"use strict";

require('dotenv').config();
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const aimPolicy = require("./aimPolicy");
const JSECRET = process.env.JSECRET;

const authorizeUser = (userScopes, methodArn) => {
  console.log(`authorizeUser ${JSON.stringify(userScopes)} ${methodArn}`);
  const hasValidScope = _.some(userScopes, (scope) =>
    methodArn.includes(scope)
  );
  return hasValidScope;
};

const buildIAMPolicy = (event, user) => {
  // Return an IAM policy document for the current endpoint
  const isAllowed = authorizeUser(user.scopes, event.methodArn);
  const effect = isAllowed ? "Allow" : "Deny";
  const authorizerContext = {
    user: JSON.stringify(user),
  };

  return aimPolicy.buildIAMPolicy(
    user.username,
    effect,
    event.methodArn,
    authorizerContext
  );
};

module.exports.handler = (event, _context, callback) => {
  const token = event.authorizationToken;

  try {
    // Verify JWT
    const decoded = jwt.verify(token, JSECRET);

    // Checks if the user's scopes allow her to call the current endpoint ARN
    const user = decoded.user;
    const policyDocument = buildIAMPolicy(event, user);

    console.log("Returning IAM policy document");
    callback(null, policyDocument);
  } catch (e) {
    console.log(e.message);
    callback("Unauthorized"); // Return a 401 Unauthorized response
  }
};
