import test from "node:test";
import assert from "node:assert/strict";

import {
  classifyKisshtRisk,
  classifyKisshtSentiment,
  dedupeKisshtNews,
  extractGmpPoint,
  getMatchedEntity,
} from "../app/lib/kisshtIpo.js";

test("kissht ipo relevance detects entity aliases", () => {
  assert.equal(getMatchedEntity("OnEMI Technologies IPO price band update"), "onemi technologies");
  assert.equal(getMatchedEntity("SI Creva Capital files IPO papers"), "si creva capital");
  assert.equal(getMatchedEntity("Generic fintech IPO opens"), null);
});

test("kissht risk classifier flags adverse IPO wording", () => {
  const risk = classifyKisshtRisk("Kissht IPO review says avoid due to RBI concern and asset quality risk");
  assert.equal(risk.level, "High");
  assert.ok(risk.keywords.includes("avoid"));
});

test("kissht sentiment classifier is deterministic", () => {
  assert.equal(classifyKisshtSentiment("Kissht IPO gets subscribe recommendation and strong subscription"), "Positive");
  assert.equal(classifyKisshtSentiment("Kissht IPO avoid recommendation after weak subscription"), "Negative");
  assert.equal(classifyKisshtSentiment("Kissht IPO price band announced"), "Neutral");
});

test("gmp percentage calculation uses upper price band", () => {
  const point = extractGmpPoint("Kissht IPO GMP Rs 24, issue price Rs 120", "Test", "https://example.com");
  assert.equal(point.gmp, 24);
  assert.equal(point.priceBand, 120);
  assert.equal(point.gmpPercent, 20);
  assert.equal(point.estimatedListingPrice, 144);
});

test("kissht dedupe groups similar source variants", () => {
  const base = {
    sourceName: "Google News",
    sourceType: "news",
    reliabilityLevel: 2,
    publishedAt: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    matchedEntity: "kissht",
    sentiment: "Neutral",
    riskLevel: "Low",
    riskReason: "No material adverse keyword context found.",
    riskKeywords: [],
    materialityScore: 82,
    relevanceScore: 90,
    categoryTags: ["IPO launch / price band"],
    duplicateGroupId: "group",
    summary: "Kissht IPO price band update",
    whyThisMatters: "",
  };
  const items = dedupeKisshtNews([
    { ...base, id: "1", title: "Kissht IPO price band announced", headline: "Kissht IPO price band announced", snippet: "Kissht IPO", url: "https://a.example/story" },
    { ...base, id: "2", title: "Kissht IPO price band announced today", headline: "Kissht IPO price band announced today", snippet: "Kissht IPO", url: "https://b.example/story" },
  ]);
  assert.equal(items.length, 1);
  assert.equal(items[0].relatedUrls.length, 2);
});
