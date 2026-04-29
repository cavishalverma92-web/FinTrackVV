import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const CACHE_VERSION = 1;
const CACHE_TTL_MS = 15 * 60 * 1000;
const CACHE_DIR = process.env.VERCEL ? "/tmp" : path.join(process.cwd(), "data", "cache");
const CACHE_FILE = path.join(CACHE_DIR, "kissht-ipo.json");

export const KISSHT_ENTITY_TERMS = [
  "kissht",
  "kissht ipo",
  "onemi",
  "onemi technologies",
  "onemi technology",
  "onemi technologies india",
  "onemi technologies solutions",
  "si creva",
  "si-creva",
  "sicreva",
  "sicreva capital",
  "si creva capital",
  "kissht nbfc",
  "kissht digital lending",
];

const IPO_TERMS = [
  "ipo",
  "drhp",
  "rhp",
  "sebi",
  "price band",
  "gmp",
  "grey market",
  "subscription",
  "allotment",
  "listing",
  "broker note",
  "review",
  "recommendation",
  "anchor investor",
];

const NEWS_SOURCES = [
  { name: "Google News - Kissht IPO", reliability: 2, type: "aggregator", query: '"Kissht IPO" OR "OnEMI Technologies IPO" OR "SI Creva Capital IPO" when:2d' },
  { name: "Google News - Kissht Entity", reliability: 2, type: "aggregator", query: 'Kissht OR "OnEMI Technologies" OR "SI Creva" OR SiCreva when:2d' },
  { name: "Economic Times", reliability: 2, type: "news", query: 'site:economictimes.indiatimes.com (Kissht OR "OnEMI Technologies" OR "SI Creva") IPO when:14d' },
  { name: "ET BFSI", reliability: 2, type: "news", query: 'site:bfsi.economictimes.indiatimes.com (Kissht OR "OnEMI Technologies" OR "SI Creva") when:14d' },
  { name: "LiveMint", reliability: 2, type: "news", query: 'site:livemint.com (Kissht OR "OnEMI Technologies" OR "SI Creva") IPO when:14d' },
  { name: "Moneycontrol", reliability: 2, type: "news", query: 'site:moneycontrol.com (Kissht OR "OnEMI Technologies" OR "SI Creva") IPO when:14d' },
  { name: "Business Standard", reliability: 2, type: "news", query: 'site:business-standard.com (Kissht OR "OnEMI Technologies" OR "SI Creva") IPO when:14d' },
  { name: "Financial Express", reliability: 2, type: "news", query: 'site:financialexpress.com (Kissht OR "OnEMI Technologies" OR "SI Creva") IPO when:14d' },
  { name: "BusinessLine", reliability: 2, type: "news", query: 'site:thehindubusinessline.com (Kissht OR "OnEMI Technologies" OR "SI Creva") IPO when:14d' },
  { name: "CNBC TV18", reliability: 2, type: "news", query: 'site:cnbctv18.com (Kissht OR "OnEMI Technologies" OR "SI Creva") IPO when:14d' },
  { name: "NDTV Profit", reliability: 2, type: "news", query: 'site:ndtvprofit.com (Kissht OR "OnEMI Technologies" OR "SI Creva") IPO when:14d' },
  { name: "Inc42", reliability: 2, type: "news", query: 'site:inc42.com (Kissht OR "OnEMI Technologies" OR "SI Creva") IPO when:30d' },
  { name: "Entrackr", reliability: 2, type: "news", query: 'site:entrackr.com (Kissht OR "OnEMI Technologies" OR "SI Creva") IPO when:30d' },
  { name: "YourStory", reliability: 2, type: "news", query: 'site:yourstory.com (Kissht OR "OnEMI Technologies" OR "SI Creva") IPO when:30d' },
  { name: "Medianama", reliability: 2, type: "news", query: 'site:medianama.com (Kissht OR "OnEMI Technologies" OR "SI Creva") when:30d' },
];

const GMP_SOURCES = [
  ["Chittorgarh", "https://www.chittorgarh.com/search?q=Kissht%20IPO%20GMP"],
  ["IPOWatch", "https://ipowatch.in/?s=Kissht+IPO+GMP"],
  ["InvestorGain", "https://www.investorgain.com/search?q=Kissht%20IPO%20GMP"],
  ["IPO Central", "https://ipocentral.in/?s=Kissht+IPO+GMP"],
  ["IPOJi", "https://www.ipoji.com/search?q=Kissht%20IPO%20GMP"],
  ["5paisa IPO", "https://www.5paisa.com/ipo"],
  ["Angel One IPO", "https://www.angelone.in/ipo"],
  ["Groww IPO", "https://groww.in/ipo"],
];

