"use strict";

const clicks = require("./model/clicks");
const links = require("./model/links");

// Triggered by SQS — processes click events in batches
module.exports.handler = async (event) => {
  const results = await Promise.allSettled(
    event.Records.map(async (record) => {
      const { code, ip, userAgent, referer } = JSON.parse(record.body);
      await Promise.all([
        clicks.record({ code, ip, userAgent, referer }),
        links.incrementClicks(code),
      ]);
      console.log(`Recorded click for code: ${code}`);
    })
  );

  // Log any failures but don't throw — failed messages go back to SQS for retry
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      console.error(`Failed to process record ${i}:`, result.reason);
    }
  });
};