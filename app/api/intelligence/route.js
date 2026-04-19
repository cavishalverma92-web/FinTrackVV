import {
  ALERTS,
  CO_LENDING_DATA,
  GLOBAL_DATA,
  GOVT_SCHEMES,
  NEWS_ITEMS,
  PEER_DATA,
  RATING_CHANGES,
  SECTOR_METRICS,
} from "../../../data/mockData";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const CACHE_DIR = process.env.VERCEL ? "/tmp" : path.join(process.cwd(), "data", "cache");
const CACHE_FILE = path.join(CACHE_DIR, "intelligence.json");
const CACHE_VERSION = 4;

const RSS_FEEDS = [
  {
    source: "RBI",
    url: "https://www.rbi.org.in/pressreleases_rss.xml",
    defaultCategory: "Regulation",
  },
  {
    source: "RBI",
    url: "https://www.rbi.org.in/notifications_rss.xml",
    defaultCategory: "Regulation",
  },
  {
    source: "SEBI",
    url: "https://www.sebi.gov.in/sebirss.xml",
    defaultCategory: "Regulation",
  },
  {
    source: "ET BFSI",
    url: "https://bfsi.economictimes.indiatimes.com/rss/topstories",
    defaultCategory: "Policy",
  },
  {
    source: "ET BFSI",
    url: "https://bfsi.economictimes.indiatimes.com/rss/recentstories",
    defaultCategory: "Policy",
  },
  {
    source: "Mint",
    url: "https://www.livemint.com/rss/companies",
    defaultCategory: "Fundraise",
  },
  {
    source: "Mint",
    url: "https://www.livemint.com/rss/markets",
    defaultCategory: "Fundraise",
  },
  {
    source: "Mint",
    url: "https://www.livemint.com/rss/money",
    defaultCategory: "Policy",
  },
  {
    source: "Mint",
    url: "https://www.livemint.com/rss/industry",
    defaultCategory: "Policy",
  },
  {
    source: "Mint",
    url: "https://www.livemint.com/rss/AI",
    defaultCategory: "AI & Tech",
  },
  {
    source: "Google News NBFC",
    url: "https://news.google.com/rss/search?q=NBFC%20India%20OR%20non%20banking%20financial%20company%20India&hl=en-IN&gl=IN&ceid=IN:en",
    defaultCategory: "Policy",
  },
  {
    source: "Google News Digital Lending",
    url: "https://news.google.com/rss/search?q=%22digital%20lending%22%20India%20OR%20KreditBee%20OR%20Moneyview%20OR%20Kissht%20OR%20Navi&hl=en-IN&gl=IN&ceid=IN:en",
    defaultCategory: "AI & Tech",
  },
  {
    source: "Google News Banks",
    url: "https://news.google.com/rss/search?q=India%20banks%20RBI%20lending%20credit%20HDFC%20ICICI%20SBI%20Axis&hl=en-IN&gl=IN&ceid=IN:en",
    defaultCategory: "Policy",
  },
  {
    source: "Google News Financial Services",
    url: "https://news.google.com/rss/search?q=%22financial%20services%22%20India%20lending%20credit%20fintech&hl=en-IN&gl=IN&ceid=IN:en",
    defaultCategory: "Fundraise",
  },
  {
    source: "Google News Business Standard",
    url: "https://news.google.com/rss/search?q=site%3Abusiness-standard.com%20%28NBFC%20OR%20banking%20OR%20finance%20OR%20RBI%20OR%20lending%29&hl=en-IN&gl=IN&ceid=IN:en",
    defaultCategory: "Policy",
  },
  {
    source: "Google News Financial Express",
    url: "https://news.google.com/rss/search?q=site%3Afinancialexpress.com%20%28banking%20OR%20finance%20OR%20NBFC%20OR%20RBI%20OR%20lending%29&hl=en-IN&gl=IN&ceid=IN:en",
    defaultCategory: "Policy",
  },
  {
    source: "Google News Moneycontrol",
    url: "https://news.google.com/rss/search?q=site%3Amoneycontrol.com%20%28banking%20OR%20finance%20OR%20NBFC%20OR%20RBI%20OR%20lending%29&hl=en-IN&gl=IN&ceid=IN:en",
    defaultCategory: "Fundraise",
  },
  {
    source: "Google News BusinessLine",
    url: "https://news.google.com/rss/search?q=site%3Athehindubusinessline.com%20%28banking%20OR%20finance%20OR%20NBFC%20OR%20RBI%20OR%20lending%29&hl=en-IN&gl=IN&ceid=IN:en",
    defaultCategory: "Policy",
  },
  {
    source: "Google News NDTV Profit",
    url: "https://news.google.com/rss/search?q=site%3Andtvprofit.com%20%28banking%20OR%20finance%20OR%20NBFC%20OR%20RBI%20OR%20lending%29&hl=en-IN&gl=IN&ceid=IN:en",
    defaultCategory: "Fundraise",
  },
  {
    source: "Google News Credit Ratings",
    url: "https://news.google.com/rss/search?q=%28CRISIL%20OR%20ICRA%20OR%20%22CARE%20Ratings%22%20OR%20%22India%20Ratings%22%29%20%28NBFC%20OR%20bank%20OR%20finance%20OR%20lender%29%20when%3A30d&hl=en-IN&gl=IN&ceid=IN:en",
    defaultCategory: "Credit Rating",
  },
  {
    source: "Google News Rating Actions",
    url: "https://news.google.com/rss/search?q=%28upgrade%20OR%20downgrade%20OR%20%22rating%20watch%22%20OR%20outlook%29%20%28NBFC%20OR%20bank%20OR%20finance%20OR%20lender%29%20when%3A30d&hl=en-IN&gl=IN&ceid=IN:en",
    defaultCategory: "Credit Rating",
  },
  {
    source: "Google News CGFMU",
    url: "https://news.google.com/rss/search?q=%28CGFMU%20OR%20%22Credit%20Guarantee%20Fund%20for%20Micro%20Units%22%20OR%20NCGTC%20OR%20%22credit%20guarantee%22%29%20%28NBFC%20OR%20MSME%20OR%20lending%29%20when%3A60d&hl=en-IN&gl=IN&ceid=IN:en",
    defaultCategory: "Policy",
  },
  {
    source: "Google News RBI Regulatory Updates",
    url: "https://news.google.com/rss/search?q=%28RBI%20OR%20SEBI%29%20%28digital%20lending%20OR%20DLG%20OR%20DLA%20OR%20co-lending%20OR%20priority%20sector%20OR%20NBFC%20regulation%29%20when%3A30d&hl=en-IN&gl=IN&ceid=IN:en",
    defaultCategory: "Regulation",
  },
];

const NEWS_APIS = [
  {
    source: "GDELT",
    url: "https://api.gdeltproject.org/api/v2/doc/doc",
  },
];