const BROKERS = [
  "ICICI Securities", "HDFC Securities", "Motilal Oswal", "Axis Capital", "SBI Securities",
  "Kotak Securities", "Anand Rathi", "Canara Bank Securities", "Swastika Investmart",
  "Choice Broking", "BP Wealth", "Reliance Securities", "Ventura Securities", "Arihant Capital",
  "Nirmal Bang", "Master Capital", "Geojit", "Sharekhan", "Angel One", "5paisa",
  "Bajaj Broking", "JM Financial", "Centrum", "SMIFS", "StoxBox", "Mehta Equities",
];

const RISK_KEYWORDS = [
  "default", "defaults", "npa", "gnpa", "nnpa", "asset quality", "credit cost", "provisioning",
  "write-off", "overdue", "delinquencies", "collection", "recovery", "harassment", "complaint",
  "customer complaint", "fraud", "scam", "governance", "resignation", "auditor", "regulatory",
  "rbi", "sebi", "litigation", "legal", "court", "penalty", "data privacy", "dpdp",
  "digital lending guidelines", "fldg", "overleveraging", "bureau", "liquidity", "downgrade",
  "rating downgrade", "loss", "decline", "weak", "avoid", "expensive valuation",
  "stretched valuation", "low subscription", "gmp fall", "gmp down", "listing loss",
  "muted listing", "negative review",
];

const POSITIVE_TERMS = [
  "strong subscription", "gmp rise", "subscribe", "healthy growth", "profitability improvement",
  "asset quality improvement", "successful anchor", "listing gain", "positive valuation",
  "oversubscribed", "robust demand",
];

const NEGATIVE_TERMS = [
  "avoid", "gmp fall", "gmp down", "weak subscription", "regulatory concern", "rbi issue",
  "asset quality concern", "credit cost", "governance concern", "legal issue", "fraud",
  "loss", "declining profitability", "high valuation", "customer complaint", "muted listing",
];

const TOPIC_RULES = [
  ["IPO launch / price band", ["price band", "issue opens", "ipo date", "lot size", "fresh issue", "offer for sale"]],
  ["GMP", ["gmp", "grey market", "listing gain"]],
  ["Subscription", ["subscription", "subscribed", "qib", "nii", "retail"]],
  ["Broker note", ["broker note", "subscribe", "avoid", "recommendation", "analyst note", "ipo review"]],
  ["Financial performance", ["revenue", "profit", "loss", "aum", "net worth", "financials"]],
  ["Asset quality / credit risk", ["npa", "gnpa", "nnpa", "credit cost", "asset quality", "delinquencies"]],
  ["Regulation / RBI", ["rbi", "sebi", "regulatory", "digital lending guidelines", "fldg"]],
  ["Governance", ["governance", "auditor", "resignation", "board"]],
  ["Litigation / complaints", ["litigation", "legal", "court", "complaint", "harassment"]],
  ["Digital lending sector", ["digital lending", "nbfc", "fintech lender"]],
  ["Investor sentiment", ["investor sentiment", "demand", "grey market", "valuation"]],
  ["Listing expectations", ["listing", "listing gain", "listing loss"]],
  ["Social commentary", ["reddit", "social", "forum"]],
  ["YouTube commentary", ["youtube", "video"]],
];

function nowIso() {
  return new Date().toISOString();
}

function hash(value = "") {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function googleNewsUrl(query) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
}

function withTimeout(promise, timeoutMs, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
    }),
  ]).finally(() => clearTimeout(timer));
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "User-Agent": "FinServTracker/1.0 (+https://fin-track-vv.vercel.app)",
        ...(options.headers || {}),
      },
      next: { revalidate: 900 },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function readTextWithTimeout(response, timeoutMs, label) {
  let timer;
  return Promise.race([
    response.text(),
    new Promise((_, reject) => {
      timer = setTimeout(() => {
        response.body?.cancel?.().catch(() => {});
        reject(new Error(`${label} timed out`));
      }, timeoutMs);
    }),
  ]).finally(() => clearTimeout(timer));
}

async function readJsonWithTimeout(response, timeoutMs, label) {
  const text = await readTextWithTimeout(response, timeoutMs, label);
  return JSON.parse(text);
}

