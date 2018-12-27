process.env.NODE_ENV = "test";
process.env.CLICKS_QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/123/test-queue";

const { mockClient } = require("aws-sdk-client-mock");
const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");

const ddbMock = mockClient(DynamoDBDocumentClient);
const sqsMock = mockClient(SQSClient);

const { create, getOne, getAll, update, remove, redirect } = require("../service/links_service");

beforeEach(() => {
  ddbMock.reset();
  sqsMock.reset();
});

const authEvent = (extra = {}) => ({
  requestContext: { authorizer: { username: "mark" } },
  ...extra,
});

describe("create", () => {
  test("creates a link and returns 201", async () => {
    ddbMock.on(PutCommand).resolves({});
    const res = await create(authEvent({ body: JSON.stringify({ url: "https://example.com" }) }));
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.url).toBe("https://example.com");
    expect(body.code).toBeDefined();
    expect(body.username).toBe("mark");
  });

  test("accepts a custom code", async () => {
    ddbMock.on(PutCommand).resolves({});
    const res = await create(authEvent({ body: JSON.stringify({ url: "https://example.com", customCode: "mycode" }) }));
    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.body).code).toBe("mycode");
  });

  test("returns 400 when url is missing", async () => {
    const res = await create(authEvent({ body: JSON.stringify({}) }));
    expect(res.statusCode).toBe(400);
  });

  test("returns 400 for invalid url", async () => {
    const res = await create(authEvent({ body: JSON.stringify({ url: "not-a-url" }) }));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/valid http/);
  });

  test("returns 409 when custom code is taken", async () => {
    ddbMock.on(PutCommand).rejects({ name: "ConditionalCheckFailedException" });
    const res = await create(authEvent({ body: JSON.stringify({ url: "https://example.com", customCode: "taken" }) }));
    expect(res.statusCode).toBe(409);
  });
});

describe("getOne", () => {
  test("returns link by code", async () => {
    ddbMock.on(GetCommand).resolves({ Item: { code: "abc123", url: "https://example.com", clicks: 5 } });
    const res = await getOne({ pathParameters: { id: "abc123" } });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).code).toBe("abc123");
  });

  test("returns 404 when not found", async () => {
    ddbMock.on(GetCommand).resolves({ Item: null });
    const res = await getOne({ pathParameters: { id: "nope" } });
    expect(res.statusCode).toBe(404);
  });
});

describe("getAll", () => {
  test("returns all links for user", async () => {
    const items = [
      { code: "abc", url: "https://a.com", username: "mark" },
      { code: "def", url: "https://b.com", username: "mark" },
    ];
    ddbMock.on(QueryCommand).resolves({ Items: items });
    const res = await getAll(authEvent());
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toHaveLength(2);
  });

  test("returns empty array when user has no links", async () => {
    ddbMock.on(QueryCommand).resolves({ Items: [] });
    const res = await getAll(authEvent());
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toHaveLength(0);
  });
});

describe("update", () => {
  test("updates url and returns 200", async () => {
    const updated = { code: "abc", url: "https://new.com" };
    ddbMock.on(UpdateCommand).resolves({ Attributes: updated });
    const res = await update({ pathParameters: { id: "abc" }, body: JSON.stringify({ url: "https://new.com" }) });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).url).toBe("https://new.com");
  });

  test("returns 400 when url is missing", async () => {
    const res = await update({ pathParameters: { id: "abc" }, body: JSON.stringify({}) });
    expect(res.statusCode).toBe(400);
  });

  test("returns 404 when link not found", async () => {
    ddbMock.on(UpdateCommand).rejects({ name: "ConditionalCheckFailedException" });
    const res = await update({ pathParameters: { id: "nope" }, body: JSON.stringify({ url: "https://new.com" }) });
    expect(res.statusCode).toBe(404);
  });
});

describe("remove", () => {
  test("deletes link and returns 200", async () => {
    ddbMock.on(DeleteCommand).resolves({});
    const res = await remove({ pathParameters: { id: "abc" } });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).message).toMatch(/abc/);
  });

  test("returns 404 when link not found", async () => {
    ddbMock.on(DeleteCommand).rejects({ name: "ConditionalCheckFailedException" });
    const res = await remove({ pathParameters: { id: "nope" } });
    expect(res.statusCode).toBe(404);
  });
});

describe("redirect", () => {
  test("returns 301 with Location header and fires SQS event", async () => {
    ddbMock.on(GetCommand).resolves({ Item: { code: "abc", url: "https://example.com" } });
    sqsMock.on(SendMessageCommand).resolves({});

    const res = await redirect({
      pathParameters: { code: "abc" },
      requestContext: { identity: { sourceIp: "1.2.3.4" } },
      headers: { "User-Agent": "Mozilla/5.0", Referer: "https://google.com" },
    });

    expect(res.statusCode).toBe(301);
    expect(res.headers.Location).toBe("https://example.com");
    expect(sqsMock).toHaveReceivedCommand(SendMessageCommand);
  });

  test("returns 404 for unknown code", async () => {
    ddbMock.on(GetCommand).resolves({ Item: null });
    const res = await redirect({ pathParameters: { code: "nope" }, headers: {} });
    expect(res.statusCode).toBe(404);
  });
});