function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  return Promise.race([
    fetch(url, {
      ...options,
      signal: controller.signal,
    }),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs + 100);
    }),
  ]).finally(() => clearTimeout(timeout));
}

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

async function readIntelligenceCache() {
  try {
    const raw = await readFile(CACHE_FILE, "utf8");
    const payload = JSON.parse(raw);
    if (payload?.cacheVersion !== CACHE_VERSION) return null;
    const savedAt = payload.cache?.savedAt || payload.cache?.refreshedAt || null;
    if (savedAt && Date.now() - new Date(savedAt).getTime() > CACHE_TTL_MS) return null;
    return payload;
  } catch {
    return null;
  }
}

async function writeIntelligenceCache(payload) {
  await mkdir(CACHE_DIR, { recursive: true });
  const cachedPayload = {
    ...payload,
    cacheVersion: CACHE_VERSION,
    cache: {
      ...(payload.cache || {}),
      cached: true,
      savedAt: new Date().toISOString(),
    },
  };
  await writeFile(CACHE_FILE, JSON.stringify(cachedPayload, null, 2), "utf8");
  return cachedPayload;
}

function fallbackPayload(error) {
  return {
    newsItems: NEWS_ITEMS,
    alerts: ALERTS,
    ratingChanges: RATING_CHANGES,
    sectorMetrics: SECTOR_METRICS,
    peerData: PEER_DATA,
    globalData: GLOBAL_DATA,
    coLendingData: CO_LENDING_DATA,
    govtSchemes: GOVT_SCHEMES,
    materialUpdates: buildMaterialUpdates(NEWS_ITEMS, PEER_DATA, RATING_CHANGES),
    watchlist: buildWatchlist(NEWS_ITEMS, PEER_DATA, RATING_CHANGES),
    dailyBrief: buildDailyBrief(NEWS_ITEMS, RATING_CHANGES),
    sources: {
      rss: RSS_FEEDS.map((feed) => ({ ...feed, type: "RSS", status: "fallback", itemCount: 0, error: error.message })),
      apis: [
        ...NEWS_APIS,
        { source: "Yahoo Finance", url: "https://query1.finance.yahoo.com/v7/finance/quote" },
        { source: "Frankfurter FX", url: "https://api.frankfurter.app/latest" },
      ].map((api) => ({ ...api, type: "API", status: "fallback", itemCount: 0, error: error.message })),
    },
    sourceHealth: [],
    error: error.message,
    updatedAt: new Date().toISOString(),
    cache: {
      cached: false,
      fallback: true,
      error: error.message,
    },
  };
}

const FINANCE_SYMBOLS = [
  { name: "Bajaj Finance", symbol: "BAJFINANCE.NS", screenerSlug: "BAJFINANCE" },
  { name: "Shriram Finance", symbol: "SHRIRAMFIN.NS", screenerSlug: "SHRIRAMFIN" },
  { name: "Poonawalla Fincorp", symbol: "POONAWALLA.NS", screenerSlug: "POONAWALLA" },
  { name: "Muthoot Finance", symbol: "MUTHOOTFIN.NS", screenerSlug: "MUTHOOTFIN" },
  { name: "Manappuram Finance", symbol: "MANAPPURAM.NS", screenerSlug: "MANAPPURAM" },
  { name: "IIFL Finance", symbol: "IIFL.NS", screenerSlug: "IIFL" },
  { name: "L&T Finance", symbol: "LTF.NS", screenerSlug: "LTF" },
  { name: "Cholamandalam Investment", symbol: "CHOLAFIN.NS", screenerSlug: "CHOLAFIN" },
  { name: "Mahindra Finance", symbol: "M&MFIN.NS", screenerSlug: "M&MFIN" },
  { name: "Sundaram Finance", symbol: "SUNDARMFIN.NS", screenerSlug: "SUNDARMFIN" },
  { name: "Can Fin Homes", symbol: "CANFINHOME.NS", screenerSlug: "CANFINHOME" },
  { name: "Aavas Financiers", symbol: "AAVAS.NS", screenerSlug: "AAVAS" },
  { name: "Home First Finance", symbol: "HOMEFIRST.NS", screenerSlug: "HOMEFIRST" },
  { name: "Five-Star Business Finance", symbol: "FIVESTAR.NS", screenerSlug: "FIVESTAR" },
  { name: "CreditAccess Grameen", symbol: "CREDITACC.NS", screenerSlug: "CREDITACC" },
  { name: "Fusion Finance", symbol: "FUSION.NS", screenerSlug: "FUSION" },
  { name: "MAS Financial Services", symbol: "MASFIN.NS", screenerSlug: "MASFIN" },
  { name: "Aptus Value Housing", symbol: "APTUS.NS", screenerSlug: "APTUS" },
  { name: "Repco Home Finance", symbol: "REPCOHOME.NS", screenerSlug: "REPCOHOME" },
];

const CATEGORY_KEYWORDS = [
  { category: "Credit Rating", words: ["rating", "crisil", "icra", "care ratings", "india ratings", "upgrade", "downgrade"] },
  { category: "Fundraise", words: ["fundraise", "raises", "funding", "capital", "ipo", "ncd", "bond", "debt"] },
  { category: "Partnership", words: ["co-lending", "partnership", "partners", "tie-up", "collaboration"] },
  { category: "Risk Signal", words: ["default", "delinquency", "stress", "fraud", "npa", "gnpa", "risk"] },
  { category: "AI & Tech", words: ["ai", "artificial intelligence", "digital", "technology", "fintech", "platform"] },
  { category: "Policy", words: ["scheme", "budget", "ministry", "msme", "guarantee", "psl"] },
  { category: "Regulation", words: ["rbi", "sebi", "circular", "notification", "guideline", "regulation", "compliance"] },
];

const RELEVANCE_WORDS = [
  "nbfc",
  "lending",
  "loan",
  "credit",
  "bank",
  "finance",
  "fintech",
  "rbi",
  "sebi",
  "ncd",
  "msme",
  "co-lending",
  "rating",
  "debt",
  "bond",
  "asset quality",
  "npa",
];

const SOURCE_WEIGHTS = {
  RBI: 40,
  SEBI: 38,
  "ET BFSI": 24,
  Mint: 22,
  "Google News NBFC": 18,
  "Google News Digital Lending": 18,
  "Google News Banks": 18,
  "Google News Financial Services": 16,
  "Google News Business Standard": 18,
  "Google News Financial Express": 16,
  "Google News Moneycontrol": 18,
  "Google News BusinessLine": 18,
  "Google News NDTV Profit": 18,
  "Google News Credit Ratings": 24,
  "Google News Rating Actions": 24,
  "Google News CGFMU": 22,
  "Google News RBI Regulatory Updates": 26,
  GDELT: 12,
};