function decodeEntities(value = "") {
  return String(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return decodeEntities(match?.[1] || "");
}

function getLink(block) {
  const href = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i)?.[1];
  return decodeEntities(href || getTag(block, "link") || getTag(block, "guid"));
}

function normalizeUrl(value = "") {
  try {
    const url = new URL(value);
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ocid"].forEach((param) => url.searchParams.delete(param));
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return String(value || "").trim();
  }
}

function normalizeTitle(value = "") {
  return decodeEntities(value)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\b(the|a|an|to|of|for|and|in|on|with|by|from|as|is|are|ipo)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSimilarity(leftValue, rightValue) {
  const left = new Set(normalizeTitle(leftValue).split(" ").filter((word) => word.length > 2));
  const right = new Set(normalizeTitle(rightValue).split(" ").filter((word) => word.length > 2));
  if (!left.size || !right.size) return 0;
  const intersection = [...left].filter((word) => right.has(word)).length;
  return intersection / new Set([...left, ...right]).size;
}

function parseDate(value) {
  const date = new Date(value || "");
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseRss(xml, source) {
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) || xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
  return blocks.map((block) => ({
    title: getTag(block, "title"),
    snippet: getTag(block, "description") || getTag(block, "summary"),
    url: getLink(block),
    publishedAt: getTag(block, "pubDate") || getTag(block, "published") || getTag(block, "updated"),
    sourceName: source.name,
    sourceType: source.type,
    reliabilityLevel: source.reliability,
    fetchedAt: nowIso(),
  })).filter((item) => item.title && item.url);
}

export function getMatchedEntity(text = "") {
  const lower = text.toLowerCase();
  return [...KISSHT_ENTITY_TERMS].sort((a, b) => b.length - a.length).find((term) => lower.includes(term)) || null;
}

function relevanceScore(item) {
  const title = item.title.toLowerCase();
  const body = `${item.title} ${item.snippet} ${item.url}`.toLowerCase();
  const exactEntity = getMatchedEntity(body);
  if (!exactEntity) return 0;
  let score = 55;
  if (getMatchedEntity(title)) score += 20;
  if (IPO_TERMS.some((term) => body.includes(term))) score += 15;
  if (["kissht ipo", "onemi technologies ipo", "si creva capital ipo"].some((term) => body.includes(term))) score += 10;
  return Math.min(100, score);
}

export function classifyKisshtSentiment(text = "") {
  const lower = text.toLowerCase();
  const negative = NEGATIVE_TERMS.filter((term) => lower.includes(term)).length;
  const positive = POSITIVE_TERMS.filter((term) => lower.includes(term)).length;
  if (negative > positive) return "Negative";
  if (positive > negative) return "Positive";
  return "Neutral";
}

export function classifyKisshtRisk(text = "", sourceType = "news") {
  const lower = text.toLowerCase();
  const matched = RISK_KEYWORDS.filter((term) => lower.includes(term));
  const severe = ["fraud", "scam", "litigation", "court", "penalty", "rbi issue", "regulatory action", "avoid", "weak subscription", "listing loss"];
  const high = matched.some((term) => severe.includes(term)) || /rbi.{0,40}(action|restriction|penalty)|sebi.{0,40}(order|action)/i.test(lower);
  const medium = matched.some((term) => ["valuation", "complaint", "credit cost", "asset quality", "downgrade", "loss", "weak"].some((risk) => term.includes(risk)));
  if (high) return { level: "High", keywords: matched, reason: "High-severity adverse IPO/regulatory/risk language detected." };
  if (medium || matched.length >= 2) return { level: "Medium", keywords: matched, reason: "Potential investor concern or cautionary language detected." };
  if (matched.length) return { level: "Low", keywords: matched, reason: "Mild risk wording present; monitor context." };
  return { level: "Low", keywords: [], reason: sourceType === "social" ? "No explicit adverse signal found in public snippet." : "No material adverse keyword context found." };
}

function topicTags(text = "") {
  const lower = text.toLowerCase();
  const tags = TOPIC_RULES.filter(([, terms]) => terms.some((term) => lower.includes(term))).map(([topic]) => topic);
  return tags.length ? tags : ["Other"];
}

function materialityScore(item, risk) {
  const text = `${item.title} ${item.snippet}`.toLowerCase();
  let score = item.relevanceScore * 0.45 + item.reliabilityLevel * 8;
  if (["High", "Medium"].includes(risk.level)) score += risk.level === "High" ? 22 : 12;
  if (["gmp", "subscription", "price band", "broker note", "subscribe", "avoid", "rhp", "drhp", "sebi", "financials", "asset quality", "valuation"].some((term) => text.includes(term))) score += 18;
  return Math.min(100, Math.round(score));
}

function whyThisMatters(item) {
  const tags = item.categoryTags || [];
  if (tags.includes("GMP")) return "Grey-market movement can influence retail narrative and listing expectations before pricing/listing.";
  if (tags.includes("Subscription")) return "Subscription velocity is a live demand signal for pricing confidence and listing-day sentiment.";
  if (tags.includes("Broker note")) return "Broker calls shape retail demand and can quickly become the dominant IPO narrative.";
  if (item.sentiment === "Negative" || item.riskLevel !== "Low") return "Adverse commentary near the IPO window can require IR response, FAQ updates, or risk-context clarification.";
  if (tags.includes("Regulation / RBI")) return "Regulatory references matter because digital-lending compliance is central to investor diligence.";
  return "Direct Kissht/OnEMI/SI Creva coverage contributes to IPO awareness, investor positioning, and narrative tracking.";
}

function enrichNewsItem(item) {
  const combined = `${item.title} ${item.snippet} ${item.url}`;
  const matchedEntity = getMatchedEntity(combined);
  const relevance = relevanceScore(item);
  const sentiment = classifyKisshtSentiment(combined);
  const risk = classifyKisshtRisk(combined, item.sourceType);
  const tags = topicTags(combined);
  const canonicalUrl = normalizeUrl(item.url);
  const published = parseDate(item.publishedAt);
  return {
    id: hash(`${canonicalUrl}:${item.title}`),
    title: item.title,
    headline: item.title,
    sourceName: item.sourceName,
    sourceType: item.sourceType || "news",
    url: item.url,
    canonicalUrl,
    publishedAt: published?.toISOString() || null,
    fetchedAt: item.fetchedAt || nowIso(),
    updatedAt: nowIso(),
    matchedEntity,
    snippet: item.snippet,
    summary: decodeEntities(item.snippet || item.title).slice(0, 180),
    sentiment,
    riskLevel: risk.level,
    riskReason: risk.reason,
    riskKeywords: risk.keywords,
    materialityScore: materialityScore({ ...item, relevanceScore: relevance }, risk),
    relevanceScore: relevance,
    categoryTags: tags,
    duplicateGroupId: hash(normalizeTitle(item.title).slice(0, 80)),
    relatedUrls: [item.url],
    whyThisMatters: "",
    reliabilityLevel: item.reliabilityLevel || 2,
  };
}

export function dedupeKisshtNews(items = []) {
  const sorted = [...items]
    .filter((item) => item.relevanceScore >= 70)
    .sort((a, b) => {
      if (b.materialityScore !== a.materialityScore) return b.materialityScore - a.materialityScore;
      return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
    });
  const groups = [];
  for (const item of sorted) {
    const existing = groups.find((candidate) => (
      candidate.canonicalUrl === item.canonicalUrl ||
      tokenSimilarity(candidate.title, item.title) >= 0.82
    ));
    if (!existing) {
      groups.push({ ...item, relatedUrls: [item.url], duplicateGroupId: item.duplicateGroupId });
      continue;
    }
    existing.relatedUrls = [...new Set([...(existing.relatedUrls || []), item.url])];
    existing.alsoCoveredBy = [...new Set([...(existing.alsoCoveredBy || []), item.sourceName])];
    const existingDate = new Date(existing.publishedAt || 0).getTime();
    const itemDate = new Date(item.publishedAt || 0).getTime();
    existing.earliestPublishedAt = new Date(Math.min(existingDate || itemDate, itemDate || existingDate)).toISOString();
    existing.latestUpdatedAt = nowIso();
  }
  return groups.map((item) => ({ ...item, whyThisMatters: whyThisMatters(item) })).slice(0, 40);
}

async function fetchNewsSources() {
  const results = await Promise.allSettled(NEWS_SOURCES.map(async (source) => {
    const url = googleNewsUrl(source.query);
    const response = await fetchWithTimeout(url, {}, 6000);
    if (!response.ok) throw new Error(`${source.name} returned ${response.status}`);
    const xml = await readTextWithTimeout(response, 2500, `${source.name} body read`);
    const items = parseRss(xml, { ...source, type: source.type || "news" }).map(enrichNewsItem);
    return {
      source,
      url,
      items,
      status: {
        source: source.name,
        sourceType: source.type || "news",
        reliabilityLevel: source.reliability,
        url,
        lastFetchedAt: nowIso(),
        status: "Working",
        itemCount: items.length,
      },
    };
  }));
  const statuses = results.map((result, index) => {
    const source = NEWS_SOURCES[index];
    if (result.status === "fulfilled") return result.value.status;
    return {
      source: source.name,
      sourceType: source.type || "news",
      reliabilityLevel: source.reliability,
      url: googleNewsUrl(source.query),
      lastFetchedAt: nowIso(),
      status: "Failed",
      itemCount: 0,
      message: "Public feed unavailable for this refresh.",
    };
  });
  const rawItems = results.flatMap((result) => result.status === "fulfilled" ? result.value.items : []);
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  const recent = rawItems.filter((item) => !item.publishedAt || new Date(item.publishedAt).getTime() >= cutoff);
  return { news: dedupeKisshtNews(recent), statuses };
}

export function extractGmpPoint(text = "", source = "Unknown", url = "") {
  const lower = text.toLowerCase();
  if (!lower.includes("gmp")) return null;
  const gmpMatch = text.match(/(?:gmp|premium)[^\d-]{0,20}(?:rs\.?|inr)?\s*(-?\d+(?:\.\d+)?)/i);
  const bandMatch = text.match(/(?:price band|upper price|issue price)[^\d]{0,30}(?:rs\.?|inr)?\s*(\d+(?:\.\d+)?)/i);
  if (!gmpMatch) return null;
  const gmp = Number(gmpMatch[1]);
  const priceBand = bandMatch ? Number(bandMatch[1]) : null;
  return {
    source,
    url,
    timestamp: nowIso(),
    gmp,
    priceBand,
    gmpPercent: priceBand ? Number(((gmp / priceBand) * 100).toFixed(2)) : null,
    estimatedListingPrice: priceBand ? Number((priceBand + gmp).toFixed(2)) : null,
    trend: "New",
    reliabilityStatus: "Live",
  };
}

async function buildGmp(news) {
  const points = news
    .map((item) => extractGmpPoint(`${item.title} ${item.snippet}`, item.sourceName, item.url))
    .filter(Boolean);
  const sources = GMP_SOURCES.map(([source, url]) => {
    const found = points.find((point) => point.source === source || point.url?.includes(new URL(url).hostname));
    return {
      source,
      url,
      sourceType: "GMP",
      reliabilityLevel: 4,
      lastFetchedAt: nowIso(),
      status: found ? "Working" : "Not available",
      message: found ? "Public GMP mention detected." : "Awaited / not available from public sources.",
    };
  });
  const latest = points.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0] || null;
  return {
    current: latest,
    points,
    sourceCount: points.length,
    range: points.length ? {
      min: Math.min(...points.map((point) => point.gmp)),
      max: Math.max(...points.map((point) => point.gmp)),
    } : null,
    status: points.length ? "Live" : "Awaited / Not available from public sources",
    sources,
  };
}

