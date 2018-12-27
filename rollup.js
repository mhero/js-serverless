"use strict";

const { docClient } = require("./db");
const { ScanCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");

const LINKS_TABLE = process.env.LINKS_TABLE || "links";
const ROLLUPS_TABLE = process.env.ROLLUPS_TABLE || "rollups";

// Triggered by EventBridge daily cron
// Scans all links and writes a daily summary record
module.exports.handler = async () => {
  try {
    const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const { Items: allLinks } = await docClient.send(
      new ScanCommand({ TableName: LINKS_TABLE })
    );

    const totalLinks = allLinks.length;
    const totalClicks = allLinks.reduce((sum, l) => sum + (l.clicks || 0), 0);
    const topLinks = [...allLinks]
      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
      .slice(0, 10)
      .map(({ code, url, clicks }) => ({ code, url, clicks }));

    const summary = { date, totalLinks, totalClicks, topLinks, createdAt: new Date().toISOString() };

    await docClient.send(new PutCommand({ TableName: ROLLUPS_TABLE, Item: summary }));

    console.log(`Daily rollup for ${date}: ${totalLinks} links, ${totalClicks} total clicks`);
    return summary;
  } catch (e) {
    console.error("rollup error:", e);
    throw e;
  }
};