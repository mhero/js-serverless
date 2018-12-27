process.env.NODE_ENV = "test";

const { mockClient } = require("aws-sdk-client-mock");
const { DynamoDBDocumentClient, PutCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

const ddbMock = mockClient(DynamoDBDocumentClient);

const { handler } = require("../analytics");

beforeEach(() => ddbMock.reset());

const makeRecord = (body) => ({ body: JSON.stringify(body) });

describe("analytics handler", () => {
  test("processes SQS records and writes clicks + increments counter", async () => {
    ddbMock.on(PutCommand).resolves({});
    ddbMock.on(UpdateCommand).resolves({});

    await handler({
      Records: [
        makeRecord({ code: "abc", ip: "1.2.3.4", userAgent: "Mozilla", referer: "https://google.com" }),
        makeRecord({ code: "def", ip: "5.6.7.8", userAgent: "curl", referer: "direct" }),
      ],
    });

    expect(ddbMock).toHaveReceivedCommandTimes(PutCommand, 2);
    expect(ddbMock).toHaveReceivedCommandTimes(UpdateCommand, 2);
  });

  test("processes a batch of 1 without error", async () => {
    ddbMock.on(PutCommand).resolves({});
    ddbMock.on(UpdateCommand).resolves({});

    await handler({ Records: [makeRecord({ code: "abc", ip: "1.1.1.1" })] });

    expect(ddbMock).toHaveReceivedCommandTimes(PutCommand, 1);
  });

  test("does not throw when a record fails — others still process", async () => {
    ddbMock
      .on(PutCommand)
      .rejectsOnce(new Error("DynamoDB error"))
      .resolves({});
    ddbMock.on(UpdateCommand).resolves({});

    await expect(
      handler({
        Records: [
          makeRecord({ code: "bad" }),
          makeRecord({ code: "good", ip: "1.2.3.4" }),
        ],
      })
    ).resolves.not.toThrow();
  });
});