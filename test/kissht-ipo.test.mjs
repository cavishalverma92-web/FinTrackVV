import test from "node:test";
import assert from "node:assert/strict";

import {
  classifyKisshtRisk,
  classifyKisshtSentiment,
  dedupeKisshtNews,
  getMatchedEntity,
} from "../app/lib/kisshtIpo.js";

test("kissht relevance detects entity aliases", () => {
  assert.equal(getMatchedEntity("OnEMI Technologies quarterly results update"), "onemi technologies");
  assert.equal(getMatchedEntity("SI Creva Capital stock exchange filing"), "si creva capital");
  assert.equal(getMatchedEntity("Generic fintech funding update"), null);
});

test("kissht risk classifier flags adverse public-market wording", () => {
  const risk = classifyKisshtRisk("Kissht analyst note says avoid due to RBI concern and asset quality risk");
  assert.equal(risk.level, "High");
  assert.ok(risk.keywords.includes("avoid"));
});

test("kissht risk classifier does not overflag generic regulatory mentions", () => {
  const risk = classifyKisshtRisk("OnEMI Technology investor update references its RBI regulated NBFC subsidiary");
  assert.equal(risk.level, "Low");
  assert.deepEqual(risk.keywords, []);
});

test("kissht sentiment classifier is deterministic", () => {
  assert.equal(classifyKisshtSentiment("Kissht reports healthy growth and profitability improvement"), "Positive");
  assert.equal(classifyKisshtSentiment("Kissht gets avoid recommendation after asset quality concern"), "Negative");
  assert.equal(classifyKisshtSentiment("Kissht investor presentation announced"), "Neutral");
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
    categoryTags: ["IR / results"],
    duplicateGroupId: "group",
    summary: "Kissht quarterly results update",
    whyThisMatters: "",
  };
  const items = dedupeKisshtNews([
    { ...base, id: "1", title: "Kissht quarterly results announced", headline: "Kissht quarterly results announced", snippet: "Kissht results", url: "https://a.example/story" },
    { ...base, id: "2", title: "Kissht quarterly results announced today", headline: "Kissht quarterly results announced today", snippet: "Kissht results", url: "https://b.example/story" },
  ]);
  assert.equal(items.length, 1);
  assert.equal(items[0].relatedUrls.length, 2);
});
