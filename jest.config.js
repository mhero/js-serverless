module.exports = {
  rootDir: ".",
  testMatch: ["**/tests/**/*.test.js"],
  testEnvironment: "node",
  setupFilesAfterEnv: ["aws-sdk-client-mock-jest"],
};