function recommendationFromText(text = "") {
  const lower = text.toLowerCase();
  if (/\bsubscribe for long term\b|\bsubscribe for long-term\b/.test(lower)) return "Subscribe for long term";
  if (/\bsubscribe\b/.test(lower)) return "Subscribe";
  if (/\bavoid\b|\bstay away\b/.test(lower)) return "Avoid";
  if (/\bneutral\b|\bmay apply\b|\bcautious\b/.test(lower)) return "Neutral";
  return null;
}

function buildBrokerNotes(news) {
  const notes = BROKERS.map((broker) => {
    const match = news.find((item) => {
      const text = `${item.title} ${item.snippet}`.toLowerCase();
      return text.includes(broker.toLowerCase()) && (text.includes("review") || text.includes("recommend") || text.includes("subscribe") || text.includes("avoid"));
    });
    if (!match) {
      return {
        broker,
        recommendation: "Awaited",
        status: "Awaited",
        sourceUrl: null,
        reportTitle: "No public note found yet",
        date: null,
        thesis: [],
        risks: [],
        valuationComment: "Awaited",
        sentiment: "Neutral",
      };
    }
    const recommendation = recommendationFromText(`${match.title} ${match.snippet}`) || "Not rated";
    return {
      broker,
      recommendation,
      status: "Public mention found",
      sourceUrl: match.url,
      reportTitle: match.title,
      date: match.publishedAt,
      thesis: match.sentiment === "Positive" ? [match.summary] : [],
      risks: match.riskKeywords?.length ? [`Risk terms: ${match.riskKeywords.slice(0, 3).join(", ")}`] : [],
      valuationComment: match.categoryTags.includes("Broker note") ? match.summary : "See linked source",
      sentiment: match.sentiment,
      sourceBasis: "secondary/public source",
    };
  });
  const summary = {
    subscribe: notes.filter((note) => note.recommendation === "Subscribe" || note.recommendation === "Subscribe for long term").length,
    neutral: notes.filter((note) => note.recommendation === "Neutral").length,
    avoid: notes.filter((note) => note.recommendation === "Avoid").length,
    awaited: notes.filter((note) => note.recommendation === "Awaited").length,
  };
  return { notes, summary };
}