const CATEGORY_WEIGHTS = {
  Regulation: 35,
  "Risk Signal": 32,
  "Credit Rating": 28,
  Fundraise: 20,
  Partnership: 18,
  Policy: 18,
  "AI & Tech": 12,
};

function decodeEntities(value = "") {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return decodeEntities(match?.[1] || "");
}

function getLink(block) {
  const hrefMatch = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i);
  return decodeEntities(hrefMatch?.[1] || getTag(block, "link") || getTag(block, "guid"));
}

function parseFeed(xml, feed) {
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) || xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];

  return blocks.map((block) => ({
    title: getTag(block, "title"),
    description: getTag(block, "description") || getTag(block, "summary") || getTag(block, "content"),
    link: getLink(block),
    publishedAt: getTag(block, "pubDate") || getTag(block, "published") || getTag(block, "updated"),
    source: feed.source,
    defaultCategory: feed.defaultCategory,
  })).filter((item) => item.title);
}

function hashText(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function classifyCategory(text, fallback) {
  const lower = text.toLowerCase();
  if (["crisil", "icra", "care ratings", "india ratings", "rating", "upgrade", "downgrade", "outlook", "watch"].some((word) => lower.includes(word))) {
    return "Credit Rating";
  }
  if (["rbi", "sebi", "circular", "notification", "direction", "guideline", "regulation", "compliance", "penalty"].some((word) => lower.includes(word))) {
    return "Regulation";
  }
  if (["npa", "gnpa", "default", "delinquency", "fraud", "stress", "restriction", "ban"].some((word) => lower.includes(word))) {
    return "Risk Signal";
  }
  const match = CATEGORY_KEYWORDS.find(({ words }) => words.some((word) => lower.includes(word)));
  return match?.category || fallback || "Policy";
}

function classifySegment(text, category) {
  const lower = text.toLowerCase();
  if (category === "AI & Tech" || [" ai ", "artificial intelligence", "machine learning", "automation", "credit scoring"].some((word) => ` ${lower} `.includes(word))) return "AI & Tech";
  if (["moneyview", "money view", "kissht", "kreditbee", "navi", "lendingkart", "digital lending", "fintech lender", "phonepe", "paytm"].some((word) => lower.includes(word))) return "Digital Lenders";
  if (["nbfc", "non banking", "bajaj finance", "shriram finance", "muthoot", "manappuram", "iifl", "poonawalla", "tata capital", "l&t finance"].some((word) => lower.includes(word))) return "NBFCs";
  if ([" bank", "hdfc", "icici", "axis", "kotak", "sbi", "state bank", "bank of baroda", "canara", "union bank", "indusind"].some((word) => ` ${lower}`.includes(word))) return "Banks";
  return "Others";
}

function riskFor(text, category) {
  const lower = text.toLowerCase();
  if (["Risk Signal"].includes(category) || ["default", "fraud", "downgrade", "npa", "stress"].some((word) => lower.includes(word))) {
    return "High";
  }
  if (["Regulation", "Credit Rating"].includes(category)) {
    return "Medium";
  }
  return "Low";
}

function impactFor(category, risk) {
  if (risk === "High") return { nbfc: "High", digital: "Critical", investor: "High" };
  if (category === "Regulation") return { nbfc: "High", digital: "High", investor: "Medium" };
  if (category === "Credit Rating") return { nbfc: "High", digital: "Medium", investor: "High" };
  if (category === "Fundraise") return { nbfc: "Medium", digital: "High", investor: "High" };
  if (category === "Partnership") return { nbfc: "High", digital: "Medium", investor: "Medium" };
  return { nbfc: "Medium", digital: "Medium", investor: "Medium" };
}

function parseDateValue(dateValue) {
  if (!dateValue) return null;
  if (/^\d{14}$/.test(dateValue)) {
    const year = dateValue.slice(0, 4);
    const month = dateValue.slice(4, 6);
    const day = dateValue.slice(6, 8);
    const hour = dateValue.slice(8, 10);
    const minute = dateValue.slice(10, 12);
    const second = dateValue.slice(12, 14);
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
  }
  return new Date(dateValue);
}

function relativeTime(dateValue) {
  const date = parseDateValue(dateValue);
  if (!date || Number.isNaN(date.getTime())) return "Latest";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function publishedTime(item) {
  const date = parseDateValue(item.publishedAt || 0);
  return !date || Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function normalizeHeadline(value = "") {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\b(the|a|an|to|of|for|and|in|on|with|by|from|as|is|are)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(value) {
  return new Set(normalizeHeadline(value).split(" ").filter((token) => token.length > 2));
}

function headlineSimilarity(a, b) {
  const left = tokenSet(a);
  const right = tokenSet(b);
  if (!left.size || !right.size) return 0;

  const intersection = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return intersection / union;
}

function relevanceScore(item) {
  const publishedAt = publishedTime(item);
  const ageHours = publishedAt ? Math.max(0, (Date.now() - publishedAt) / 3600000) : 72;
  const recencyScore = Math.max(0, 80 - ageHours * 1.5);
  const sourceScore = SOURCE_WEIGHTS[item.source] || 16;
  const categoryScore = CATEGORY_WEIGHTS[item.category] || 10;
  const riskScore = item.risk === "High" ? 25 : item.risk === "Medium" ? 10 : 0;
  const linkScore = item.url ? 5 : 0;

  return Math.round(recencyScore + sourceScore + categoryScore + riskScore + linkScore);
}

function buildWhyMatters(category, source) {
  const notes = {
    Regulation: "Regulatory updates can change compliance cost, product design, and distribution rules for NBFCs and digital lenders.",
    "Credit Rating": "Rating actions influence borrowing costs, debt-market access, and investor perception across comparable lenders.",
    Fundraise: "Capital-market activity signals liquidity appetite and competitive intensity for Indian lending platforms.",
    Partnership: "Partnerships can shift origination economics, PSL access, customer acquisition, and risk sharing between banks and NBFCs.",
    "Risk Signal": "Early credit-stress indicators can affect underwriting, provisioning, growth appetite, and valuation multiples.",
    Policy: "Policy and scheme changes can alter guarantee cover, priority-sector flows, and the addressable market for lenders.",
    "AI & Tech": "Technology adoption can reshape credit scoring, servicing cost, fraud control, and customer onboarding speed.",
  };

  return `${notes[category] || notes.Policy} Source: ${source}.`;
}

function toNewsItem(item, index) {
  const combined = `${item.title} ${item.description}`;
  const category = classifyCategory(combined, item.defaultCategory);
  const segment = classifySegment(combined, category);
  const risk = riskFor(combined, category);
  const impact = impactFor(category, risk);
  const keywords = CATEGORY_KEYWORDS.find((entry) => entry.category === category)?.words || [];
  const tags = [category, item.source, ...keywords.slice(0, 1)].filter(Boolean);

  return {
    id: `${item.source}-${hashText(item.link || item.title)}-${index}`,
    time: relativeTime(item.publishedAt),
    source: item.source,
    segment,
    category,
    headline: item.title,
    tldr: item.description || item.title,
    whyMatters: buildWhyMatters(category, item.source),
    impactNBFC: impact.nbfc,
    impactDigital: impact.digital,
    impactInvestor: impact.investor,
    tags: [...new Set(tags)],
    risk,
    trending: risk === "High" || category === "Regulation",
    url: item.link,
    publishedAt: item.publishedAt,
    publishedTs: publishedTime(item),
  };
}

function buildAlerts(newsItems) {
  return newsItems
    .filter((item) => item.risk === "High" || item.category === "Regulation" || item.category === "Credit Rating")
    .slice(0, 5)
    .map((item) => ({
      type: item.risk === "High" ? "critical" : item.category === "Credit Rating" ? "success" : "info",
      text: item.headline,
      time: item.time,
      source: item.source,
    }));
}

const WATCHLIST_ENTITIES = [
  { name: "Bajaj Finance", group: "NBFC", keywords: ["bajaj finance", "bajfinance"] },
  { name: "Shriram Finance", group: "NBFC", keywords: ["shriram finance", "shriramfin"] },
  { name: "Poonawalla Fincorp", group: "NBFC", keywords: ["poonawalla fincorp", "poonawalla"] },
  { name: "Muthoot Finance", group: "NBFC", keywords: ["muthoot finance", "muthoot"] },
  { name: "Manappuram Finance", group: "NBFC", keywords: ["manappuram finance", "manappuram"] },
  { name: "IIFL Finance", group: "NBFC", keywords: ["iifl finance", "iifl"] },
  { name: "Cholamandalam Investment", group: "NBFC", keywords: ["cholamandalam", "cholafin"] },
  { name: "L&T Finance", group: "NBFC", keywords: ["l&t finance", "lt finance", "ltf"] },
  { name: "CreditAccess Grameen", group: "MFI", keywords: ["creditaccess", "creditaccess grameen"] },
  { name: "Five-Star Business Finance", group: "NBFC", keywords: ["five-star", "five star", "fivestar"] },
  { name: "Moneyview", group: "Digital Lender", keywords: ["moneyview", "money view"] },
  { name: "Kissht", group: "Digital Lender", keywords: ["kissht"] },
  { name: "KreditBee", group: "Digital Lender", keywords: ["kreditbee", "krazybee"] },
  { name: "Navi", group: "Digital Lender", keywords: ["navi fintech", "navi"] },
  { name: "HDFC Bank", group: "Bank", keywords: ["hdfc bank"] },
  { name: "ICICI Bank", group: "Bank", keywords: ["icici bank"] },
  { name: "SBI", group: "Bank", keywords: ["sbi", "state bank of india"] },
  { name: "Axis Bank", group: "Bank", keywords: ["axis bank"] },
];

function materialScore(item) {
  const base = Number(item.score || 0);
  const risk = item.risk === "High" ? 45 : item.risk === "Medium" ? 18 : 0;
  const category = {
    Regulation: 35,
    "Credit Rating": 32,
    "Risk Signal": 40,
    Policy: 22,
    Fundraise: 18,
    Partnership: 15,
    "AI & Tech": 10,
  }[item.category] || 8;
  const official = ["RBI", "SEBI"].includes(item.source) ? 28 : 0;

  return base + risk + category + official;
}

function buildMaterialUpdates(newsItems = [], peerData = [], ratingChanges = []) {
  const newsSignals = newsItems
    .map((item) => ({
      id: item.id,
      type: item.category || "News",
      title: item.headline,
      detail: item.tldr,
      source: item.source,
      time: item.time,
      url: item.url,
      risk: item.risk || "Low",
      score: materialScore(item),
      newsItem: item,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const ratingSignals = ratingChanges.slice(0, 3).map((rating, index) => ({
    id: `rating-${index}-${rating.entity}`,
    type: "Credit Rating",
    title: `${rating.entity}: ${rating.from} to ${rating.to}`,
    detail: rating.rationale || `${rating.outlook || "Rating"} action from ${rating.agency}.`,
    source: rating.agency,
    time: rating.date,
    risk: rating.direction === "down" ? "High" : "Medium",
    score: rating.direction === "down" ? 120 : 92,
  }));

  const marketSignals = peerData
    .filter((peer) => Math.abs(Number(peer.disbGrowth || 0)) >= 2 || Number(peer.pb || 0) >= 5)
    .sort((a, b) => Math.abs(Number(b.disbGrowth || 0)) - Math.abs(Number(a.disbGrowth || 0)))
    .slice(0, 3)
    .map((peer) => ({
      id: `market-${peer.symbol || peer.name}`,
      type: Number(peer.pb || 0) >= 5 ? "Valuation" : "Market Move",
      title: `${peer.name}: ${Number(peer.disbGrowth || 0) >= 0 ? "+" : ""}${peer.disbGrowth || 0}% today`,
      detail: `P/B ${peer.pb || "-"}x, PAT ${peer.qtrProfit || "-"} Cr, asset size ${peer.assetSize || "-"} Cr.`,
      source: peer.dataSource || "Market data",
      time: "Latest",
      url: peer.screenerUrl,
      risk: Number(peer.disbGrowth || 0) < -2 ? "Medium" : "Low",
      score: 80 + Math.abs(Number(peer.disbGrowth || 0)),
    }));

  return [...ratingSignals, ...marketSignals, ...newsSignals]
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

function buildWatchlist(newsItems = [], peerData = [], ratingChanges = []) {
  return WATCHLIST_ENTITIES.map((entity) => {
    const matches = newsItems.filter((item) => {
      const text = `${item.headline} ${item.tldr} ${item.tags?.join(" ") || ""}`.toLowerCase();
      return entity.keywords.some((keyword) => text.includes(keyword));
    });
    const financial = peerData.find((peer) => entity.keywords.some((keyword) => peer.name.toLowerCase().includes(keyword.replace(" finance", ""))));
    const rating = ratingChanges.find((item) => {
      const text = `${item.entity} ${item.rationale || ""}`.toLowerCase();
      return entity.keywords.some((keyword) => text.includes(keyword));
    });
    const highRisk = matches.some((item) => item.risk === "High") || rating?.direction === "down";
    const mediumRisk = highRisk || matches.some((item) => ["Regulation", "Credit Rating", "Risk Signal"].includes(item.category));

    return {
      name: entity.name,
      group: entity.group,
      status: highRisk ? "Monitor" : mediumRisk ? "Watch" : "Quiet",
      risk: highRisk ? "High" : mediumRisk ? "Medium" : "Low",
      updates: matches.length,
      latestHeadline: matches[0]?.headline || rating?.rationale || "No material update in current refresh.",
      price: financial?.price || 0,
      marketCap: financial?.marketCap || 0,
      pb: financial?.pb || 0,
      qtrProfit: financial?.qtrProfit || 0,
      assetSize: financial?.assetSize || 0,
      screenerUrl: financial?.screenerUrl || null,
    };
  }).sort((a, b) => {
    const riskRank = { High: 3, Medium: 2, Low: 1 };
    if (riskRank[b.risk] !== riskRank[a.risk]) return riskRank[b.risk] - riskRank[a.risk];
    return b.updates - a.updates;
  });
}

function buildRatingChanges(newsItems) {
  return newsItems
    .filter((item) => item.category === "Credit Rating")
    .slice(0, 8)
    .map((item) => {
      const lower = item.headline.toLowerCase();
      const direction = lower.includes("downgrade") || lower.includes("negative") ? "down" : "up";
      return {
        entity: item.headline.split(/[:|-|—]/)[0].slice(0, 48),
        from: "Watch",
        to: direction === "up" ? "Positive" : "Negative",
        outlook: direction === "up" ? "Positive" : "Watch",
        agency: item.source,
        direction,
        date: item.time,
        rationale: item.tldr,
      };
    });
}

async function fetchRssNews() {
  const results = await Promise.allSettled(RSS_FEEDS.map(async (feed) => {
    const response = await fetchWithTimeout(feed.url, {
      headers: { "User-Agent": "LendingIQ/1.0 (+https://localhost)" },
      next: { revalidate: 900 },
    }, 5000);

    if (!response.ok) throw new Error(`${feed.source} returned ${response.status}`);
    return parseFeed(await response.text(), feed);
  }));

  const health = results.map((result, index) => ({
    ...RSS_FEEDS[index],
    type: "RSS",
    status: result.status === "fulfilled" ? "ok" : "error",
    itemCount: result.status === "fulfilled" ? result.value.length : 0,
    error: result.status === "rejected" ? result.reason?.message || "Source failed" : null,
  }));
  const rawItems = results.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  const seen = new Set();
  const now = Date.now();
  const recentItems = rawItems.filter((item) => {
    const time = publishedTime(item);
    if (!time) return true;
    return now - time <= 45 * 24 * 60 * 60 * 1000;
  });
  const relevant = recentItems
    .filter((item) => {
      const text = `${item.title} ${item.description}`.toLowerCase();
      return RELEVANCE_WORDS.some((word) => text.includes(word));
    })
    .filter((item) => {
      const key = item.link || item.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => publishedTime(b) - publishedTime(a));

  return {
    items: relevant.slice(0, 36).map(toNewsItem),
    health,
  };
}

async function fetchGdeltNews() {
  const query = encodeURIComponent('(NBFC OR "digital lending" OR fintech OR "co-lending" OR "Reserve Bank of India" OR SEBI) (India OR Indian)');
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=ArtList&format=json&maxrecords=30&sort=HybridRel`;
  const response = await fetchWithTimeout(url, { next: { revalidate: 900 } }, 6000);
  if (!response.ok) throw new Error(`GDELT returned ${response.status}`);

  const json = await response.json();
  const articles = json?.articles || [];
  return articles.map((article, index) => toNewsItem({
    title: article.title,
    description: article.seendate ? `Discovered by GDELT on ${article.seendate}.` : "Discovered by GDELT.",
    link: article.url,
    publishedAt: article.seendate,
    source: article.sourceCommonName || "GDELT",
    defaultCategory: "Policy",
  }, index));
}

function dedupeAndRankNews(items) {
  const ranked = items
    .map((item) => ({ ...item, score: relevanceScore(item) }))
    .sort((a, b) => b.score - a.score);
  const deduped = [];

  for (const item of ranked) {
    const duplicate = deduped.some((candidate) => {
      if ((candidate.url || "") && candidate.url === item.url) return true;
      return headlineSimilarity(candidate.headline, item.headline) >= 0.72;
    });

    if (!duplicate) deduped.push(item);
  }

  return deduped
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.publishedTs || 0) - (a.publishedTs || 0);
    })
    .slice(0, 40);
}

async function fetchMarketData() {
  const symbols = FINANCE_SYMBOLS.map((item) => item.symbol).join(",");
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}`;
  let marketSource = "Yahoo Finance Quote";
  let peerData = [];

  try {
    const response = await fetchWithTimeout(url, { next: { revalidate: 900 } }, 5000);
    if (!response.ok) throw new Error(`Yahoo Finance returned ${response.status}`);

    const json = await response.json();
    const quotes = json?.quoteResponse?.result || [];

    peerData = quotes.map((quote) => {
      const meta = FINANCE_SYMBOLS.find((item) => item.symbol === quote.symbol);
      const changePercent = Number(quote.regularMarketChangePercent || 0);

      return {
        name: meta?.name || quote.shortName || quote.symbol,
        aum: Math.round(Number(quote.marketCap || 0) / 10000000),
        gnpa: 0,
        roe: 0,
        cof: 0,
        pe: Number(quote.trailingPE || quote.forwardPE || 0).toFixed(1),
        disbGrowth: Number(changePercent.toFixed(2)),
        price: Number(quote.regularMarketPrice || 0),
        marketCap: Math.round(Number(quote.marketCap || 0) / 10000000),
        symbol: quote.symbol,
      };
    }).filter((item) => item.price > 0);
  } catch (error) {
    peerData = await fetchYahooChartData();
    marketSource = "Yahoo Finance Chart";
  }

  if (!peerData.length) {
    throw new Error("Market data unavailable from Yahoo quote and chart endpoints");
  }

  const screenerData = await fetchScreenerData();
  peerData = peerData.map((peer) => {
    const meta = FINANCE_SYMBOLS.find((item) => item.symbol === peer.symbol);
    const screener = screenerData[meta?.screenerSlug] || {};
    return {
      ...peer,
      aum: peer.aum || screener.marketCap || 0,
      marketCap: peer.marketCap || peer.aum || screener.marketCap || 0,
      price: peer.price || screener.currentPrice || 0,
      pe: peer.pe || screener.pe || 0,
      pb: screener.pb || ((peer.price || screener.currentPrice) && screener.bookValue ? Number(((peer.price || screener.currentPrice) / screener.bookValue).toFixed(2)) : 0),
      roe: screener.roe || peer.roe,
      roce: screener.roce || 0,
      qtrProfit: screener.qtrProfit || 0,
      qtrSales: screener.qtrSales || 0,
      bookValue: screener.bookValue || 0,
      dividendYield: screener.dividendYield || 0,
      debtToEquity: screener.debtToEquity || 0,
      assetSize: screener.assetSize || 0,
      screenerUrl: meta?.screenerSlug ? `https://www.screener.in/company/${meta.screenerSlug}/consolidated/` : null,
      dataSource: screener.source || marketSource,
    };
  });

  const avgMove = peerData.length
    ? peerData.reduce((sum, item) => sum + Number(item.disbGrowth || 0), 0) / peerData.length
    : 0;
  const totalMarketCapCr = peerData.reduce((sum, item) => sum + Number(item.aum || 0), 0);

  const sectorMetrics = [
    {
      label: "Tracked Mkt Cap",
      value: `₹${(totalMarketCapCr / 100000).toFixed(1)}L Cr`,
      change: `${avgMove >= 0 ? "+" : ""}${avgMove.toFixed(2)}% today`,
      up: avgMove >= 0,
      sparkData: [0, avgMove / 4, avgMove / 3, avgMove / 2, avgMove],
    },
    {
      label: "Avg Daily Move",
      value: `${avgMove >= 0 ? "+" : ""}${avgMove.toFixed(2)}%`,
      change: marketSource,
      up: avgMove >= 0,
      sparkData: peerData.slice(0, 7).map((item) => Number(item.disbGrowth || 0)),
    },
    {
      label: "Listed Lenders",
      value: String(peerData.length),
      change: "Live symbols",
      up: true,
      sparkData: [peerData.length - 2, peerData.length - 1, peerData.length],
    },
  ];

  return { peerData, sectorMetrics, marketSource };
}

function extractScreenerNumber(html, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`${escaped}[\\s\\S]{0,220}?class=["']number["'][^>]*>([^<]+)<`, "i"),
    new RegExp(`${escaped}[\\s\\S]{0,220}?<span[^>]*>([-+₹,\\.\\d]+)`, "i"),
    new RegExp(`${escaped}\\s+₹?\\s*([-+,\\.\\d]+)`, "i"),
  ];
  const text = decodeEntities(html).replace(/\s+/g, " ");
  for (const pattern of patterns) {
    const match = html.match(pattern) || text.match(pattern);
    if (match?.[1]) return Number(decodeEntities(match[1]).replace(/[₹,%Cr,\s]/g, ""));
  }
  return 0;
}

function extractLatestRowNumber(html, label) {
  const text = decodeEntities(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`${escaped}\\s*(?:\\+)?\\s+([-+\\d,\\.\\s%]+?)(?=\\s+[A-Za-z][A-Za-z /%+]{2,}|$)`, "i"));
  if (!match?.[1]) return 0;
  const values = match[1]
    .match(/-?\d[\d,]*(?:\.\d+)?/g)
    ?.map((value) => Number(value.replace(/,/g, "")))
    .filter((value) => Number.isFinite(value));
  return values?.at(-1) || 0;
}

async function fetchScreenerData() {
  const results = await Promise.allSettled(FINANCE_SYMBOLS.map(async (item) => {
    if (!item.screenerSlug) return null;
    const url = `https://www.screener.in/company/${item.screenerSlug}/consolidated/`;
    const response = await fetchWithTimeout(url, {
      headers: { "User-Agent": "Mozilla/5.0 LendingIQ/1.0" },
      next: { revalidate: 3600 },
    }, 5000);
    if (!response.ok) throw new Error(`Screener ${item.screenerSlug} returned ${response.status}`);
    const html = await response.text();
    return {
      slug: item.screenerSlug,
      source: "Screener",
      marketCap: extractScreenerNumber(html, "Market Cap"),
      currentPrice: extractScreenerNumber(html, "Current Price"),
      pe: extractScreenerNumber(html, "Stock P/E"),
      pb: extractScreenerNumber(html, "Price to book value") || extractScreenerNumber(html, "P/B"),
      bookValue: extractScreenerNumber(html, "Book Value"),
      dividendYield: extractScreenerNumber(html, "Dividend Yield"),
      roe: extractScreenerNumber(html, "ROE"),
      roce: extractScreenerNumber(html, "ROCE"),
      qtrProfit: extractLatestRowNumber(html, "Net Profit") || extractScreenerNumber(html, "Net Profit"),
      qtrSales: extractLatestRowNumber(html, "Revenue") || extractLatestRowNumber(html, "Sales") || extractScreenerNumber(html, "Sales"),
      debtToEquity: extractScreenerNumber(html, "Debt to equity"),
      assetSize: extractLatestRowNumber(html, "Total Assets") || extractScreenerNumber(html, "Total Assets") || extractScreenerNumber(html, "Assets"),
    };
  }));

  return Object.fromEntries(results
    .filter((result) => result.status === "fulfilled" && result.value?.slug)
    .map((result) => [result.value.slug, result.value]));
}

async function fetchYahooChartData() {
  const results = await Promise.allSettled(FINANCE_SYMBOLS.map(async (item) => {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(item.symbol)}?range=5d&interval=1d`;
    const response = await fetchWithTimeout(url, { next: { revalidate: 900 } }, 5000);
    if (!response.ok) throw new Error(`${item.symbol} chart returned ${response.status}`);

    const json = await response.json();
    const result = json?.chart?.result?.[0];
    const quote = result?.indicators?.quote?.[0];
    const closes = result?.indicators?.adjclose?.[0]?.adjclose || quote?.close || [];
    const validCloses = closes.filter((value) => Number.isFinite(Number(value)));
    const latest = Number(validCloses.at(-1) || 0);
    const previous = Number(validCloses.at(-2) || latest);
    const changePercent = previous ? ((latest - previous) / previous) * 100 : 0;

    return {
      name: item.name,
      aum: 0,
      gnpa: 0,
      roe: 0,
      cof: 0,
      pe: 0,
      disbGrowth: Number(changePercent.toFixed(2)),
      price: Number(latest.toFixed(2)),
      marketCap: 0,
      symbol: item.symbol,
    };
  }));

  return results
    .filter((result) => result.status === "fulfilled" && result.value.price > 0)
    .map((result) => result.value);
}

async function fetchFredSeries(seriesId) {
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${seriesId}`;
  const response = await fetchWithTimeout(url, {
    headers: { "User-Agent": "LendingIQ/1.0" },
  }, 8000);
  if (!response.ok) throw new Error(`FRED ${seriesId} returned ${response.status}`);
  const text = await response.text();
  const lines = text.trim().split("\n").filter((line) => !line.startsWith("DATE") && line.includes(","));
  const last = lines[lines.length - 1];
  const [date, value] = last.split(",");
  const parsed = parseFloat(value);
  if (Number.isNaN(parsed)) throw new Error(`FRED ${seriesId}: invalid value "${value}"`);
  return { date: date?.trim(), value: parsed };
}

async function fetchGlobalData() {
  const [fxResult, fedRateResult, us10yResult, indiaRateResult] = await Promise.allSettled([
    fetchWithTimeout("https://api.frankfurter.app/latest?from=USD&to=INR,GBP,EUR", {
      next: { revalidate: 1800 },
    }, 5000).then((r) => { if (!r.ok) throw new Error(`Frankfurter ${r.status}`); return r.json(); }),
    fetchFredSeries("FEDFUNDS"),
    fetchFredSeries("DGS10"),
    fetchFredSeries("IRSTCI01INM156N"),
  ]);

  const fxJson = fxResult.status === "fulfilled" ? fxResult.value : null;
  const inr = fxJson ? Number(fxJson.rates?.INR || 0) : 0;
  const gbp = fxJson ? Number(fxJson.rates?.GBP || 0) : 0;
  const eur = fxJson ? Number(fxJson.rates?.EUR || 0) : 0;
  const fxDate = fxJson?.date || "Latest";

  const fedRate = fedRateResult.status === "fulfilled" ? fedRateResult.value : null;
  const us10y = us10yResult.status === "fulfilled" ? us10yResult.value : null;
  const indiaRate = indiaRateResult.status === "fulfilled" ? indiaRateResult.value : null;

  const indicators = [];

  if (inr) {
    indicators.push({
      indicator: "USD/INR",
      value: inr.toFixed(2),
      trend: fxDate,
      signal: inr > 85 ? "Caution" : inr > 84 ? "Neutral" : "Positive",
      detail: "Live FX from Frankfurter (ECB reference rates). Rupee weakness raises offshore borrowing costs and pressures FPI flows into Indian lending paper.",
    });
  }

  if (indiaRate) {
    const signal = indiaRate.value >= 6.5 ? "Hawkish" : indiaRate.value <= 5.5 ? "Dovish" : "Neutral";
    indicators.push({
      indicator: "RBI Repo Rate",
      value: `${indiaRate.value.toFixed(2)}%`,
      trend: indiaRate.date,
      signal,
      detail: `RBI policy repo rate from FRED (St. Louis Fed — India short-term rate series). Directly sets the floor for NBFC borrowing costs, NIM, and retail lending rates across the sector.`,
    });
  }

  if (fedRate) {
    const signal = fedRate.value >= 5.25 ? "Hawkish" : fedRate.value >= 4 ? "Neutral" : "Dovish";
    indicators.push({
      indicator: "US Fed Funds Rate",
      value: `${fedRate.value.toFixed(2)}%`,
      trend: fedRate.date,
      signal,
      detail: `Federal Funds Rate from FRED (St. Louis Fed). ${signal} stance. Higher US rates strengthen the dollar, pressure INR, and raise India's offshore borrowing costs for NBFCs and MFIs.`,
    });
  }

  if (us10y) {
    const signal = us10y.value >= 4.5 ? "Hawkish" : us10y.value <= 3.5 ? "Dovish" : "Neutral";
    indicators.push({
      indicator: "US 10Y Treasury",
      value: `${us10y.value.toFixed(2)}%`,
      trend: us10y.date,
      signal,
      detail: "US 10-year yield from FRED. Rising yields tighten global liquidity and reduce FPI appetite for EM debt including Indian G-Sec and NBFC paper.",
    });
  }

  if (gbp && inr) {
    indicators.push({
      indicator: "GBP/USD",
      value: (1 / gbp).toFixed(4),
      trend: fxDate,
      signal: "Neutral",
      detail: "Sterling-Dollar cross from Frankfurter ECB reference. Proxy for global dollar conditions and UK-EU risk appetite — a useful leading indicator for international capital flows.",
    });
  }

  if (eur && inr) {
    indicators.push({
      indicator: "EUR/INR",
      value: (inr / eur).toFixed(2),
      trend: fxDate,
      signal: "Neutral",
      detail: "Euro-Rupee cross computed from Frankfurter ECB rates. Tracks European capital market conditions and ECB policy impact on global currency flows into India.",
    });
  }

  if (!indicators.length) throw new Error("All global data sources failed");
  return indicators;
}

function buildDailyBrief(newsItems, ratingChanges) {
  const highRisk = newsItems.find((item) => item.risk === "High");
  const regulation = newsItems.find((item) => item.category === "Regulation");
  const rating = ratingChanges[0];

  return {
    marketPulse: [
      regulation?.headline,
      highRisk?.headline,
      rating ? `${rating.entity} rating signal from ${rating.agency}` : null,
    ].filter(Boolean).join(" "),
    riskSignals: newsItems
      .filter((item) => item.risk === "High" || item.category === "Risk Signal")
      .slice(0, 3)
      .map((item) => item.headline),
    opportunities: newsItems
      .filter((item) => ["Fundraise", "Partnership", "Policy", "AI & Tech"].includes(item.category))
      .slice(0, 3)
      .map((item) => item.headline),
  };
}

function buildCoLendingData(newsItems) {
  return newsItems
    .filter((item) => item.category === "Partnership" || item.headline.toLowerCase().includes("co-lending"))
    .slice(0, 8)
    .map((item) => ({
      bank: item.source,
      nbfc: item.headline.split(/ with | partners? | tie-up |:/i)[1]?.slice(0, 44) || "NBFC / lending partner",
      segment: item.tags?.find((tag) => !["Partnership", item.source].includes(tag)) || "Lending",
      volume: "Reported",
      status: item.time === "Just now" || item.time.includes("m ago") || item.time.includes("h ago") ? "New" : "Active",
      startDate: item.time,
      geography: "India",
      headline: item.headline,
    }));
}

function buildGovtSchemes(newsItems) {
  const liveUpdates = newsItems
    .filter((item) => {
      const text = `${item.headline} ${item.tldr} ${item.tags?.join(" ") || ""}`.toLowerCase();
      return [
        "cgfmu",
        "credit guarantee",
        "ncgtc",
        "msme",
        "scheme",
        "priority sector",
        "psl",
        "co-lending",
        "digital lending",
        "dlg",
        "dla",
        "rbi",
        "sebi",
        "regulation",
        "circular",
        "guideline",
        "direction",
      ].some((word) => text.includes(word));
    })
    .slice(0, 8)
    .map((item) => ({
      scheme: item.headline,
      coverage: "See source",
      guarantee: "See source",
      validTill: item.time,
      eligibleEntities: item.segment === "Banks" ? "Banks and regulated entities" : "NBFCs, banks, MFIs, MSMEs, or regulated entities as specified",
      totalApprovals: item.source,
      impactOnCreditCost: item.risk === "High" ? "Monitor" : "Potential support",
      status: item.category === "Regulation" ? "Regulatory Update" : item.time.includes("m ago") || item.time.includes("h ago") ? "New Update" : "Active & Growing",
      source: item.source,
      summary: item.tldr,
      url: item.url,
    }));

  return [
    {
      scheme: "CGFMU (Credit Guarantee Fund for Micro Units)",
      coverage: "Up to eligible micro-unit limits",
      guarantee: "Scheme-linked guarantee cover",
      validTill: "Track NCGTC / Ministry updates",
      eligibleEntities: "Eligible micro borrowers through member lending institutions including banks, NBFCs and MFIs",
      totalApprovals: "NCGTC / Ministry source",
      impactOnCreditCost: "Can reduce loss given default for eligible MSME/micro loans",
      status: "Core Scheme",
      source: "NCGTC / Ministry of Finance",
      summary: "Pinned scheme to monitor credit guarantee support for micro and MSME lending. Live CGFMU news and changes appear below.",
      url: "https://www.ncgtc.in/",
    },
    {
      scheme: "RBI Digital Lending / DLG / DLA Updates",
      coverage: "Digital lending compliance",
      guarantee: "DLG and LSP rules where applicable",
      validTill: "Ongoing",
      eligibleEntities: "Regulated entities, lending service providers and digital lending apps",
      totalApprovals: "RBI source",
      impactOnCreditCost: "Impacts partnerships, disclosures, loss guarantees and customer protection controls",
      status: "Regulatory Watch",
      source: "RBI",
      summary: "Pinned radar for RBI digital lending directions, default loss guarantee rules, DLA reporting and LSP governance.",
      url: "https://www.rbi.org.in/Scripts/BS_CircularIndexDisplay.aspx",
    },
    ...liveUpdates,
  ].slice(0, 10);
}

async function buildIntelligencePayload() {
    const [rssNewsResult, gdeltNewsResult, marketResult, globalResult] = await Promise.allSettled([
      fetchRssNews(),
      fetchGdeltNews(),
      fetchMarketData(),
      fetchGlobalData(),
    ]);

    const rssItems = rssNewsResult.status === "fulfilled" ? rssNewsResult.value.items : [];
    const rssHealth = rssNewsResult.status === "fulfilled"
      ? rssNewsResult.value.health
      : RSS_FEEDS.map((feed) => ({
          ...feed,
          type: "RSS",
          status: "error",
          itemCount: 0,
          error: rssNewsResult.reason?.message || "RSS refresh failed",
        }));
    const gdeltItems = gdeltNewsResult.status === "fulfilled" ? gdeltNewsResult.value : [];
    const dedupedNews = dedupeAndRankNews([...rssItems, ...gdeltItems]);
    const newsItems = dedupedNews.length
      ? dedupedNews
      : NEWS_ITEMS;
    const apiHealth = [
      {
        ...NEWS_APIS[0],
        type: "API",
        status: gdeltNewsResult.status === "fulfilled" ? "ok" : "error",
        itemCount: gdeltNewsResult.status === "fulfilled" ? gdeltNewsResult.value.length : 0,
        error: gdeltNewsResult.status === "rejected" ? gdeltNewsResult.reason?.message || "GDELT failed" : null,
      },
      {
        source: marketResult.status === "fulfilled" ? marketResult.value.marketSource : "Yahoo Finance",
        url: marketResult.status === "fulfilled" && marketResult.value.marketSource === "Yahoo Finance Chart"
          ? "https://query1.finance.yahoo.com/v8/finance/chart"
          : "https://query1.finance.yahoo.com/v7/finance/quote",
        type: "API",
        status: marketResult.status === "fulfilled" ? "ok" : "error",
        itemCount: marketResult.status === "fulfilled" ? marketResult.value.peerData.length : 0,
        error: marketResult.status === "rejected" ? marketResult.reason?.message || "Market data failed" : null,
      },
      {
        source: "Frankfurter FX",
        url: "https://api.frankfurter.app/latest",
        type: "API",
        status: globalResult.status === "fulfilled" ? "ok" : "error",
        itemCount: globalResult.status === "fulfilled" ? globalResult.value.length : 0,
        error: globalResult.status === "rejected" ? globalResult.reason?.message || "FX data failed" : null,
      },
    ];
    const market = marketResult.status === "fulfilled" && marketResult.value.peerData.length
      ? marketResult.value
      : { peerData: PEER_DATA, sectorMetrics: SECTOR_METRICS };
    const globalData = globalResult.status === "fulfilled" ? globalResult.value : GLOBAL_DATA;
    const ratingChanges = buildRatingChanges(newsItems);
    const resolvedRatings = ratingChanges.length ? ratingChanges : RATING_CHANGES;
    const alerts = buildAlerts(newsItems);
    const coLendingData = buildCoLendingData(newsItems);
    const govtSchemes = buildGovtSchemes(newsItems);
    const materialUpdates = buildMaterialUpdates(newsItems, market.peerData, resolvedRatings);
    const watchlist = buildWatchlist(newsItems, market.peerData, resolvedRatings);

    return {
      newsItems,
      alerts: alerts.length ? alerts : ALERTS,
      ratingChanges: resolvedRatings,
      sectorMetrics: market.sectorMetrics,
      peerData: market.peerData,
      globalData,
      coLendingData: coLendingData.length ? coLendingData : CO_LENDING_DATA,
      govtSchemes: govtSchemes.length ? govtSchemes : GOVT_SCHEMES,
      materialUpdates,
      watchlist,
      dailyBrief: buildDailyBrief(newsItems, resolvedRatings),
      sources: {
        rss: rssHealth,
        apis: apiHealth,
      },
      sourceHealth: [...rssHealth, ...apiHealth],
      updatedAt: new Date().toISOString(),
      cache: {
        cached: false,
        refreshedAt: new Date().toISOString(),
      },
    };
}

export async function GET(request) {
  const url = new URL(request.url);
  const forceRefresh = url.searchParams.has("refresh");

  if (!forceRefresh) {
    const cached = await readIntelligenceCache();
    if (cached) {
      return Response.json({
        ...cached,
        cache: {
          ...(cached.cache || {}),
          servedFromCache: true,
        },
      });
    }
  }

  try {
    const payload = await buildIntelligencePayload();
    return Response.json(await writeIntelligenceCache(payload));
  } catch (error) {
    const cached = await readIntelligenceCache();
    if (cached) {
      return Response.json({
        ...cached,
        error: error.message,
        cache: {
          ...(cached.cache || {}),
          servedFromCache: true,
          refreshFailed: true,
          refreshError: error.message,
        },
      });
    }

    return Response.json(fallbackPayload(error), { status: 200 });
  }
}

export async function POST() {
  try {
    const payload = await buildIntelligencePayload();
    return Response.json(await writeIntelligenceCache(payload));
  } catch (error) {
    const cached = await readIntelligenceCache();
    if (cached) {
      return Response.json({
        ...cached,
        error: error.message,
        cache: {
          ...(cached.cache || {}),
          servedFromCache: true,
          refreshFailed: true,
          refreshError: error.message,
        },
      });
    }

    return Response.json(fallbackPayload(error), { status: 200 });
  }
}
