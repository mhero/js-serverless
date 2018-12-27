process.env.JSECRET = "test-secret";
process.env.JWT_EXPIRATION_TIME = "1h";
process.env.NODE_ENV = "test";

const { mockClient } = require("aws-sdk-client-mock");
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const ddbMock = mockClient(DynamoDBDocumentClient);

// Must require AFTER mock is set up
const { register, login } = require("../auth/auth");

beforeEach(() => ddbMock.reset());

const call = (handler, body) => handler({ body: JSON.stringify(body) });

describe("register", () => {
  test("creates user and returns 200", async () => {
    ddbMock.on(PutCommand).resolves({});
    const res = await call(register, { username: "mark", password: "password123" });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).username).toBe("mark");
  });

  test("returns 400 when username missing", async () => {
    const res = await call(register, { password: "password123" });
    expect(res.statusCode).toBe(400);
  });

  test("returns 400 when password too short", async () => {
    const res = await call(register, { username: "mark", password: "short" });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/8 characters/);
  });

  test("returns 409 when username already taken", async () => {
    ddbMock.on(PutCommand).rejects({ name: "ConditionalCheckFailedException" });
    const res = await call(register, { username: "mark", password: "password123" });
    expect(res.statusCode).toBe(409);
    expect(JSON.parse(res.body).error).toMatch(/already taken/);
  });
});

describe("login", () => {
  test("returns token for valid credentials", async () => {
    const hashed = await bcrypt.hash("password123", 10);
    ddbMock.on(GetCommand).resolves({ Item: { username: "mark", password: hashed } });

    const res = await call(login, { username: "mark", password: "password123" });
    expect(res.statusCode).toBe(200);
    const { token } = JSON.parse(res.body);
    expect(token).toBeDefined();
    const decoded = jwt.verify(token, "test-secret");
    expect(decoded.username).toBe("mark");
  });

  test("returns 401 for wrong password", async () => {
    const hashed = await bcrypt.hash("password123", 10);
    ddbMock.on(GetCommand).resolves({ Item: { username: "mark", password: hashed } });

    const res = await call(login, { username: "mark", password: "wrongpassword" });
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).error).toBe("Invalid credentials");
  });

  test("returns 401 for unknown user", async () => {
    ddbMock.on(GetCommand).resolves({ Item: null });
    const res = await call(login, { username: "nobody", password: "password123" });
    expect(res.statusCode).toBe(401);
  });

  test("returns 400 when body is missing fields", async () => {
    const res = await call(login, { username: "mark" });
    expect(res.statusCode).toBe(400);
  });

  test("does not expose password in token", async () => {
    const hashed = await bcrypt.hash("password123", 10);
    ddbMock.on(GetCommand).resolves({ Item: { username: "mark", password: hashed } });

    const res = await call(login, { username: "mark", password: "password123" });
    const { token } = JSON.parse(res.body);
    const decoded = jwt.verify(token, "test-secret");
    expect(decoded.password).toBeUndefined();
  });
});