function buildRisk(news) {
  const riskItems = news
    .filter((item) => item.sentiment === "Negative" || item.riskKeywords?.length)
    .map((item) => ({
      id: item.id,
      headline: item.title,
      source: item.sourceName,
      url: item.url,
      timestamp: item.publishedAt,
      severity: item.riskLevel,
      reason: item.riskReason,
      matchedKeywords: item.riskKeywords || [],
      suggestedResponseAngle: item.riskLevel === "High"
        ? "Prepare source-backed clarification and align CEO/IR talking points."
        : item.riskLevel === "Medium"
          ? "Monitor narrative and prepare FAQ context if repeated by reputed sources."
          : "No immediate response; keep in watchlist.",
      actionRequired: item.riskLevel === "High" ? "Yes" : item.riskLevel === "Medium" ? "Monitor" : "No",
    }))
    .sort((a, b) => ({ High: 3, Medium: 2, Low: 1 }[b.severity] || 0) - ({ High: 3, Medium: 2, Low: 1 }[a.severity] || 0))
    .slice(0, 12);
  const cutoff24 = Date.now() - 24 * 60 * 60 * 1000;
  const cutoff48 = Date.now() - 48 * 60 * 60 * 1000;
  return {
    items: riskItems,
    topFive: riskItems.slice(0, 5),
    highRiskAlerts: riskItems.filter((item) => item.severity === "High"),
    count24h: riskItems.filter((item) => !item.timestamp || new Date(item.timestamp).getTime() >= cutoff24).length,
    count48h: riskItems.filter((item) => !item.timestamp || new Date(item.timestamp).getTime() >= cutoff48).length,
    trend: riskItems.filter((item) => item.severity === "High").length ? "Elevated" : riskItems.length ? "Watch" : "Quiet",
    lastUpdatedAt: nowIso(),
  };
}

