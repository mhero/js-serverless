"use strict";

const buildIAMPolicy = (userId, effect, resource, context) => ({
  principalId: userId,
  policyDocument: {
    Version: "2012-10-17",
    Statement: [
      {
        Action: "execute-api:Invoke",
        Effect: effect,
        Resource: resource,
      },
    ],
  },
  context,
});

module.exports = { buildIAMPolicy };