process.env.NODE_ENV = "test";

const { mockClient } = require("aws-sdk-client-mock");
const { DynamoDBDocumentClient, ScanCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");

const ddbMock = mockClient(DynamoDBDocumentClient);
const { handler } = require("../rollup");

beforeEach(() => ddbMock.reset());

describe("rollup handler", () => {
  test("writes a daily summary with correct totals", async () => {
    ddbMock.on(ScanCommand).resolves({
      Items: [
        { code: "abc", url: "https://a.com", clicks: 100 },
        { code: "def", url: "https://b.com", clicks: 50 },
        { code: "ghi", url: "https://c.com", clicks: 25 },
      ],
    });
    ddbMock.on(PutCommand).resolves({});

    const result = await handler();

    expect(result.totalLinks).toBe(3);
    expect(result.totalClicks).toBe(175);
    expect(result.topLinks[0].code).toBe("abc"); // highest clicks first
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(ddbMock).toHaveReceivedCommandTimes(PutCommand, 1);
  });

  test("handles empty links table", async () => {
    ddbMock.on(ScanCommand).resolves({ Items: [] });
    ddbMock.on(PutCommand).resolves({});

    const result = await handler();
    expect(result.totalLinks).toBe(0);
    expect(result.totalClicks).toBe(0);
    expect(result.topLinks).toHaveLength(0);
  });

  test("top links are capped at 10", async () => {
    const manyLinks = Array.from({ length: 15 }, (_, i) => ({
      code: `code${i}`,
      url: `https://example${i}.com`,
      clicks: i * 10,
    }));
    ddbMock.on(ScanCommand).resolves({ Items: manyLinks });
    ddbMock.on(PutCommand).resolves({});

    const result = await handler();
    expect(result.topLinks).toHaveLength(10);
  });

  test("throws when DynamoDB scan fails", async () => {
    ddbMock.on(ScanCommand).rejects(new Error("DynamoDB error"));
    await expect(handler()).rejects.toThrow("DynamoDB error");
  });
});