function buildSubscription(news) {
  const sourceRows = ["NSE IPO", "BSE IPO", "Chittorgarh", "IPOWatch", "InvestorGain", "Moneycontrol IPO", "IPO Central"].map((source) => ({
    source,
    url: source === "NSE IPO" ? "https://www.nseindia.com/market-data/issue-information" : source === "BSE IPO" ? "https://www.bseindia.com/static/markets/PublicIssues/IPONew.aspx" : `https://www.google.com/search?q=${encodeURIComponent(`${source} Kissht IPO subscription`)}`,
    timestamp: nowIso(),
    status: "Awaited",
    message: "Starts when IPO opens / public subscription table appears.",
  }));
  return {
    current: null,
    categories: ["QIB", "NII / HNI", "Retail", "Employee", "Total"].map((category) => ({
      category,
      current: null,
      change: null,
      source: "Awaited",
      timestamp: null,
      status: "Awaited",
    })),
    history: [],
    sources: sourceRows,
    status: "Starts when IPO opens / Awaited",
  };
}

async function fetchRedditSocial() {
  const url = "https://www.reddit.com/search.json?q=Kissht%20IPO%20OR%20OnEMI%20Technologies%20IPO%20OR%20SI%20Creva%20IPO&sort=new&t=week&limit=10";
  try {
    const response = await fetchWithTimeout(url, { headers: { "User-Agent": "FinServTrackerKisshtIPO/1.0" } }, 6000);
    if (!response.ok) throw new Error(`Reddit returned ${response.status}`);
    const json = await readJsonWithTimeout(response, 2500, "Reddit body read");
    const items = (json?.data?.children || []).map((entry) => {
      const data = entry.data || {};
      const text = `${data.title || ""} ${data.selftext || ""}`;
      const risk = classifyKisshtRisk(text, "social");
      return {
        platform: "Reddit",
        author: data.author || "public",
        timestamp: data.created_utc ? new Date(data.created_utc * 1000).toISOString() : null,
        text: data.title || "",
        snippet: decodeEntities(data.selftext || data.title || "").slice(0, 220),
        url: data.permalink ? `https://www.reddit.com${data.permalink}` : url,
        engagement: data.score ?? null,
        sentiment: classifyKisshtSentiment(text),
        riskFlag: risk.level !== "Low",
        matchedEntity: getMatchedEntity(text),
      };
    }).filter((item) => item.matchedEntity);
    return {
      items,
      statuses: [{
        source: "Reddit public search",
        sourceType: "social",
        reliabilityLevel: 5,
        url,
        lastFetchedAt: nowIso(),
        status: "Working",
        itemCount: items.length,
      }],
    };
  } catch {
    return {
      items: [],
      statuses: [{
        source: "Reddit public search",
        sourceType: "social",
        reliabilityLevel: 5,
        url,
        lastFetchedAt: nowIso(),
        status: "Failed",
        itemCount: 0,
        message: "Public search unavailable for this refresh.",
      }],
    };
  }
}

