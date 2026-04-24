import test from "node:test";
import assert from "node:assert/strict";

import {
  dedupeAndRankNews,
  extractEntities,
  headlineSimilarity,
  impactFor,
  normalizeUrl,
} from "../app/api/intelligence/route.js";

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
