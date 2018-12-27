'use strict';

require('dotenv').config({ path: '../variables.env' });
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const utils = require('./utils');
const JSECRET = process.env.JSECRET;

const authorizeUser = (userScopes, methodArn) => {
    console.log(`authorizeUser ${JSON.stringify(userScopes)} ${methodArn}`);
    const hasValidScope = _.some(userScopes, scope => methodArn.includes(scope));
    return hasValidScope;
};

module.exports.handler = (event, context, callback) => {
    console.log('authorize');
    console.log(event);
    const token = event.authorizationToken;

    try {
        // Verify JWT
        const decoded = jwt.verify(token, JSECRET);
        console.log(JSON.stringify(decoded));

        // Checks if the user's scopes allow her to call the current endpoint ARN
        const user = decoded.user;
        const isAllowed = authorizeUser(user.scopes, event.methodArn);

        console.log("hola "+ isAllowed);

        // Return an IAM policy document for the current endpoint
        const effect = isAllowed ? 'Allow' : 'Deny';
        const userId = user.username;
        const authorizerContext = {
            user: JSON.stringify(user)
        };
        const policyDocument = utils.buildIAMPolicy(userId, effect, event.methodArn, authorizerContext);

        console.log('Returning IAM policy document');
        callback(null, policyDocument);
    } catch (e) {
        console.log(e.message);
        callback('Unauthorized'); // Return a 401 Unauthorized response
    }
};