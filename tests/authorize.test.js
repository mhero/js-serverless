process.env.JSECRET = "test-secret";
process.env.NODE_ENV = "test";

const jwt = require("jsonwebtoken");
const { handler } = require("../auth/authorize");

const call = (token, methodArn) =>
  new Promise((resolve, reject) =>
    handler({ authorizationToken: token, methodArn }, {}, (err, policy) => {
      if (err) reject(new Error(err));
      else resolve(policy);
    })
  );

const makeToken = (payload) => jwt.sign(payload, "test-secret", { expiresIn: "1h" });

describe("authorize handler", () => {
  test("allows valid token", async () => {
    const token = makeToken({ username: "mark" });
    const policy = await call(token, "arn:aws:execute-api:us-east-1:123:abc/dev/GET/links");
    expect(policy.policyDocument.Statement[0].Effect).toBe("Allow");
    expect(policy.principalId).toBe("mark");
    expect(policy.context.username).toBe("mark");
  });

  test("rejects invalid token", async () => {
    await expect(call("bad-token", "arn:anything")).rejects.toThrow("Unauthorized");
  });

  test("rejects expired token", async () => {
    const expired = jwt.sign({ username: "mark" }, "test-secret", { expiresIn: -1 });
    await expect(call(expired, "arn:anything")).rejects.toThrow("Unauthorized");
  });

  test("rejects token signed with wrong secret", async () => {
    const token = jwt.sign({ username: "mark" }, "wrong-secret");
    await expect(call(token, "arn:anything")).rejects.toThrow("Unauthorized");
  });
});