function buildYoutube() {
  const hasKey = Boolean(process.env.YOUTUBE_API_KEY);
  return {
    items: [],
    status: hasKey ? "YouTube API key present but fetcher not enabled in MVP" : "YouTube API required",
    sources: [{
      source: "YouTube Search",
      sourceType: "video",
      reliabilityLevel: 5,
      url: "https://www.youtube.com/results?search_query=Kissht+IPO",
      lastFetchedAt: nowIso(),
      status: hasKey ? "Manual/API required" : "Manual/API required",
      itemCount: 0,
      message: "No YouTube videos are fabricated. Add/enable YouTube Data API to fetch views and timestamps.",
    }],
  };
}

function buildSummary(news, risk, gmp, brokers, youtube, social, subscription) {
  const lastHour = Date.now() - 60 * 60 * 1000;
  const today = Date.now() - 24 * 60 * 60 * 1000;
  const recentNews = news.filter((item) => item.publishedAt && new Date(item.publishedAt).getTime() >= lastHour);
  const dayNews = news.filter((item) => !item.publishedAt || new Date(item.publishedAt).getTime() >= today);
  const sentimentSplit = {
    positive: news.filter((item) => item.sentiment === "Positive").length,
    neutral: news.filter((item) => item.sentiment === "Neutral").length,
    negative: news.filter((item) => item.sentiment === "Negative").length,
  };
  const noMajorChange = !recentNews.length && !risk.topFive.length && !gmp.current && !youtube.items.length && !social.items.length;
  return {
    hourly: {
      title: "Hourly CEO Brief",
      bullets: noMajorChange ? ["No major new development in this period."] : [
        `${recentNews.length} new public Kissht/OnEMI/SI Creva stories detected in the last hour.`,
        `${risk.topFive.length} risk-linked headlines currently in watchlist.`,
        gmp.current ? `Latest sourced GMP is Rs ${gmp.current.gmp}.` : "GMP awaited from public sources.",
        `${brokers.summary.subscribe} subscribe / ${brokers.summary.neutral} neutral / ${brokers.summary.avoid} avoid broker calls found in public sources.`,
      ],
    },
    daily: {
      title: "Daily CEO Brief",
      topDevelopments: dayNews.slice(0, 5).map((item) => ({
        headline: item.title,
        source: item.sourceName,
        url: item.url,
      })),
      sentimentSplit,
      mostImportantNegative: risk.topFive[0] || null,
      gmpTrend: gmp.current ? gmp.current.trend : "Awaited",
      subscriptionTrend: subscription.current ? "Live" : "Awaited",
      brokerSummary: brokers.summary,
      youtubeNarrative: youtube.items[0]?.title || "YouTube data unavailable without API/public feed.",
      socialNarrative: social.items[0]?.text || "No high-confidence public social chatter found.",
      irWatchouts: risk.topFive.slice(0, 3).map((item) => item.suggestedResponseAngle),
    },
  };
}

async function readCache(ignoreTtl = false) {
  try {
    const raw = await readFile(CACHE_FILE, "utf8");
    const payload = JSON.parse(raw);
    if (payload.cacheVersion !== CACHE_VERSION) return null;
    if (!ignoreTtl && payload.cache?.savedAt && Date.now() - new Date(payload.cache.savedAt).getTime() > CACHE_TTL_MS) return null;
    return payload;
  } catch {
    return null;
  }
}

