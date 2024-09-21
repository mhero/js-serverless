"use strict";

require('dotenv').config();
const jwt = require("jsonwebtoken");
const users = require("../model/users");

const JWT_EXPIRATION_TIME = process.env.JWT_EXPIRATION_TIME;
const JSECRET = process.env.JSECRET;

/*jwt that expires in JWT_EXPIRATION_TIME mins*/
module.exports.handler = (event, context, callback) => {
  console.log("login");
  const { username, password } = JSON.parse(event.body);

  try {
    // Authenticate user
    const user = users.login(username, password);
    console.log(user);

    // Issue JWT
    const token = jwt.sign(
      {
        user,
      },
      JSECRET,
      {
        expiresIn: JWT_EXPIRATION_TIME,
      }
    );
    console.log(`JWT issued: ${token}`);
    const response = {
      // Success response
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        token,
      }),
    };

    // Return response
    console.log(response);
    callback(null, response);
  } catch (e) {
    console.log(`Error logging in: ${e.message}`);
    const response = {
      // Error response
      statusCode: 401,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: e.message,
      }),
    };
    callback(null, response);
  }
};
