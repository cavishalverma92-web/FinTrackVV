import test from "node:test";
import assert from "node:assert/strict";

import {
  classifyCategory,
  classifySector,
  classifySegment,
  dedupeAndRankNews,
  extractEntities,
  headlineSimilarity,
  impactFor,
  isFinancialServicesMaterial,
  normalizeUrl,
} from "../app/api/intelligence/route.js";
import { FILTER_OPTIONS } from "../data/appConfig.js";

test("normalizeUrl removes tracking params and trailing slash", () => {
  const normalized = normalizeUrl("https://example.com/story/?utm_source=test&utm_medium=email#frag");
  assert.equal(normalized, "https://example.com/story");
});

test("headlineSimilarity is high for near-identical headlines", () => {
  const score = headlineSimilarity(
    "RBI tightens digital lending norms for NBFCs in India",
    "RBI tightens digital lending norms for NBFCs in India."
  );
  assert.ok(score > 0.88);
});

test("extractEntities finds known lenders and banks", () => {
  const entities = extractEntities("Bajaj Finance and HDFC Bank expand co-lending partnership");
  assert.ok(entities.includes("Bajaj Finance"));
  assert.ok(entities.includes("HDFC Bank"));
});

test("impactFor returns critical digital impact for high-risk items", () => {
  const impact = impactFor("Risk Signal", "High");
  assert.equal(impact.digital, "Critical");
  assert.equal(impact.nbfc, "High");
});

test("dedupeAndRankNews merges source variants of the same story", () => {
  const items = [
    {
      id: "1",
      headline: "RBI tightens digital lending norms for NBFCs",
      tldr: "New compliance expectations for lending apps.",
      source: "RBI",
      category: "Regulation",
      risk: "Medium",
      url: "https://example.com/story?utm_source=test",
      publishedAt: "2026-04-24T10:00:00Z",
      tags: ["Regulation"],
    },
    {
      id: "2",
      headline: "RBI tightens digital lending norms for NBFC",
      tldr: "New compliance expectations for lending apps",
      source: "Google News RBI Regulatory Updates",
      category: "Regulation",
      risk: "Medium",
      url: "https://example.com/story",
      publishedAt: "2026-04-24T10:01:00Z",
      tags: ["Regulation"],
    },
  ];

  const deduped = dedupeAndRankNews(items);
  assert.equal(deduped.length, 1);
  assert.equal(deduped[0].sourceCount, 2);
});

test("materiality gate blocks generic market and government securities noise", () => {
  assert.equal(isFinancialServicesMaterial({
    source: "RBI",
    title: "Result of Underwriting Auction conducted on April 24, 2026",
    description: "Additional Competitive Underwriting of Government securities",
    defaultCategory: "Regulation",
  }), false);

  assert.equal(isFinancialServicesMaterial({
    source: "Mint",
    title: "Reliance Q4 results LIVE: RIL share price dips ahead of earnings",
    description: "Broad market live blog about Reliance Industries",
    defaultCategory: "Policy",
  }), false);

  assert.equal(isFinancialServicesMaterial({
    source: "Mint",
    title: "Tata Capital share price falls after Q4 results. Should you buy, sell or hold?",
    description: "Stock advice format rather than source-linked financial intelligence",
    defaultCategory: "Policy",
  }), false);
});

test("materiality gate keeps regulator and lender-specific items", () => {
  assert.equal(isFinancialServicesMaterial({
    source: "RBI",
    title: "RBI imposes monetary penalty on Ebix Payment Services Private Limited",
    description: "Penalty for non-compliance with payment aggregator directions",
    defaultCategory: "Regulation",
  }), true);

  assert.equal(isFinancialServicesMaterial({
    source: "NSE",
    sourceType: "exchange_filing",
    headline: "[LICHSGFIN] Financial Results",
    company: "LIC Housing Finance",
  }), true);
});

test("classification avoids false credit rating from broad stock market downgrade", () => {
  assert.notEqual(
    classifyCategory("US-Iran war impact: Indian stock market downgraded by HSBC twice in a month", "Policy"),
    "Ratings / Credit"
  );
});

test("extractEntities avoids Bank of India false positive inside Reserve Bank of India", () => {
  const entities = extractEntities("Reserve Bank of India releases underwriting auction result");
  assert.ok(!entities.includes("Bank of India"));
});

test("broking taxonomy captures new-age and traditional brokers", () => {
  assert.equal(classifySector("Groww Zerodha Upstox and Dhan report higher active traders", "Policy"), "Broking");
  assert.equal(classifySector("Kotak Securities and ICICI Securities update brokerage platforms", "Policy"), "Broking");
  assert.equal(classifySector("Fyers Alice Blue Samco and Geojit update discount broking apps", "Policy"), "Broking");
  assert.equal(classifySegment("Groww and Zerodha broking update", "Policy"), "Others");

  const entities = extractEntities("Upstox, Zerodha, Groww and Kotak Securities launch new broking tools");
  assert.ok(entities.includes("Upstox"));
  assert.ok(entities.includes("Zerodha"));
  assert.ok(entities.includes("Groww"));
  assert.ok(entities.includes("Kotak Securities"));

  assert.equal(isFinancialServicesMaterial({
    source: "Google News Broking",
    title: "Groww Zerodha and Upstox report active user growth",
    description: "Indian stock broker and trading app update",
    defaultCategory: "Policy",
  }), true);
});

test("kissht section captures corporate aliases and material news", () => {
  assert.deepEqual(
    FILTER_OPTIONS.slice(
      FILTER_OPTIONS.indexOf("Digital Lenders"),
      FILTER_OPTIONS.indexOf("Digital Lenders") + 2
    ),
    ["Digital Lenders", "Kissht"]
  );
  assert.equal(classifySector("Onemi Technologies-owned Kissht updates lending platform", "Policy"), "Kissht");
  assert.equal(classifySector("Si Creva Capital Services rating action for digital lending business", "Credit Rating"), "Kissht");
  assert.equal(classifySegment("Si-Creva and Onemi Technologies raise debt for Kissht", "Fundraise"), "Kissht");

  const entities = extractEntities("Onemi Technologies and Si Creva operate Kissht in India");
  assert.ok(entities.includes("Kissht"));

  assert.equal(isFinancialServicesMaterial({
    source: "Google News Kissht",
    title: "Onemi Technologies-owned Kissht raises debt",
    description: "Si Creva digital lending platform expands in India",
    defaultCategory: "Fundraise",
  }), true);
});

test("vehicle finance payments and insurance roll into Others segment", () => {
  assert.equal(classifySegment("Shriram Finance reports vehicle finance growth", "Earnings"), "Others");
  assert.equal(classifySegment("PhonePe payment aggregator update from RBI", "Regulation"), "Others");
  assert.equal(classifySegment("IRDAI issues insurance broker circular", "Regulation"), "Others");
});