async function writeCache(payload) {
  await mkdir(CACHE_DIR, { recursive: true });
  const cached = {
    ...payload,
    cacheVersion: CACHE_VERSION,
    cache: {
      cached: true,
      savedAt: nowIso(),
      ttlMinutes: 15,
      storage: process.env.VERCEL ? "/tmp runtime cache" : "data/cache/kissht-ipo.json",
    },
  };
  await writeFile(CACHE_FILE, JSON.stringify(cached, null, 2), "utf8");
  return cached;
}

async function buildKisshtIpoPayload() {
  const [{ news, statuses: newsStatuses }, social] = await Promise.all([
    withTimeout(fetchNewsSources(), 12000, "Kissht news refresh"),
    withTimeout(fetchRedditSocial(), 7000, "Kissht social refresh"),
  ]);
  const risk = buildRisk(news);
  const gmp = await buildGmp(news);
  const brokers = buildBrokerNotes(news);
  const youtube = buildYoutube();
  const subscription = buildSubscription(news);
  const summary = buildSummary(news, risk, gmp, brokers, youtube, social, subscription);
  const sourceStatus = [
    ...newsStatuses,
    ...gmp.sources,
    ...brokers.notes.map((note) => ({
      source: note.broker,
      sourceType: "broker",
      reliabilityLevel: 3,
      url: note.sourceUrl || `https://www.google.com/search?q=${encodeURIComponent(`${note.broker} Kissht IPO review`)}`,
      lastFetchedAt: nowIso(),
      status: note.sourceUrl ? "Working" : "Awaited",
      itemCount: note.sourceUrl ? 1 : 0,
    })),
    ...youtube.sources,
    ...social.statuses,
    ...subscription.sources,
  ];
  return {
    updatedAt: nowIso(),
    entities: KISSHT_ENTITY_TERMS,
    news,
    possibleMatches: [],
    risk,
    gmp,
    brokers,
    youtube,
    social,
    subscription,
    summary,
    sourceStatus,
    sourceReliability: [
      { level: 1, label: "Official / regulatory" },
      { level: 2, label: "Reputed financial media" },
      { level: 3, label: "Broker / analyst" },
      { level: 4, label: "IPO portal" },
      { level: 5, label: "YouTube / social / forums" },
    ],
  };
}

export async function getKisshtIpoSnapshot({ forceRefresh = false, allowStale = false } = {}) {
  if (!forceRefresh) {
    const cached = await readCache(allowStale);
    if (cached) return { ...cached, cache: { ...(cached.cache || {}), servedFromCache: true } };
  }
  try {
    const payload = await buildKisshtIpoPayload();
    return await writeCache(payload);
  } catch (error) {
    const cached = await readCache(true);
    if (cached) {
      return {
        ...cached,
        error: "Live refresh failed; showing last available Kissht IPO cache.",
        cache: { ...(cached.cache || {}), servedFromCache: true, refreshFailed: true, refreshError: error.message },
      };
    }
    const empty = {
      updatedAt: nowIso(),
      entities: KISSHT_ENTITY_TERMS,
      news: [],
      possibleMatches: [],
      risk: buildRisk([]),
      gmp: await buildGmp([]),
      brokers: buildBrokerNotes([]),
      youtube: buildYoutube(),
      social: { items: [], statuses: [] },
      subscription: buildSubscription([]),
      summary: buildSummary([], buildRisk([]), await buildGmp([]), buildBrokerNotes([]), buildYoutube(), { items: [] }, buildSubscription([])),
      sourceStatus: [],
      error: "Kissht IPO sources unavailable; no fabricated data shown.",
      cache: { cached: false, fallback: true, refreshError: error.message },
    };
    return empty;
  }
}

export function sliceKisshtPayload(payload, key) {
  if (key === "status") {
    return {
      updatedAt: payload.updatedAt,
      cache: payload.cache || null,
      sourceStatus: payload.sourceStatus || [],
      sourceReliability: payload.sourceReliability || [],
      error: payload.error || null,
    };
  }
  return {
    updatedAt: payload.updatedAt,
    cache: payload.cache || null,
    [key]: payload[key],
    sourceStatus: (payload.sourceStatus || []).filter((source) => source.sourceType === key || (key === "news" && ["news", "aggregator"].includes(source.sourceType))),
    error: payload.error || null,
  };
}
