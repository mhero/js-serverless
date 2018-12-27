"use strict";

require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const users = require("../model/users");

const JSECRET = process.env.JSECRET;
const JWT_EXPIRATION_TIME = process.env.JWT_EXPIRATION_TIME || "8h";
const SALT_ROUNDS = 10;

const ok = (body) => ({
  statusCode: 200,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify(body),
});

const err = (statusCode, message) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify({ error: message }),
});

module.exports.register = async (event) => {
  try {
    const { username, password } = JSON.parse(event.body);
    if (!username || !password)
      return err(400, "username and password are required");
    if (password.length < 8)
      return err(400, "password must be at least 8 characters");

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await users.create({ username, hashedPassword });
    return ok({ message: "User created successfully", username: user.username });
  } catch (e) {
    if (e.name === "ConditionalCheckFailedException")
      return err(409, "Username already taken");
    console.error("register error:", e);
    return err(500, "Could not create user");
  }
};

module.exports.login = async (event) => {
  try {
    const { username, password } = JSON.parse(event.body);
    if (!username || !password)
      return err(400, "username and password are required");

    const user = await users.findByUsername(username);
    if (!user) return err(401, "Invalid credentials");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return err(401, "Invalid credentials");

    const token = jwt.sign({ username }, JSECRET, { expiresIn: JWT_EXPIRATION_TIME });
    return ok({ token });
  } catch (e) {
    console.error("login error:", e);
    return err(500, "Could not log in");
  }
};