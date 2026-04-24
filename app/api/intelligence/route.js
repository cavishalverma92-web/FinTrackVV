import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { Redis } from "@upstash/redis";
import {
  ALERTS,
  CO_LENDING_DATA,
  GLOBAL_DATA,
  GOVT_SCHEMES,
  NEWS_ITEMS,
  PEER_DATA,
  RATING_CHANGES,
  SECTOR_METRICS,
} from "../../../data/mockData.js";
import { slugify, withArticleSlugs } from "../../lib/content.js";

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

const REDIS_NEWS_KEY = "lendingiq:news:archive";
const REDIS_BRIEF_PREFIX = "lendingiq:brief:";
const ARCHIVE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

async function loadNewsArchive() {
  if (!redis) return [];
  try {
    const data = await redis.get(REDIS_NEWS_KEY);
    if (!Array.isArray(data)) return [];
    const cutoff = Date.now() - ARCHIVE_TTL_MS;
    return data.filter((item) => !shouldExcludePortalItem(item) && item.publishedTs && item.publishedTs > cutoff);
  } catch {
    return [];
  }
}

async function saveNewsArchive(freshItems) {
  if (!redis) return;
  try {
    const existing = await loadNewsArchive();
    const seenIds = new Set();
    const merged = [...freshItems, ...existing].filter((item) => {
      if (shouldExcludePortalItem(item)) return false;
      if (!item.id || seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      const cutoff = Date.now() - ARCHIVE_TTL_MS;
      return item.publishedTs && item.publishedTs > cutoff;
    });
    // Store for 25h (Redis TTL) so we never lose items mid-window
    await redis.set(REDIS_NEWS_KEY, merged, { ex: 25 * 60 * 60 });
  } catch {
    // fail silently — fresh items still served
  }
}

async function loadCachedBrief(hash) {
  if (!redis || !hash) return null;
  try {
    return await redis.get(`${REDIS_BRIEF_PREFIX}${hash}`);
  } catch {
    return null;
  }
}

async function saveCachedBrief(hash, brief) {
  if (!redis || !hash || !brief) return;
  try {
    await redis.set(`${REDIS_BRIEF_PREFIX}${hash}`, brief, { ex: 25 * 60 * 60 });
  } catch {
    // no-op
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const CACHE_DIR = process.env.VERCEL ? "/tmp" : path.join(process.cwd(), "data", "cache");
const CACHE_FILE = path.join(CACHE_DIR, "intelligence.json");
const CACHE_VERSION = 14;

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
    source: "Google News Insurance Regulation",
    url: "https://news.google.com/rss/search?q=%28IRDAI%20OR%20insurance%20regulator%29%20%28insurance%20OR%20insurtech%20OR%20broker%29%20India%20when%3A30d&hl=en-IN&gl=IN&ceid=IN:en",
    defaultCategory: "Regulation",
  },
  {
    source: "Google News Pension IFSCA Regulation",
    url: "https://news.google.com/rss/search?q=%28PFRDA%20OR%20IFSCA%20OR%20GIFT%20City%29%20%28financial%20services%20OR%20fund%20OR%20insurance%20OR%20fintech%29%20India%20when%3A30d&hl=en-IN&gl=IN&ceid=IN:en",
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
    url: "https://news.google.com/rss/search?q=%28%22digital%20lending%22%20OR%20KreditBee%20OR%20MoneyView%20OR%20Kissht%20OR%20%22Navi%20Technologies%22%20OR%20%22Navi%20fintech%22%20OR%20%22Navi%20loan%22%20OR%20%22Sachin%20Bansal%20Navi%22%29%20India&hl=en-IN&gl=IN&ceid=IN:en",
    defaultCategory: "Fundraise",
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
    source: "BusinessLine",
    url: "https://www.thehindubusinessline.com/money-and-banking/feeder/default.rss",
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
    source: "Google News Acuite Brickwork Ratings",
    url: "https://news.google.com/rss/search?q=%28Acuite%20OR%20Acuit%C3%A9%20OR%20Brickwork%20Ratings%29%20%28NBFC%20OR%20bank%20OR%20finance%20OR%20lender%29%20when%3A30d&hl=en-IN&gl=IN&ceid=IN:en",
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
  {
    source: "BQ Prime",
    url: "https://news.google.com/rss/search?q=site%3Abqprime.com%20%28NBFC%20OR%20banking%20OR%20finance%20OR%20RBI%20OR%20lending%20OR%20credit%29&hl=en-IN&gl=IN&ceid=IN:en",
    defaultCategory: "Policy",
  },
  {
    source: "PIB",
    url: "https://pib.gov.in/RssMain.aspx",
    defaultCategory: "Policy",
  },
  {
    source: "Inc42",
    url: "https://inc42.com/feed/",
    defaultCategory: "Fundraise",
  },
  {
    source: "Google News MFI",
    url: "https://news.google.com/rss/search?q=%28microfinance%20OR%20%22NBFC-MFI%22%20OR%20%22micro%20finance%20institution%22%20OR%20%22MFI%20India%22%20OR%20%22Jana%20Small%20Finance%22%20OR%20Arohan%20OR%20CreditAccess%29%20India%20when%3A30d&hl=en-IN&gl=IN&ceid=IN:en",
    defaultCategory: "Risk Signal",
  },
  {
    source: "Google News MSME Lending",
    url: "https://news.google.com/rss/search?q=%28%22MSME%20lending%22%20OR%20%22SME%20finance%22%20OR%20%22small%20business%20loan%22%20OR%20%22MSME%20credit%22%20OR%20SIDBI%20OR%20%22MSME%20sector%22%29%20India%20when%3A30d&hl=en-IN&gl=IN&ceid=IN:en",
    defaultCategory: "Policy",
  },
  {
    source: "Google News Housing Finance",
    url: "https://news.google.com/rss/search?q=%28%22housing%20finance%22%20OR%20HFC%20OR%20%22home%20loan%22%20OR%20%22National%20Housing%20Bank%22%20OR%20NHB%20OR%20%22affordable%20housing%22%29%20India%20NBFC%20when%3A30d&hl=en-IN&gl=IN&ceid=IN:en",
    defaultCategory: "Policy",
  },
  {
    source: "Google News NCD Bond",
    url: "https://news.google.com/rss/search?q=%28NCD%20OR%20%22non%20convertible%20debenture%22%20OR%20%22bond%20issuance%22%20OR%20%22debt%20raise%22%20OR%20%22commercial%20paper%22%29%20%28NBFC%20OR%20lender%20OR%20finance%29%20India%20when%3A30d&hl=en-IN&gl=IN&ceid=IN:en",
    defaultCategory: "Fundraise",
  },
  {
    source: "VCCircle",
    url: "https://news.google.com/rss/search?q=site%3Avcircle.com%20%28fintech%20OR%20lending%20OR%20NBFC%20OR%20credit%20OR%20finance%29&hl=en-IN&gl=IN&ceid=IN:en",
    defaultCategory: "Fundraise",
  },
  {
    source: "Google News SIDBI",
    url: "https://news.google.com/rss/search?q=%28SIDBI%20OR%20%22Small%20Industries%20Development%20Bank%22%29%20%28lending%20OR%20MSME%20OR%20co-lending%20OR%20refinance%20OR%20credit%29%20when%3A60d&hl=en-IN&gl=IN&ceid=IN:en",
    defaultCategory: "Policy",
  },
  {
    source: "Google News NHB",
    url: "https://news.google.com/rss/search?q=%28NHB%20OR%20%22National%20Housing%20Bank%22%29%20%28circular%20OR%20lending%20OR%20housing%20finance%20OR%20regulation%20OR%20HFC%29%20when%3A60d&hl=en-IN&gl=IN&ceid=IN:en",
    defaultCategory: "Regulation",
  },
  // ── Digital Lenders ──
  {
    source: "Google News Digital Lenders",
    url: "https://news.google.com/rss/search?q=%28KreditBee%20OR%20MoneyView%20OR%20Kissht%20OR%20Navi%20OR%20Fibe%20OR%20%22Early%20Salary%22%20OR%20StashFin%20OR%20CASHe%20OR%20LazyPay%20OR%20Simpl%20OR%20Slice%20OR%20Freo%20OR%20%22Aye%20Finance%22%20OR%20Lendingkart%20OR%20FlexiLoans%20OR%20Indifi%20OR%20NeoGrowth%20OR%20Oxyzo%20OR%20Mintifi%20OR%20Progcap%29%20India%20when%3A14d&hl=en-IN&gl=IN&ceid=IN:en",
    defaultCategory: "Fundraise",
  },
  {
    source: "Google News Fintech Platforms",
    url: "https://news.google.com/rss/search?q=%28Yubi%20OR%20%22CredAvenue%22%20OR%20%22Northern%20Arc%22%20OR%20%22Vivriti%20Capital%22%20OR%20GetVantage%20OR%20%22Recur%20Club%22%20OR%20%22Rupeek%22%20OR%20%22ZestMoney%22%20OR%20LiquiLoans%20OR%20Lendbox%20OR%20Faircent%20OR%20%22P2P%20lending%22%29%20India%20when%3A14d&hl=en-IN&gl=IN&ceid=IN:en",
    defaultCategory: "Fundraise",
  },
  {
    source: "Google News BNPL",
    url: "https://news.google.com/rss/search?q=%28%22buy%20now%20pay%20later%22%20OR%20BNPL%20OR%20%22pay%20later%22%20OR%20%22Amazon%20Pay%20Later%22%20OR%20%22Flipkart%20Pay%20Later%22%20OR%20%22Tata%20Neu%20Finance%22%29%20India%20when%3A14d&hl=en-IN&gl=IN&ceid=IN:en",
    defaultCategory: "AI & Tech",
  },
  {
    source: "Google News Embedded Finance",
    url: "https://news.google.com/rss/search?q=%28%22embedded%20finance%22%20OR%20%22embedded%20lending%22%20OR%20%22account%20aggregator%22%20OR%20OCEN%20OR%20%22open%20credit%22%20OR%20%22neobank%22%20OR%20%22neo-bank%22%29%20India%20when%3A14d&hl=en-IN&gl=IN&ceid=IN:en",
    defaultCategory: "AI & Tech",
  },
  // ── AI & Tech in FS ──
  {
    source: "Google News Fintech AI",
    url: "https://news.google.com/rss/search?q=%28%22generative%20AI%22%20OR%20%22AI%20in%20lending%22%20OR%20%22AI%20in%20banking%22%20OR%20%22AI%20underwriting%22%20OR%20%22AI%20credit%22%20OR%20%22LLM%20finance%22%20OR%20%22AI%20fintech%22%29%20India%20when%3A14d&hl=en-IN&gl=IN&ceid=IN:en",
    defaultCategory: "AI & Tech",
  },
  {
    source: "Google News RegTech",
    url: "https://news.google.com/rss/search?q=%28regtech%20OR%20%22regulatory%20technology%22%20OR%20%22eKYC%22%20OR%20%22video%20KYC%22%20OR%20%22fraud%20detection%22%20OR%20%22AML%20technology%22%20OR%20%22digital%20KYC%22%29%20India%20fintech%20when%3A14d&hl=en-IN&gl=IN&ceid=IN:en",
    defaultCategory: "AI & Tech",
  },
  {
    source: "Google News Digital Rupee",
    url: "https://news.google.com/rss/search?q=%28%22digital%20rupee%22%20OR%20CBDC%20OR%20%22UPI%20credit%22%20OR%20%22account%20aggregator%22%20OR%20%22AA%20framework%22%20OR%20ONDC%20OR%20%22open%20banking%22%29%20India%20when%3A14d&hl=en-IN&gl=IN&ceid=IN:en",
    defaultCategory: "AI & Tech",
  },
  {
    source: "Entrackr",
    url: "https://entrackr.com/feed/",
    defaultCategory: "Fundraise",
  },
  {
    source: "ET Tech",
    url: "https://economictimes.indiatimes.com/tech/rssfeeds/13357270.cms",
    defaultCategory: "AI & Tech",
  },
  // Stock market / corporate results (medium priority)
  {
    source: "Google News NBFC Results",
    url: "https://news.google.com/rss/search?q=%28%22quarterly%20results%22%20OR%20%22Q4%20results%22%20OR%20%22Q3%20results%22%20OR%20earnings%20OR%20%22net%20profit%22%29%20%28NBFC%20OR%20%22Bajaj%20Finance%22%20OR%20%22Shriram%20Finance%22%20OR%20%22Cholamandalam%22%20OR%20%22Muthoot%22%20OR%20%22digital%20lender%22%29%20India%20when%3A7d&hl=en-IN&gl=IN&ceid=IN:en",
    defaultCategory: "Policy",
  },
  {
    source: "Google News FS Fundraise",
    url: "https://news.google.com/rss/search?q=%28%22series%20A%22%20OR%20%22series%20B%22%20OR%20%22series%20C%22%20OR%20%22funding%20round%22%20OR%20%22raises%22%20OR%20QIP%20OR%20IPO%20OR%20%22stake%20sale%22%29%20%28fintech%20OR%20NBFC%20OR%20%22digital%20lending%22%20OR%20%22lending%20platform%22%29%20India%20when%3A7d&hl=en-IN&gl=IN&ceid=IN:en",
    defaultCategory: "Fundraise",
  },
];

const NEWS_APIS = [
  {
    source: "GDELT",
    url: "https://api.gdeltproject.org/api/v2/doc/doc",
  },
];

const HTML_SOURCES = [
  {
    source: "Financial Express Direct",
    url: "https://www.financialexpress.com/business/banking-finance/",
    defaultCategory: "Policy",
    articlePattern: /^https:\/\/www\.financialexpress\.com\/business\/banking-finance/i,
    excludePattern: /\/page\/|\/feed\/|\/amp\/?$/i,
  },
  {
    source: "Moneycontrol Companies Direct",
    url: "https://www.moneycontrol.com/news/business/companies/",
    defaultCategory: "Fundraise",
    articlePattern: /^https:\/\/www\.moneycontrol\.com\/news\/business\/companies\/.+\.html$/i,
    excludePattern: /\/page-\d+\/|\/amp\/?$/i,
  },
  {
    source: "Moneycontrol Banks Direct",
    url: "https://www.moneycontrol.com/news/business/banks/",
    defaultCategory: "Policy",
    articlePattern: /^https:\/\/www\.moneycontrol\.com\/news\/business\/banks\/.+\.html$/i,
    excludePattern: /\/page-\d+\/|\/amp\/?$/i,
  },
];

// ── Exchange Filings (BSE + NSE) ──────────────────────────────────────────────
// Map of BSE scrip code → company name for BFSI sector companies.
// Used to filter the broad BSE announcement feed down to financial services only.
const BSE_BFSI_CODES = {
  // Banks
  "500180": "HDFC Bank", "532174": "ICICI Bank", "500112": "SBI",
  "532215": "Axis Bank", "500247": "Kotak Mahindra Bank", "532187": "IndusInd Bank",
  "532648": "Yes Bank", "500469": "Federal Bank", "539437": "IDFC First Bank",
  "540065": "RBL Bank", "532218": "South Indian Bank", "532210": "City Union Bank",
  "532772": "DCB Bank", "590003": "Karur Vysya Bank", "532652": "Karnataka Bank",
  "532343": "Bank of India", "532525": "Union Bank", "532483": "Canara Bank",
  "532461": "Bank of Baroda", "532149": "Punjab National Bank",
  // NBFCs
  "532978": "Bajaj Finance", "511218": "Shriram Finance", "533398": "Muthoot Finance",
  "531213": "Manappuram Finance", "511243": "Cholamandalam Investment",
  "532636": "IIFL Finance", "533519": "L&T Finance", "533260": "Poonawalla Fincorp",
  "543948": "Five Star Business Finance", "511742": "Ugro Capital",
  "543335": "Aptus Value Housing", "541988": "Aavas Financiers",
  "543259": "Home First Finance", "535322": "Repco Home Finance",
  "532720": "Mahindra Finance", "590071": "Sundaram Finance",
  "544002": "Muthoot Microfin",
  // HFCs
  "500253": "LIC Housing Finance", "540173": "PNB Housing Finance",
  "511196": "Can Fin Homes", "535789": "Indiabulls Housing Finance",
  // MFIs & Small Finance Banks
  "541770": "CreditAccess Grameen", "542759": "Spandana Sphoorty",
  "543652": "Fusion Microfinance", "543540": "Jana Small Finance Bank",
  "543243": "Equitas Small Finance Bank", "544067": "ESAF Small Finance Bank",
  "542904": "Ujjivan Small Finance Bank", "540611": "AU Small Finance Bank",
  // AMCs & Insurance
  "541729": "HDFC AMC", "540767": "Nippon India AMC", "543238": "UTI AMC",
  "540133": "ICICI Prudential Life", "540719": "SBI Life",
  "540777": "HDFC Life", "543347": "Star Health", "500271": "Max Financial",
  // Rating Agencies & Others
  "500092": "CRISIL", "532835": "ICRA", "534804": "CARE Ratings",
  "543396": "Paytm", "543390": "PB Fintech", "543572": "Nuvama Wealth",
};

// NSE symbols set for the same universe
const NSE_BFSI_SYMBOLS = new Set([
  "HDFCBANK","ICICIBANK","SBIN","AXISBANK","KOTAKBANK","INDUSINDBK","YESBANK",
  "FEDERALBNK","IDFCFIRSTB","RBLBANK","SOUTHBANK","CUB","DCBBANK","KVB","KTKBANK",
  "BANKBARODA","UNIONBANK","CANBK","PNBHOUSING","PNB",
  "BAJFINANCE","SHRIRAMFIN","MUTHOOTFIN","MANAPPURAM","CHOLAFIN","IIFL",
  "LTF","POONAWALLA","FIVESTAR","UGROCAP","APTUS","AAVAS","HOMEFIRST",
  "REPCO","M&MFIN","SUNDARMFIN","MUTHOOTMF",
  "LICHSGFIN","PNBHOUSING","CANFINHOME","IBULHSGFIN",
  "CREDITACC","SPANDANA","FUSION","JSFB","EQUITASBNK","ESAFSFB","UJJIVANSFB","AUBANK",
  "HDFCAMC","NAM-INDIA","UTIAMC","ICICIPRULI","SBILIFE","HDFCLIFE","STARHEALTH","MFSL",
  "CRISIL","ICRA","CARERATING","PAYTM","POLICYBZR","NUVAMA",
]);

function annCategoryToCategory(rawCategory = "") {
  const cat = rawCategory.toLowerCase();
  if (cat.includes("result") || cat.includes("financial") || cat.includes("earnings")) return "Earnings";
  if (cat.includes("rating")) return "Ratings / Credit";
  if (cat.includes("board meeting") || cat.includes("board of directors")) return "Management / Governance";
  if (cat.includes("ncd") || cat.includes("debenture") || cat.includes("bond") ||
      cat.includes("qip") || cat.includes("ipo") || cat.includes("rights") ||
      cat.includes("fundrais") || cat.includes("allotment")) return "Funding / M&A";
  if (cat.includes("regulation") || cat.includes("rbi") || cat.includes("sebi") ||
      cat.includes("penalty") || cat.includes("compliance")) return "Regulation";
  if (cat.includes("merger") || cat.includes("acquisition") || cat.includes("amalgamation") ||
      cat.includes("joint venture") || cat.includes("agreement")) return "Partnership";
  if (cat.includes("litigation") || cat.includes("fraud") || cat.includes("npa") ||
      cat.includes("default") || cat.includes("insolvency")) return "Risk Alert";
  return "Company Filing";
}

function filingRawCategory(...values) {
  return values
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" | ");
}

function filingTitle(company, headline) {
  const normalizedCompany = String(company || "").trim();
  const normalizedHeadline = String(headline || "").trim();
  if (!normalizedCompany) return normalizedHeadline;
  if (!normalizedHeadline) return normalizedCompany;
  return `[${normalizedCompany}] ${normalizedHeadline}`;
}

function filingDedupeKey(exchange, company, headline, publishedAt) {
  const normalizedTitle = normalizeHeadline(`${company} ${headline}`);
  const normalizedDate = parseDateValue(publishedAt)?.toISOString()?.slice(0, 16) || "na";
  return `${exchange}:${normalizedTitle}:${normalizedDate}`;
}

async function fetchBseAnnouncements() {
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - 1);
  const fmt = (d) => `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;

  const url = `https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w?strCat=-1&strPrevDate=${fmt(from)}&strScrip=&strSearch=P&strToDate=${fmt(today)}&strType=C&subcategory=-1`;

  try {
    const res = await fetchWithTimeout(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-IN,en;q=0.9",
        "Origin": "https://www.bseindia.com",
        "Referer": "https://www.bseindia.com/",
      },
    }, 8000);
    if (!res.ok) throw new Error(`BSE API returned ${res.status}`);
    const json = await res.json();
    const rows = json?.Table || json?.data || [];
    return rows
      .filter((r) => BSE_BFSI_CODES[String(r.SCRIP_CD || r.scrip_cd || "")])
      .map((r, i) => {
        const scripCode = String(r.SCRIP_CD || r.scrip_cd || "");
        const company = BSE_BFSI_CODES[scripCode] || r.SLONGNAME || r.COMP_NAME || "";
        const headline = r.HEADLINE || r.headline || r.subject || "";
        const rawCategory = filingRawCategory(r.CATEGORYNAME, r.category, r.SUBCATNAME, r.SUBCAT, r.HEADLINE);
        const category = annCategoryToCategory(rawCategory);
        const dt = r.DT_TM || r.NEWS_DT || r.dt || "";
        const attachmentFile = r.ATTACHMENTNAME || r.attachmentname || "";
        const annUrl = attachmentFile
          ? `https://www.bseindia.com/xml-data/corpfiling/AttachLive/${attachmentFile}`
          : `https://www.bseindia.com/corporates/ann.aspx?scripcode=${scripCode}`;
        const title = filingTitle(company, headline);
        const sector = classifySector(`${company} ${headline}`, category);
        const segment = classifySegment(`${company} ${headline}`, category);

        return {
          id: `BSE-${scripCode}-${hashText(`${title}-${dt}`)}-${i}`,
          time: relativeTime(dt),
          source: "BSE",
          exchange: "BSE",
          company,
          sector,
          segment,
          category,
          eventType: category,
          headline: title,
          tldr: `BSE exchange filing — ${r.CATEGORYNAME || "Corporate Announcement"}`,
          whyMatters: buildWhyMatters(category, "BSE"),
          impactNBFC: "Medium",
          impactDigital: "Low",
          impactInvestor: "High",
          tags: ["Exchange Filing", "BSE", company, category],
          risk: category === "Risk Alert" ? "High" : "Low",
          trending: false,
          url: annUrl,
          publishedAt: dt,
          publishedTs: dt ? new Date(dt).getTime() || 0 : 0,
          filingCategory: rawCategory || "Corporate Announcement",
          dedupeKey: filingDedupeKey("filing", company, headline, dt),
          sourceTier: "primary",
          sourceType: "exchange_filing",
          materialityReason: materialityReason({ category, sector, source: "BSE", sourceType: "exchange_filing", entities: [company] }),
        };
      });
  } catch (error) {
    throw new Error(`BSE filings failed: ${error.message}`);
  }
}

async function fetchNseAnnouncements() {
  try {
    // Step 1: hit NSE homepage to get session cookies
    const homeRes = await fetchWithTimeout("https://www.nseindia.com/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-IN,en;q=0.9",
      },
    }, 6000);
    const cookies = (homeRes.headers.get("set-cookie") || "")
      .split(",")
      .map((c) => c.split(";")[0].trim())
      .filter(Boolean)
      .join("; ");

    // Step 2: fetch announcements with cookies
    const res = await fetchWithTimeout(
      "https://www.nseindia.com/api/corporate-announcements?index=equities",
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36",
          "Accept": "application/json, text/plain, */*",
          "Accept-Language": "en-IN,en;q=0.9",
          "Referer": "https://www.nseindia.com/companies-listing/corporate-filings-announcements",
          "Cookie": cookies,
        },
      },
      8000
    );
    if (!res.ok) throw new Error(`NSE API returned ${res.status}`);
    const json = await res.json();
    const rows = Array.isArray(json) ? json : (json?.data || []);
    return rows
      .filter((r) => NSE_BFSI_SYMBOLS.has(r.symbol || r.smSymbol || ""))
      .map((r, i) => {
        const symbol = r.symbol || r.smSymbol || "";
        const company = r.comp || r.smCompanyName || symbol;
        const headline = r.subject || r.desc || "";
        const rawCategory = filingRawCategory(r.bflag, r.an_type, r.attchmntText, r.subject);
        const category = annCategoryToCategory(rawCategory);
        const dt = r.an_dt || r.sort_date || "";
        const attachmentFile = r.attchmntFile || "";
        const annUrl = attachmentFile
          ? `https://nsearchives.nseindia.com/corporate/ann/${attachmentFile}`
          : `https://www.nseindia.com/companies-listing/corporate-filings-announcements`;
        const title = filingTitle(company, headline);
        const sector = classifySector(`${company} ${headline}`, category);
        const segment = classifySegment(`${company} ${headline}`, category);

        return {
          id: `NSE-${symbol}-${hashText(`${title}-${dt}`)}-${i}`,
          time: relativeTime(dt),
          source: "NSE",
          exchange: "NSE",
          company,
          sector,
          segment,
          category,
          eventType: category,
          headline: title,
          tldr: `NSE exchange filing — ${r.bflag || r.an_type || "Corporate Announcement"}`,
          whyMatters: buildWhyMatters(category, "NSE"),
          impactNBFC: "Medium",
          impactDigital: "Low",
          impactInvestor: "High",
          tags: ["Exchange Filing", "NSE", company, category],
          risk: category === "Risk Alert" ? "High" : "Low",
          trending: false,
          url: annUrl,
          publishedAt: dt,
          publishedTs: dt ? new Date(dt).getTime() || 0 : 0,
          filingCategory: rawCategory || "Corporate Announcement",
          dedupeKey: filingDedupeKey("filing", company, headline, dt),
          sourceTier: "primary",
          sourceType: "exchange_filing",
          materialityReason: materialityReason({ category, sector, source: "NSE", sourceType: "exchange_filing", entities: [company] }),
        };
      });
  } catch (error) {
    throw new Error(`NSE filings failed: ${error.message}`);
  }
}
// ─────────────────────────────────────────────────────────────────────────────

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

async function fallbackPayload(error) {
  const fallbackNewsItems = withArticleSlugs(NEWS_ITEMS).map(applyTimeFields);
  return {
    newsItems: fallbackNewsItems,
    alerts: ALERTS,
    ratingChanges: RATING_CHANGES,
    sectorMetrics: SECTOR_METRICS,
    peerData: PEER_DATA,
    globalData: GLOBAL_DATA,
    coLendingData: CO_LENDING_DATA,
    govtSchemes: GOVT_SCHEMES,
    penalties: [],
    materialUpdates: buildMaterialUpdates(fallbackNewsItems, PEER_DATA, RATING_CHANGES),
    watchlist: buildWatchlist(fallbackNewsItems, PEER_DATA, RATING_CHANGES),
    dailyBrief: await buildDailyBrief(fallbackNewsItems, RATING_CHANGES),
    sources: {
      rss: RSS_FEEDS.map((feed) => ({ ...feed, type: "RSS", status: "fallback", itemCount: 0, error: error.message })),
      apis: [
        ...NEWS_APIS,
        { source: "Yahoo Finance", url: "https://query1.finance.yahoo.com/v7/finance/quote" },
        { source: "Frankfurter FX", url: "https://api.frankfurter.app/latest" },
      ].map((api) => ({ ...api, type: "API", status: "fallback", itemCount: 0, error: error.message })),
    },
    sourceHealth: [],
    qualityStats: { candidateItems: fallbackNewsItems.length, materialItems: fallbackNewsItems.length, filteredItems: 0 },
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
  { name: "Bajaj Finance", symbol: "BAJFINANCE.NS", screenerSlug: "BAJFINANCE", bseCode: "532978" },
  { name: "Shriram Finance", symbol: "SHRIRAMFIN.NS", screenerSlug: "SHRIRAMFIN", bseCode: "511218" },
  { name: "Poonawalla Fincorp", symbol: "POONAWALLA.NS", screenerSlug: "POONAWALLA", bseCode: "533260" },
  { name: "Muthoot Finance", symbol: "MUTHOOTFIN.NS", screenerSlug: "MUTHOOTFIN", bseCode: "533398" },
  { name: "Manappuram Finance", symbol: "MANAPPURAM.NS", screenerSlug: "MANAPPURAM", bseCode: "531213" },
  { name: "IIFL Finance", symbol: "IIFL.NS", screenerSlug: "IIFL", bseCode: "532636" },
  { name: "L&T Finance", symbol: "LTF.NS", screenerSlug: "LTF", bseCode: "533519" },
  { name: "Cholamandalam Investment", symbol: "CHOLAFIN.NS", screenerSlug: "CHOLAFIN", bseCode: "511243" },
  { name: "Mahindra Finance", symbol: "M&MFIN.NS", screenerSlug: "M&MFIN", bseCode: "532720" },
  { name: "Sundaram Finance", symbol: "SUNDARMFIN.NS", screenerSlug: "SUNDARMFIN", bseCode: "590071" },
  { name: "Can Fin Homes", symbol: "CANFINHOME.NS", screenerSlug: "CANFINHOME", bseCode: "511196" },
  { name: "Aavas Financiers", symbol: "AAVAS.NS", screenerSlug: "AAVAS", bseCode: "541988" },
  { name: "Home First Finance", symbol: "HOMEFIRST.NS", screenerSlug: "HOMEFIRST", bseCode: "543259" },
  { name: "Five-Star Business Finance", symbol: "FIVESTAR.NS", screenerSlug: "FIVESTAR", bseCode: "543386" },
  { name: "CreditAccess Grameen", symbol: "CREDITACC.NS", screenerSlug: "CREDITACC", bseCode: "541770" },
  { name: "Fusion Finance", symbol: "FUSION.NS", screenerSlug: "FUSION", bseCode: "543652" },
  { name: "MAS Financial Services", symbol: "MASFIN.NS", screenerSlug: "MASFIN", bseCode: "540749" },
  { name: "Aptus Value Housing", symbol: "APTUS.NS", screenerSlug: "APTUS", bseCode: "543335" },
  { name: "Repco Home Finance", symbol: "REPCOHOME.NS", screenerSlug: "REPCOHOME", bseCode: "535322" },
];

const CATEGORY_KEYWORDS = [
  { category: "Ratings / Credit", words: ["rating", "crisil", "icra", "care ratings", "india ratings", "upgrade", "downgrade"] },
  { category: "Funding / M&A", words: ["fundraise", "raises", "funding", "capital", "ipo", "ncd", "bond", "debt"] },
  { category: "Partnership", words: ["co-lending", "partnership", "partners", "tie-up", "collaboration"] },
  { category: "Risk Alert", words: ["default", "delinquency", "stress", "fraud", "npa", "gnpa", "risk"] },
  { category: "Product / Tech", words: ["ai", "artificial intelligence", "digital", "technology", "fintech", "platform"] },
  { category: "Policy", words: ["scheme", "budget", "ministry", "msme", "guarantee", "psl"] },
  { category: "Regulation", words: ["rbi", "sebi", "circular", "notification", "guideline", "regulation", "compliance"] },
];

const RELEVANCE_WORDS = [
  // Core FS
  "nbfc", "lending", "loan", "credit", "bank", "finance", "fintech", "rbi", "sebi",
  "ncd", "msme", "co-lending", "rating", "debt", "bond", "asset quality", "npa",
  "mfi", "microfinance", "hfc", "housing finance", "sidbi", "nhb", "pib",
  // Digital lenders
  "digital lender", "kreditbee", "moneyview", "kissht", "navi", "fibe", "stashfin",
  "cashe", "lazypay", "simpl", "lendingkart", "flexiloans", "indifi", "neogrowth",
  "oxyzo", "mintifi", "progcap", "yubi", "credavenue", "northern arc", "vivriti",
  "getvantage", "recur club", "rupeek", "zestmoney", "liquiloans", "lendbox", "faircent",
  "p2p lending", "bnpl", "buy now pay later", "pay later", "embedded finance",
  "neobank", "neo-bank", "account aggregator", "ocen", "open credit",
  // AI & Tech in FS
  "generative ai", "llm", "large language model", "ai in lending", "ai in banking",
  "ai underwriting", "regtech", "insurtech", "wealthtech", "fraud detection",
  "ekyc", "video kyc", "digital kyc", "credit scoring model", "underwriting model",
  "digital rupee", "cbdc", "upi credit", "ondc", "open banking", "aa framework",
  "fintech technology", "machine learning", "automation", "ai fintech",
  // Stock market / corporate (medium priority — captured but ranked lower)
  "quarterly results", "q4 results", "q3 results", "q2 results", "q1 results",
  "net profit", "roe", "roa", "net interest margin", "nim", "gnpa", "book value",
  "ipo", "qip", "rights issue", "fundraise", "series a", "series b", "series c",
  "valuation", "stake sale", "merger", "acquisition", "amalgamation",
  "dividend", "buyback", "promoter", "shareholding", "fii", "dii",
  "nse", "bse", "sensex", "nifty", "stock", "shares", "market cap",
  // Broader FS signals
  "partnership", "tie-up", "collaboration", "joint venture",
  "liquidity", "capital adequacy", "car", "tier 1", "tier 2",
  "provisioning", "write-off", "recovery", "collection",
  "interest income", "net income", "disbursement", "aum",
];

const RATING_AGENCY_TERMS = [
  "crisil", "icra", "care ratings", "india ratings", "india ratings and research",
  "ind-ra", "acuite", "acuité", "brickwork", "rating rationale", "rating action",
  "credit rating", "outlook revised", "rating watch",
];

const BFSI_ENTITY_TERMS = [
  "nbfc", "non banking", "non-banking", "bank", "small finance bank", "co-operative bank",
  "cooperative bank", "housing finance", "hfc", "microfinance", "mfi", "gold loan",
  "vehicle finance", "msme lending", "consumer lending", "personal loan", "credit card",
  "digital lending", "digital lender", "fintech lender", "payments bank", "payment aggregator",
  "payment gateway", "upi", "wealthtech", "broking", "stock broker", "insurance", "asset management",
  "amc", "mutual fund", "lending service provider", "lsp", "dlg", "co-lending", "co lending",
  "loan book", "aum", "gnpa", "nnpa", "capital adequacy", "provisioning", "collection efficiency",
  "disbursement", "asset quality", "cost of funds", "credit cost",
];

const REGULATORY_MATERIAL_TERMS = [
  "master direction", "circular", "notification", "guideline", "directions", "framework",
  "penalty", "restriction", "cease and desist", "supervisory", "compliance", "kyc",
  "fair practices", "outsourcing", "digital lending", "payments", "nbfc", "bank",
  "credit information", "co-lending", "priority sector", "fraud", "wilful defaulter",
  "non-performing", "asset quality", "capital adequacy",
];

const HARD_EXCLUDE_PATTERNS = [
  /\bmoney market operations\b/i,
  /\bunderwriting auction\b/i,
  /\bauction for sale of government securities\b/i,
  /\bgovernment securities\b/i,
  /\bg-sec\b/i,
  /\btreasury bill\b/i,
  /\bsovereign gold bond\b/i,
  /\bsgb\b/i,
  /\bfloating rate savings bonds?\b/i,
  /\bfrsb\b/i,
  /\bstock to buy\b/i,
  /\bbuy for short-term\b/i,
  /\bshould you buy, sell or hold\b/i,
  /\bhow to open a demat account\b/i,
  /\bstep-by-step guide\b/i,
  /\bshare price (?:dips|falls|rises|jumps) ahead of earnings\b/i,
  /\blive:\s/i,
  /\bwar impact: indian stock market\b/i,
  /\bindian stock market downgraded\b/i,
  /\brupee tracks asian peers\b/i,
  /\brbi bulletin\b/i,
  /\bnotice of demand under recovery certificate\b/i,
];

const EVENT_TYPE_ALIASES = {
  "Credit Rating": "Ratings / Credit",
  "Risk Signal": "Risk Alert",
  Fundraise: "Funding / M&A",
  "AI & Tech": "Product / Tech",
};

const HIGH_SIGNAL_EVENT_TYPES = new Set([
  "Regulation",
  "Penalty",
  "Ratings / Credit",
  "Risk Alert",
  "Earnings",
  "Company Filing",
  "Funding / M&A",
  "Partnership",
]);

const SOURCE_WEIGHTS = {
  BSE: 42,
  NSE: 42,
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
  "Google News Acuite Brickwork Ratings": 24,
  "Google News CGFMU": 22,
  "Google News RBI Regulatory Updates": 26,
  "Google News Insurance Regulation": 20,
  "Google News Pension IFSCA Regulation": 20,
  GDELT: 12,
  "BQ Prime": 22,
  PIB: 30,
  Inc42: 18,
  "Google News MFI": 18,
  "Google News MSME Lending": 18,
  "Google News Housing Finance": 18,
  "Google News NCD Bond": 20,
  VCCircle: 16,
  "Google News SIDBI": 22,
  "Google News NHB": 24,
  "Google News Digital Lenders": 20,
  "Google News Fintech Platforms": 20,
  "Google News BNPL": 18,
  "Google News Embedded Finance": 20,
  "Google News Fintech AI": 22,
  "Google News RegTech": 20,
  "Google News Digital Rupee": 20,
  Entrackr: 18,
  "ET Tech": 20,
  "Google News NBFC Results": 14,
  "Google News FS Fundraise": 14,
  BusinessLine: 22,
  "Financial Express Direct": 22,
  "Moneycontrol Companies Direct": 20,
  "Moneycontrol Banks Direct": 22,
};

const CATEGORY_WEIGHTS = {
  Regulation: 35,
  Penalty: 34,
  "Risk Alert": 32,
  "Risk Signal": 32,
  "Ratings / Credit": 28,
  "Credit Rating": 28,
  Earnings: 24,
  "Company Filing": 22,
  Fundraise: 20,
  "Funding / M&A": 20,
  Partnership: 18,
  Policy: 18,
  "AI & Tech": 20,
  "Product / Tech": 20,
  "Market / Macro": 8,
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

function parseHtmlSource(html, source) {
  const matches = [...html.matchAll(/<a[^>]+href=["'](https?:\/\/[^"'<> ]+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  const seen = new Set();
  const items = [];

  for (const match of matches) {
    const link = decodeEntities(match[1] || "");
    const title = decodeEntities(match[2] || "");
    if (!link || !title) continue;
    if (source.excludePattern?.test(link)) continue;
    if (!source.articlePattern?.test(link)) continue;
    if (title.length < 18) continue;
    if (seen.has(link)) continue;
    seen.add(link);
    items.push({
      title,
      description: title,
      link,
      publishedAt: "",
      source: source.source,
      defaultCategory: source.defaultCategory,
      sourceType: "html_feed",
    });
    if (items.length >= 18) break;
  }

  return items;
}

function hashText(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function sha256(value) {
  return createHash("sha256").update(String(value || "")).digest("hex");
}

function normalizeEventType(value = "") {
  return value ? (EVENT_TYPE_ALIASES[value] || value) : "";
}

export function classifyCategory(text, fallback) {
  const lower = text.toLowerCase();
  const normalizedFallback = normalizeEventType(fallback);
  const hasBfsiContext = BFSI_ENTITY_TERMS.some((word) => lower.includes(word));
  const hasRatingAgency = RATING_AGENCY_TERMS.some((word) => lower.includes(word));

  if (["penalty", "penalised", "penalized", "fine", "fined", "enforcement action"].some((word) => lower.includes(word))) return "Penalty";
  if (["rbi", "sebi", "irdai", "pfrda", "ifsca", "circular", "notification", "direction", "guideline", "regulation", "compliance"].some((word) => lower.includes(word))) return "Regulation";
  if (hasRatingAgency && hasBfsiContext) return "Ratings / Credit";
  if (hasBfsiContext && ["npa", "gnpa", "nnpa", "default", "delinquency", "fraud", "stress", "restriction", "ban", "liquidity pressure", "asset quality"].some((word) => lower.includes(word))) return "Risk Alert";
  if (["quarterly results", "q4 results", "q3 results", "q2 results", "q1 results", "earnings", "net profit", "financial results"].some((word) => lower.includes(word))) return "Earnings";
  if (["ipo", "drhp", "qip", "fundraise", "funding round", "raises", "stake sale", "merger", "acquisition"].some((word) => lower.includes(word))) return "Funding / M&A";

  const match = CATEGORY_KEYWORDS.find(({ words }) => words.some((word) => lower.includes(word)));
  const matchedCategory = normalizeEventType(match?.category);
  if (matchedCategory === "Ratings / Credit" && !hasBfsiContext && !hasRatingAgency) {
    return normalizedFallback === "Ratings / Credit" ? "Policy" : normalizedFallback || "Policy";
  }
  if (matchedCategory === "Risk Alert" && !hasBfsiContext) {
    return normalizedFallback === "Risk Alert" ? "Policy" : normalizedFallback || "Policy";
  }
  return matchedCategory || normalizedFallback || "Policy";
}

function classifySector(text, category) {
  const lower = text.toLowerCase();

  if (["gold loan", "muthoot", "manappuram", "rupeek"].some((word) => lower.includes(word))) return "Gold Loans";
  if (["vehicle finance", "commercial vehicle", "cv finance", "mahindra finance", "shriram finance"].some((word) => lower.includes(word))) return "Vehicle Finance";
  if (["housing finance", "home loan", "hfc ", " hfc", "aavas", "aptus", "home first", "can fin", "lic housing", "pnb housing"].some((word) => lower.includes(word))) return "HFCs";
  if (["microfinance", "nbfc-mfi", "mfi ", " mfi", "creditaccess", "spandana", "fusion finance", "muthoot microfin", "arohan"].some((word) => lower.includes(word))) return "MFIs";

  // AI & Tech — broad FS/finance technology signals
  if (
    ["Product / Tech", "AI & Tech"].includes(category) ||
    [
      "generative ai", "large language model", "llm ", " llm", "ai in lending", "ai in banking",
      "ai underwriting", "ai credit", "ai fintech", "ai-powered lending", "ai-driven",
      "regtech", "insurtech", "wealthtech", "fraud detection", "underwriting model",
      "credit scoring model", "machine learning", "automation in lending",
      "ekyc", "video kyc", "digital kyc", "kyc automation",
      "account aggregator", "aa framework", "ocen", "open credit enablement",
      "digital rupee", "cbdc", "upi credit line", "ondc", "open banking",
      "neobank", "neo-bank", "embedded finance", "embedded lending",
      "robo advisor", "wealthtech", "insurtech",
      "nucleus software", "intellect design", "newgen software", "finacus",
      "perfios", "setu ", " setu", "signzy", "idfy", "karza", "bureau.id", "finbox", "lentra",
    ].some((word) => lower.includes(word)) ||
    [" ai ", "artificial intelligence"].some((word) => ` ${lower} `.includes(word))
  ) return "Fintech Infra";

  // Digital Lenders
  if ([
    "moneyview", "money view", "kissht", "kreditbee",
    "navi fintech", "navi app", "navi technologies", "navi mutual fund",
    "navi loan", "navi insurance", "navi.com", "sachin bansal navi",
    "lendingkart", "digital lending", "fintech lender", "digital lender",
    "paytm lending", "phonepe loan", "bharatpe lending", "mobikwik",
    "zestmoney", "freo", "uni cards", "slice pay", "liquiloans", "stashfin",
    "fibe", "early salary", "cashe", "aye finance", "lendbox", "faircent",
    "p2p lending", "bnpl", "buy now pay later", "pay later",
    "lazypay", "simpl", "amazon pay later", "flipkart pay later", "tata neu finance",
    "flexiloans", "indifi", "neogrowth", "oxyzo", "mintifi", "progcap",
    "yubi", "credavenue", "cred avenue", "northern arc capital", "vivriti capital",
    "getvantage", "recur club", "rupeek", "paysense", "finnable",
    "krazybee", "incred", "ring app", "ring fintech", "dmi finance", "axio", "capital float",
  ].some((word) => lower.includes(word))) return "Digital Lenders";

  // NBFCs
  if ([
    "nbfc", "non banking", "non-banking",
    "bajaj finance", "shriram finance", "muthoot", "manappuram",
    "iifl", "poonawalla", "tata capital", "l&t finance",
    "cholamandalam", "mahindra finance", "sundaram finance",
    "can fin", "aavas", "five star", "five-star",
    "creditaccess", "credit access", "fusion finance",
    "mas financial", "aptus", "repco", "home first",
    "aadhar housing", "india shelter",
    "microfinance", "nbfc-mfi", "mfi ", " mfi",
    "housing finance", "hfc ", " hfc",
    "msme lending", "sme finance", "sidbi",
    "arohan", "spandana", "asirvad", "bandhan",
    "ncd issuance", "non convertible debenture", "debenture",
  ].some((word) => lower.includes(word))) return "NBFCs";

  // Banks
  if ([
    "banking sector", "bank credit", "bank lending",
    "hdfc bank", "icici bank", "axis bank", "kotak bank", "kotak mahindra bank",
    "state bank of india", "sbi ", " sbi", "bank of baroda", "canara bank",
    "union bank", "indusind bank", "yes bank", "idfc first",
    "rbl bank", "federal bank", "pnb ", "punjab national",
    "au small finance", "jana bank", "equitas bank", "ujjivan",
  ].some((word) => lower.includes(word))) return "Banks";

  if (["upi", "payment aggregator", "payment gateway", "payments bank", "phonepe", "paytm", "mobikwik", "bharatpe"].some((word) => lower.includes(word))) return "Payments";
  if (["zerodha", "groww", "angel one", "nuvama", "broking", "broker"].some((word) => lower.includes(word))) return "Broking";
  if (["insurance", "insurtech", "policybazaar", "pb fintech", "hdfc life", "sbi life", "star health"].some((word) => lower.includes(word))) return "Insurance";
  if (["asset management", "mutual fund", "amc", "hdfc amc", "nippon india amc", "uti amc"].some((word) => lower.includes(word))) return "Asset Management";

  return "Others";
}

function classifySegment(text, category) {
  const sector = classifySector(text, category);
  if (["HFCs", "MFIs", "Gold Loans", "Vehicle Finance"].includes(sector)) return "NBFCs";
  if (sector === "Fintech Infra") return "AI & Tech";
  if (["Payments", "Broking", "Insurance", "Asset Management"].includes(sector)) return "Others";
  return sector;
}

function riskFor(text, category) {
  const lower = text.toLowerCase();
  const hasRiskTerm = /\b(default|fraud|downgrade|downgraded|npa|gnpa|nnpa|stress|restriction|restricted|ban|barred)\b/i.test(lower);
  if (["Risk Alert", "Risk Signal"].includes(category) || (BFSI_ENTITY_TERMS.some((word) => lower.includes(word)) && hasRiskTerm)) {
    return "High";
  }
  if (["Regulation", "Ratings / Credit", "Credit Rating", "Penalty"].includes(category)) {
    return "Medium";
  }
  return "Low";
}

export function impactFor(category, risk) {
  const normalizedCategory = normalizeEventType(category);
  if (risk === "High") return { nbfc: "High", digital: "Critical", investor: "High" };
  if (normalizedCategory === "Regulation" || normalizedCategory === "Penalty") return { nbfc: "High", digital: "High", investor: "Medium" };
  if (normalizedCategory === "Ratings / Credit") return { nbfc: "High", digital: "Medium", investor: "High" };
  if (normalizedCategory === "Funding / M&A") return { nbfc: "Medium", digital: "High", investor: "High" };
  if (normalizedCategory === "Partnership") return { nbfc: "High", digital: "Medium", investor: "Medium" };
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

export function normalizeUrl(value = "") {
  if (!value) return "";
  try {
    const url = new URL(value);
    const blockedParams = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ocid", "cmpid"];
    blockedParams.forEach((param) => url.searchParams.delete(param));
    url.hash = "";
    if ((url.protocol === "https:" && url.port === "443") || (url.protocol === "http:" && url.port === "80")) {
      url.port = "";
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return String(value || "").trim();
  }
}

function applyTimeFields(item) {
  const ingestedAt = item.ingestedAt || new Date().toISOString();
  const publishedTs = item.publishedTs || publishedTime(item);
  const ingestedTs = parseDateValue(ingestedAt)?.getTime() || Date.now();
  const basis = publishedTs ? "published" : "ingested";

  return {
    ...item,
    publishedTs,
    ingestedAt,
    ingestedTs,
    timeBasis: basis,
    time: relativeTime(publishedTs ? item.publishedAt : ingestedAt),
  };
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

export function headlineSimilarity(a, b) {
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
  const sectorScore = item.sector && item.sector !== "Others" ? 18 : item.segment && item.segment !== "Others" ? 10 : -20;
  const primaryScore = item.sourceType === "exchange_filing" || ["RBI", "SEBI", "IRDAI", "PFRDA", "IFSCA"].includes(item.source) ? 12 : 0;

  return Math.round(recencyScore + sourceScore + categoryScore + riskScore + linkScore + sectorScore + primaryScore);
}

function buildWhyMatters(category, source) {
  const notes = {
    Regulation: "Regulatory updates can change compliance cost, product design, and distribution rules for NBFCs and digital lenders.",
    Penalty: "Penalty and enforcement actions are early signals for compliance risk, process gaps, and supervisory intensity.",
    "Ratings / Credit": "Rating actions influence borrowing costs, debt-market access, and investor perception across comparable lenders.",
    "Funding / M&A": "Capital-market activity signals liquidity appetite and competitive intensity for Indian lending platforms.",
    Partnership: "Partnerships can shift origination economics, PSL access, customer acquisition, and risk sharing between banks and NBFCs.",
    "Risk Alert": "Early credit-stress indicators can affect underwriting, provisioning, growth appetite, and valuation multiples.",
    Earnings: "Earnings updates show growth, asset quality, profitability, and capital trends that matter for peer benchmarking.",
    "Company Filing": "Company filings are primary-source signals for governance, capital actions, financials, and management updates.",
    Policy: "Policy and scheme changes can alter guarantee cover, priority-sector flows, and the addressable market for lenders.",
    "Product / Tech": "Technology adoption can reshape credit scoring, servicing cost, fraud control, and customer onboarding speed.",
  };

  return `${notes[category] || notes.Policy} Source: ${source}.`;
}

function materialityReason(item = {}) {
  const reasons = [];
  if (item.sourceType === "exchange_filing") reasons.push("primary exchange filing");
  if (["RBI", "SEBI", "IRDAI", "PFRDA", "IFSCA"].includes(item.source)) reasons.push("primary regulator source");
  if (item.category) reasons.push(item.category.toLowerCase());
  if (item.sector && item.sector !== "Others") reasons.push(item.sector);
  if (item.entities?.length) reasons.push(`named entity: ${item.entities.slice(0, 2).join(", ")}`);
  return reasons.length ? reasons.join(" | ") : "financial-services relevance matched";
}

function shouldExcludePortalItem(item = {}) {
  const text = [
    item.title,
    item.headline,
    item.description,
    item.tldr,
    item.detail,
  ].filter(Boolean).join(" ").toLowerCase();

  return HARD_EXCLUDE_PATTERNS.some((pattern) => pattern.test(text));
}

function itemSearchText(item = {}) {
  return [
    item.title,
    item.headline,
    item.description,
    item.tldr,
    item.detail,
    item.company,
    item.source,
    item.category,
    item.eventType,
    item.sector,
    ...(item.tags || []),
  ].filter(Boolean).join(" ");
}

export function isFinancialServicesMaterial(item = {}) {
  const text = itemSearchText(item).toLowerCase();
  if (!text.trim()) return false;
  if (shouldExcludePortalItem(item)) return false;
  if (item.sourceType === "exchange_filing") return true;

  const hasKnownEntity = extractEntities(text).length > 0;
  const hasCoreBfsiTerm = BFSI_ENTITY_TERMS.some((word) => text.includes(word));
  const hasRegulatoryMaterial = REGULATORY_MATERIAL_TERMS.some((word) => text.includes(word));
  const hasRatingAgency = RATING_AGENCY_TERMS.some((word) => text.includes(word));
  const source = String(item.source || "");
  const isPrimaryRegulator = ["RBI", "SEBI", "IRDAI", "PFRDA", "IFSCA", "PIB"].includes(source);
  const eventType = normalizeEventType(item.eventType || item.category || item.defaultCategory);
  const highSignalEvent = HIGH_SIGNAL_EVENT_TYPES.has(eventType);

  if (isPrimaryRegulator) return hasCoreBfsiTerm || hasRegulatoryMaterial || hasKnownEntity;
  if (hasRatingAgency) return hasCoreBfsiTerm || hasKnownEntity;
  if (hasKnownEntity && highSignalEvent) return true;
  if (hasCoreBfsiTerm && highSignalEvent) return true;
  return hasCoreBfsiTerm && ["ET BFSI", "BusinessLine", "Financial Express Direct", "Moneycontrol Banks Direct"].includes(source);
}

function filterPortalItems(items = []) {
  return items.filter((item) => isFinancialServicesMaterial(item));
}

function toNewsItem(item, index) {
  const combined = `${item.title} ${item.description} ${item.source}`;
  const category = classifyCategory(combined, item.defaultCategory);
  const sector = classifySector(combined, category);
  const segment = classifySegment(combined, category);
  const risk = riskFor(combined, category);
  const impact = impactFor(category, risk);
  const keywords = CATEGORY_KEYWORDS.find((entry) => entry.category === category)?.words || [];
  const entities = extractEntities(combined);
  const tags = [category, sector, item.source, ...entities.slice(0, 2), ...keywords.slice(0, 1)].filter(Boolean);

  return {
    id: `${item.source}-${hashText(item.link || item.title)}-${index}`,
    time: relativeTime(item.publishedAt),
    source: item.source,
    sector,
    segment,
    category,
    eventType: category,
    headline: item.title,
    tldr: item.description || item.title,
    whyMatters: buildWhyMatters(category, item.source),
    impactNBFC: impact.nbfc,
    impactDigital: impact.digital,
    impactInvestor: impact.investor,
    tags: [...new Set(tags)],
    risk,
    trending: (() => {
      const ageHours = item.publishedAt ? Math.max(0, (Date.now() - new Date(item.publishedAt).getTime()) / 3600000) : 72;
      const score =
        (risk === "High" ? 3 : 0) +
        (category === "Regulation" ? 2 : 0) +
        (["Ratings / Credit", "Credit Rating"].includes(category) ? 2 : 0) +
        (["Risk Alert", "Risk Signal", "Penalty"].includes(category) ? 2 : 0) +
        (["RBI", "SEBI", "PIB"].includes(item.source) ? 2 : 0) +
        (ageHours < 6 ? 1 : 0);
      return score >= 3;
    })(),
    url: item.link,
    publishedAt: item.publishedAt,
    publishedTs: publishedTime(item),
    sourceTier: sourceTierFor(item.source),
    sourceType: item.sourceType || "news_feed",
    materialityReason: materialityReason({ category, sector, source: item.source, entities, sourceType: item.sourceType || "news_feed" }),
  };
}

function buildAlerts(newsItems) {
  return newsItems
    .filter((item) => item.risk === "High" || ["Regulation", "Penalty", "Ratings / Credit", "Credit Rating"].includes(item.category))
    .slice(0, 5)
    .map((item) => ({
      type: item.risk === "High" ? "critical" : ["Ratings / Credit", "Credit Rating"].includes(item.category) ? "success" : "info",
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
  { name: "Fibe", group: "Digital Lender", keywords: ["fibe", "earlysalary", "early salary"] },
  { name: "DMI Finance", group: "Digital Lender", keywords: ["dmi finance", "dmi fintech"] },
  { name: "Lendingkart", group: "Digital Lender", keywords: ["lendingkart"] },
  { name: "Indifi", group: "Digital Lender", keywords: ["indifi"] },
  { name: "Axio", group: "Digital Lender", keywords: ["axio", "capital float"] },
  { name: "PhonePe", group: "Payments", keywords: ["phonepe"] },
  { name: "Paytm", group: "Payments", keywords: ["paytm", "one 97 communications"] },
  { name: "Groww", group: "Broking", keywords: ["groww"] },
  { name: "Zerodha", group: "Broking", keywords: ["zerodha"] },
  { name: "Angel One", group: "Broking", keywords: ["angel one", "angel broking"] },
  { name: "HDFC Bank", group: "Bank", keywords: ["hdfc bank"] },
  { name: "ICICI Bank", group: "Bank", keywords: ["icici bank"] },
  { name: "SBI", group: "Bank", keywords: ["sbi", "state bank of india"] },
  { name: "Axis Bank", group: "Bank", keywords: ["axis bank"] },
];

const ENTITY_MASTER = (() => {
  const baseEntities = WATCHLIST_ENTITIES.map((entity) => ({
    name: entity.name,
    slug: slugify(entity.name),
    keywords: entity.keywords,
  }));

  const listedEntities = [...new Set(Object.values(BSE_BFSI_CODES))]
    .filter((name) => !baseEntities.some((entity) => entity.name === name))
    .map((name) => ({
      name,
      slug: slugify(name),
      keywords: [name.toLowerCase()],
    }));

  return [...baseEntities, ...listedEntities];
})();

export function extractEntities(text = "") {
  const lower = text.toLowerCase();
  return ENTITY_MASTER
    .filter((entity) => {
      if (entity.name === "Bank of India" && lower.includes("reserve bank of india")) return false;
      return entity.keywords.some((keyword) => lower.includes(keyword));
    })
    .map((entity) => entity.name)
    .slice(0, 8);
}

function scoreReasoning(item, score, entities = []) {
  const reasons = [
    `${item.category || "Policy"} signal`,
    `${item.source || "Unknown source"} source`,
    item.risk === "High" ? "high-risk wording" : null,
    item.sourceType === "exchange_filing" ? "primary filing" : null,
    entities.length ? `entities: ${entities.slice(0, 3).join(", ")}` : null,
    item.timeBasis === "ingested" ? "published time unavailable" : "published timestamp available",
    `score ${score}`,
  ].filter(Boolean);

  return reasons.join("; ");
}

function rebalanceSources(items, limit = 36) {
  const primary = [];
  const direct = [];
  const aggregator = [];

  items.forEach((item) => {
    const tier = sourceTierFor(item.source);
    if (tier === "primary") primary.push(item);
    else if (tier === "direct") direct.push(item);
    else aggregator.push(item);
  });

  const selected = [];
  const addUntil = (pool, maxItems) => {
    for (const item of pool) {
      if (selected.length >= limit || maxItems <= 0) break;
      selected.push(item);
      maxItems -= 1;
    }
    return maxItems;
  };

  addUntil(primary, Math.min(primary.length, limit));
  addUntil(direct, Math.min(direct.length, limit - selected.length));
  addUntil(aggregator, Math.min(12, limit - selected.length));

  if (selected.length < limit) {
    for (const item of [...primary, ...direct, ...aggregator]) {
      if (selected.length >= limit) break;
      if (!selected.includes(item)) selected.push(item);
    }
  }

  return selected;
}

function materialScore(item) {
  const base = Number(item.score || 0);
  const risk = item.risk === "High" ? 45 : item.risk === "Medium" ? 18 : 0;
  const category = {
    Regulation: 35,
    Penalty: 38,
    "Ratings / Credit": 32,
    "Credit Rating": 32,
    "Risk Alert": 40,
    "Risk Signal": 40,
    Earnings: 28,
    "Company Filing": 24,
    Policy: 22,
    Fundraise: 18,
    "Funding / M&A": 18,
    Partnership: 15,
    "AI & Tech": 10,
    "Product / Tech": 10,
  }[item.category] || 8;
  const official = ["RBI", "SEBI", "IRDAI", "PFRDA", "IFSCA", "BSE", "NSE"].includes(item.source) ? 28 : 0;

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
      reason: item.materialityReason || item.scoreReasoning,
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
    const mediumRisk = highRisk || matches.some((item) => ["Regulation", "Penalty", "Ratings / Credit", "Credit Rating", "Risk Alert", "Risk Signal"].includes(item.category));

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
    .filter((item) => ["Ratings / Credit", "Credit Rating"].includes(item.category) && (item.entities?.length || RATING_AGENCY_TERMS.some((term) => `${item.headline} ${item.tldr} ${item.source}`.toLowerCase().includes(term))))
    .slice(0, 8)
    .map((item) => {
      const lower = item.headline.toLowerCase();
      const direction = lower.includes("downgrade") || lower.includes("negative") ? "down" : "up";
      const entity = item.entities?.[0] || item.company || item.headline.split(/[:|\-|—]/)[0].slice(0, 48);
      return {
        entity: item.headline.split(/[:|-|—]/)[0].slice(0, 48),
        from: "Watch",
        to: direction === "up" ? "Positive" : "Negative",
        outlook: direction === "up" ? "Positive" : "Watch",
        agency: item.source,
        direction,
        date: item.time,
        rationale: item.tldr,
        entity,
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
    sourceTier: sourceTierFor(RSS_FEEDS[index].source),
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
    .filter((item) => !shouldExcludePortalItem(item))
    .filter((item) => {
      const key = item.link || item.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => publishedTime(b) - publishedTime(a));

  return {
    items: rebalanceSources(relevant).map(toNewsItem),
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
  return articles
    .map((article, index) => toNewsItem({
      title: article.title,
      description: article.seendate ? `Discovered by GDELT on ${article.seendate}.` : "Discovered by GDELT.",
      link: article.url,
      publishedAt: article.seendate,
      source: article.sourceCommonName || "GDELT",
      defaultCategory: "Policy",
    }, index))
    .filter((item) => !shouldExcludePortalItem(item));
}

async function fetchHtmlSourceNews() {
  const results = await Promise.allSettled(HTML_SOURCES.map(async (source) => {
    const response = await fetchWithTimeout(source.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36",
        "Accept-Language": "en-IN,en;q=0.9",
      },
      next: { revalidate: 900 },
    }, 7000);

    if (!response.ok) throw new Error(`${source.source} returned ${response.status}`);
    return parseHtmlSource(await response.text(), source);
  }));

  const health = results.map((result, index) => ({
    source: HTML_SOURCES[index].source,
    url: HTML_SOURCES[index].url,
    defaultCategory: HTML_SOURCES[index].defaultCategory,
    type: "HTML",
    sourceTier: "direct",
    status: result.status === "fulfilled" ? "ok" : "error",
    itemCount: result.status === "fulfilled" ? result.value.length : 0,
    error: result.status === "rejected" ? result.reason?.message || "Source failed" : null,
  }));

  const items = results
    .flatMap((result) => result.status === "fulfilled" ? result.value : [])
    .map(toNewsItem)
    .filter((item) => !shouldExcludePortalItem(item));

  return { items, health };
}

export function dedupeAndRankNews(items) {
  const ranked = items
    .map((item) => {
      const enrichedItem = applyTimeFields(item);
      const category = normalizeEventType(enrichedItem.category) || enrichedItem.category || classifyCategory(`${enrichedItem.headline} ${enrichedItem.tldr}`, enrichedItem.defaultCategory);
      const sector = enrichedItem.sector || classifySector(`${enrichedItem.headline} ${enrichedItem.tldr}`, category);
      const normalizedUrl = normalizeUrl(enrichedItem.url);
      const fingerprint = sha256([
        normalizeHeadline(enrichedItem.headline),
        normalizeHeadline(enrichedItem.tldr || ""),
        normalizeHeadline(enrichedItem.company || ""),
        enrichedItem.category || "",
      ].join("|"));
      const entities = extractEntities(`${enrichedItem.headline} ${enrichedItem.tldr} ${(enrichedItem.tags || []).join(" ")}`);
      const score = relevanceScore({ ...enrichedItem, category, sector });

      return {
        ...enrichedItem,
        normalizedUrl,
        contentFingerprint: fingerprint,
        category,
        eventType: enrichedItem.eventType || category,
        sector,
        segment: enrichedItem.segment || classifySegment(`${enrichedItem.headline} ${enrichedItem.tldr}`, category),
        entities,
        affectedEntities: entities.reduce((acc, name) => ({ ...acc, [name]: score }), {}),
        relatedSources: item.relatedSources || [enrichedItem.source],
        score,
        scoreReasoning: scoreReasoning({ ...enrichedItem, category, sector }, score, entities),
        materialityReason: enrichedItem.materialityReason || materialityReason({ ...enrichedItem, category, sector, entities }),
      };
    })
    .sort((a, b) => b.score - a.score);
  const deduped = [];

  for (const item of ranked) {
    const duplicate = deduped.find((candidate) => {
      if ((candidate.dedupeKey || "") && candidate.dedupeKey === item.dedupeKey) return true;
      if ((candidate.normalizedUrl || "") && candidate.normalizedUrl === item.normalizedUrl) return true;
      if ((candidate.contentFingerprint || "") && candidate.contentFingerprint === item.contentFingerprint) return true;
      return headlineSimilarity(candidate.headline, item.headline) >= 0.88;
    });

    if (!duplicate) {
      deduped.push({
        ...item,
        sourceCount: 1,
      });
      continue;
    }

    duplicate.relatedSources = [...new Set([...(duplicate.relatedSources || [duplicate.source]), item.source])];
    duplicate.sourceCount = duplicate.relatedSources.length;
    duplicate.tags = [...new Set([...(duplicate.tags || []), ...(item.tags || [])])];
    if ((item.publishedTs || 0) > (duplicate.publishedTs || 0)) {
      duplicate.publishedAt = item.publishedAt || duplicate.publishedAt;
    }
    duplicate.publishedTs = Math.max(duplicate.publishedTs || 0, item.publishedTs || 0);
    duplicate.timeBasis = duplicate.publishedTs ? "published" : duplicate.timeBasis;
    duplicate.time = relativeTime(duplicate.publishedTs ? duplicate.publishedAt : duplicate.ingestedAt);
    if (!duplicate.url && item.url) duplicate.url = item.url;
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

  const [screenerData, bsePresentations] = await Promise.all([
    fetchScreenerData(),
    fetchBsePresentations(),
  ]);
  peerData = peerData.map((peer) => {
    const meta = FINANCE_SYMBOLS.find((item) => item.symbol === peer.symbol);
    const screener = screenerData[meta?.screenerSlug] || {};
    const bse = bsePresentations[meta?.bseCode] || {};
    const fieldCoverage = [
      screener.marketCap || peer.marketCap,
      screener.currentPrice || peer.price,
      screener.pb,
      screener.roe || peer.roe,
      screener.roa,
      screener.loanBook,
      screener.qtrProfit,
      screener.assetSize,
      bse.presentationUrl,
    ].filter(Boolean).length;
    const metricsConfidence = fieldCoverage >= 6 ? "High" : fieldCoverage >= 3 ? "Medium" : "Low";
    const metricsSources = [...new Set([marketSource, screener.source, bse.presentationUrl ? "BSE investor deck" : null].filter(Boolean))];
    return {
      ...peer,
      aum: peer.aum || screener.marketCap || 0,
      marketCap: peer.marketCap || peer.aum || screener.marketCap || 0,
      price: peer.price || screener.currentPrice || 0,
      pe: peer.pe || screener.pe || 0,
      pb: screener.pb || ((peer.price || screener.currentPrice) && screener.bookValue ? Number(((peer.price || screener.currentPrice) / screener.bookValue).toFixed(2)) : 0),
      roe: screener.roe || peer.roe,
      roce: screener.roce || 0,
      roa: screener.roa || 0,
      loanBook: screener.loanBook || 0,
      qtrProfit: screener.qtrProfit || 0,
      qtrSales: screener.qtrSales || 0,
      bookValue: screener.bookValue || 0,
      dividendYield: screener.dividendYield || 0,
      debtToEquity: screener.debtToEquity || 0,
      assetSize: screener.assetSize || 0,
      screenerUrl: meta?.screenerSlug ? `https://www.screener.in/company/${meta.screenerSlug}/consolidated/` : null,
      presentationUrl: bse.presentationUrl || null,
      presentationDate: bse.presentationDate || null,
      dataSource: screener.source || marketSource,
      metricsSource: metricsSources.join(" + ") || marketSource,
      metricsAsOf: bse.presentationDate || new Date().toISOString().slice(0, 10),
      metricsPeriod: bse.presentationDate ? `Investor deck ${bse.presentationDate}` : "Latest available public data",
      metricsConfidence,
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
    const assetSize = extractLatestRowNumber(html, "Total Assets") || extractScreenerNumber(html, "Total Assets") || extractScreenerNumber(html, "Assets");
    const qtrProfit = extractLatestRowNumber(html, "Net Profit") || extractScreenerNumber(html, "Net Profit");
    const loanBook = extractLatestRowNumber(html, "Advances") || extractLatestRowNumber(html, "Loans") || extractLatestRowNumber(html, "Loan Book") || extractScreenerNumber(html, "Advances") || 0;
    const roa = extractScreenerNumber(html, "Return on Assets") || extractScreenerNumber(html, "ROA") || (assetSize && qtrProfit ? Number(((qtrProfit * 4) / assetSize * 100).toFixed(2)) : 0);
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
      roa,
      loanBook,
      qtrProfit,
      qtrSales: extractLatestRowNumber(html, "Revenue") || extractLatestRowNumber(html, "Sales") || extractScreenerNumber(html, "Sales"),
      debtToEquity: extractScreenerNumber(html, "Debt to equity"),
      assetSize,
    };
  }));

  return Object.fromEntries(results
    .filter((result) => result.status === "fulfilled" && result.value?.slug)
    .map((result) => [result.value.slug, result.value]));
}

async function fetchBsePresentations() {
  const today = new Date();
  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const fmt = (d) => `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;

  const results = await Promise.allSettled(
    FINANCE_SYMBOLS.filter((item) => item.bseCode).map(async (item) => {
      const url = `https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w?strCat=Presentation&strPrevDate=${fmt(sixMonthsAgo)}&strScripCd=${item.bseCode}&strSearch=P&strToDate=${fmt(today)}&strType=C&subcategory=-1`;
      const response = await fetchWithTimeout(url, {
        headers: { "User-Agent": "Mozilla/5.0 LendingIQ/1.0", "Referer": "https://www.bseindia.com" },
      }, 5000);
      if (!response.ok) return null;
      const json = await response.json();
      const filings = json?.Table || [];
      const latest = filings.find((f) => f.ATTACHMENT && /\.pdf$/i.test(f.ATTACHMENT));
      if (!latest) return null;
      return {
        bseCode: item.bseCode,
        presentationUrl: `https://www.bseindia.com/xml-data/corpfiling/AttachLive/${latest.ATTACHMENT}`,
        presentationDate: latest.NEWS_DT ? latest.NEWS_DT.split("T")[0] : null,
      };
    })
  );

  return Object.fromEntries(
    results
      .filter((r) => r.status === "fulfilled" && r.value)
      .map((r) => [r.value.bseCode, r.value])
  );
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

const BUCKET_CONNECTORS = {
  Regulation: "On the regulatory front",
  Penalty: "In enforcement",
  "Risk Signal": "Risk alert",
  "Risk Alert": "Risk alert",
  "Credit Rating": "In credit markets",
  "Ratings / Credit": "In credit markets",
  Fundraise: "On the capital side",
  "Funding / M&A": "On the capital side",
  Partnership: "In partnership activity",
  Earnings: "In earnings",
  "Company Filing": "In filings",
  Policy: "Policy update",
  "AI & Tech": "In fintech and technology",
  "Product / Tech": "In fintech and technology",
};

function buildBucketNarrative(items) {
  if (!items.length) return null;
  const top = [...items].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 8);
  const byCategory = {};
  top.forEach((item) => {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  });

  const sentences = [];
  const used = new Set();
  const clip = (text, max = 95) => text && text.length > max ? `${text.slice(0, max)}…` : text;
  const priorityOrder = ["Regulation", "Penalty", "Risk Alert", "Risk Signal", "Ratings / Credit", "Credit Rating", "Funding / M&A", "Fundraise", "Partnership", "Earnings", "Company Filing", "Policy", "Product / Tech", "AI & Tech"];

  for (const cat of priorityOrder) {
    const catItems = (byCategory[cat] || []).filter((i) => !used.has(i.id));
    if (!catItems.length) continue;

    const item = catItems[0];
    const connector = BUCKET_CONNECTORS[cat] || "Update";
    const tldrExtra = item.tldr && item.tldr !== item.headline && item.tldr.length > 20
      ? ` ${clip(item.tldr, 80)}`
      : "";
    sentences.push(`${connector}: ${clip(item.headline)}${tldrExtra ? " —" + tldrExtra : ""}.`);
    used.add(item.id);

    if (catItems.length > 1) {
      const second = catItems[1];
      sentences.push(`Separately, ${clip(second.headline)}.`);
      used.add(second.id);
    }
    if (catItems.length > 2) {
      sentences.push(`${catItems.length - 2} more ${cat.toLowerCase()} item${catItems.length - 2 > 1 ? "s" : ""} in the feed.`);
    }
    if (sentences.length >= 5) break;
  }

  const remaining = top.filter((i) => !used.has(i.id)).slice(0, 2);
  remaining.forEach((item) => { sentences.push(`Also: ${clip(item.headline)}.`); });

  return sentences.join(" ");
}

function buildTimeBuckets(newsItems) {
  const now = Date.now();
  const BUCKETS = [
    { label: "Last 1 hour", icon: "⚡", min: 0, max: 60 },
    { label: "1–2 hours ago", icon: "🔔", min: 60, max: 120 },
    { label: "2–6 hours ago", icon: "📰", min: 120, max: 360 },
    { label: "6–12 hours ago", icon: "🗂", min: 360, max: 720 },
  ];

  return BUCKETS.map((bucket) => {
    const items = newsItems
      .filter((item) => {
        if (!item.publishedTs) return false;
        const ageMin = (now - item.publishedTs) / 60000;
        return ageMin >= bucket.min && ageMin < bucket.max;
      })
      .sort((a, b) => (b.score || 0) - (a.score || 0));

    if (!items.length) return null;

    return {
      label: bucket.label,
      icon: bucket.icon,
      count: items.length,
      summary: buildBucketNarrative(items),
      topItems: items.slice(0, 5).map((i) => ({
        id: i.id,
        headline: i.headline,
        tldr: i.tldr,
        source: i.source,
        category: i.category,
        risk: i.risk,
        url: i.url,
        time: i.time,
        segment: i.segment,
        sector: i.sector,
        eventType: i.eventType || i.category,
        entities: i.entities || [],
        materialityReason: i.materialityReason || i.scoreReasoning,
        score: i.score,
      })),
    };
  }).filter(Boolean);
}

function buildBriefHash(newsItems = [], ratingChanges = []) {
  return sha256(JSON.stringify({
    news: newsItems.slice(0, 12).map((item) => [item.id, item.headline, item.category, item.score, item.publishedAt]),
    ratings: ratingChanges.slice(0, 6).map((item) => [item.entity, item.direction, item.agency, item.date]),
  }));
}

function buildPrecedents(newsItems = []) {
  return newsItems
    .filter((item) => item.sourceType === "exchange_filing" || ["Regulation", "Penalty", "Ratings / Credit", "Credit Rating", "Risk Alert", "Risk Signal"].includes(item.category))
    .slice(0, 3)
    .map((item) => {
      if (item.sourceType === "exchange_filing") {
        return `${item.company || item.source}: official filing may move lenders from commentary into action mode.`;
      }
      if (item.category === "Regulation") {
        return `${item.source}: similar regulatory notices usually translate into compliance and product-rule changes within one cycle.`;
      }
      if (["Ratings / Credit", "Credit Rating"].includes(item.category)) {
        return `${item.source}: rating actions often ripple into peer funding costs and debt market sentiment.`;
      }
      return `${item.headline}: risk signals like this tend to widen monitoring and underwriting scrutiny across peers.`;
    });
}

function buildWatchFor(newsItems = []) {
  const watchItems = newsItems
    .filter((item) => item.risk === "High" || item.sourceType === "exchange_filing" || item.category === "Regulation")
    .slice(0, 4);

  return watchItems.map((item) => {
    if (item.sourceType === "exchange_filing") {
      return `Watch for follow-on disclosures or management commentary from ${item.company || item.source}.`;
    }
    if (item.category === "Regulation") {
      return `Watch for lender responses, implementation dates, and second-order compliance cost impact.`;
    }
    return `Watch for whether ${item.entities?.[0] || item.source} turns this signal into ratings, collections, or provisioning pressure.`;
  });
}

function buildBriefSummary(newsItems = []) {
  const top = newsItems
    .filter((item) => item.score >= 90 || item.sourceType === "exchange_filing" || ["Regulation", "Penalty", "Ratings / Credit", "Risk Alert"].includes(item.category))
    .slice(0, 4);
  if (!top.length) return null;
  return top
    .map((item, index) => {
      const prefix = index === 0 ? "What changed" : index === 1 ? "Why it matters" : "Also watch";
      const entity = item.entities?.[0] || item.company || item.sector || item.segment || item.source;
      return `${prefix}: ${entity} - ${item.headline} (${item.source}).`;
    })
    .join(" ");
}

function buildDailyBriefPayload(newsItems, ratingChanges, hash) {
  const downgrades = ratingChanges.filter((r) => r.direction === "down");
  const upgrades = ratingChanges.filter((r) => r.direction === "up");

  return {
    hash,
    summary: buildBriefSummary(newsItems),
    timeBuckets: buildTimeBuckets(newsItems),
    riskSignals: newsItems
    .filter((item) => item.risk === "High" || ["Risk Alert", "Risk Signal"].includes(item.category))
      .slice(0, 3)
      .map((item) => item.headline),
    opportunities: newsItems
    .filter((item) => ["Funding / M&A", "Fundraise", "Partnership", "Policy", "Product / Tech", "AI & Tech"].includes(item.category))
      .slice(0, 3)
      .map((item) => item.headline),
    ratingSnapshot: {
      downgrades: downgrades.slice(0, 3).map((r) => ({ entity: r.entity, from: r.from, to: r.to, agency: r.agency })),
      upgrades: upgrades.slice(0, 3).map((r) => ({ entity: r.entity, from: r.from, to: r.to, agency: r.agency })),
    },
    precedent: buildPrecedents(newsItems),
    watchFor: buildWatchFor(newsItems),
  };
}

async function buildDailyBrief(newsItems, ratingChanges) {
  const hash = buildBriefHash(newsItems, ratingChanges);
  const cachedBrief = await loadCachedBrief(hash);
  if (cachedBrief) return cachedBrief;

  const brief = buildDailyBriefPayload(newsItems, ratingChanges, hash);
  await saveCachedBrief(hash, brief);
  return brief;
}

function buildCoLendingData(newsItems) {
  const CO_KEYWORDS = [
    "co-lending", "co lending", "colending", "partnership", "tie-up", "tieup",
    "joint lending", "psl", "priority sector", "bank-nbfc", "nbfc-bank",
    "collaboration", "joint venture", "co-origination",
  ];
  return newsItems
    .filter((item) => {
      const text = `${item.headline} ${item.tldr}`.toLowerCase();
      return item.category === "Partnership" || CO_KEYWORDS.some((kw) => text.includes(kw));
    })
    .slice(0, 10)
    .map((item) => ({
      bank: item.source,
      nbfc: item.headline.split(/ with | partners? | tie-up | tieup |:/i)[1]?.slice(0, 50) || "NBFC / lending partner",
      segment: item.tags?.find((tag) => !["Partnership", item.source].includes(tag)) || "Lending",
      volume: "Reported",
      status: item.time === "Just now" || item.time.includes("m ago") || item.time.includes("h ago") ? "New" : "Active",
      startDate: item.time,
      geography: "India",
      headline: item.headline,
      tldr: item.tldr,
      url: item.url,
    }));
}

function buildGovtSchemes(newsItems) {
  const POLICY_KEYWORDS = [
    // RBI & SEBI regulatory
    "rbi", "sebi", "circular", "notification", "guideline", "direction", "master direction",
    "regulation", "compliance", "penalty", "framework", "monetary policy",
    // Lending policy
    "repo rate", "crr", "slr", "priority sector", "psl", "co-lending", "colending",
    "digital lending", "dlg", "dla", "lending service provider", "lsp",
    "nbfc regulation", "nbfc circular", "bank regulation", "fair practices",
    "interest rate", "base rate", "mclr", "credit policy",
    // Schemes & incentives
    "scheme", "credit guarantee", "cgfmu", "ncgtc", "eclgs", "mudra",
    "pm kisan", "jan dhan", "pmjdy", "financial inclusion", "interest subvention",
    "credit subsidy", "pm svanidhi", "pm svandidhi", "stand up india",
    "startup india", "atmanirbhar", "credit flow", "refinance",
    // Housing & MSME
    "nhb", "national housing bank", "sidbi", "nabard", "msme credit",
    "affordable housing", "pradhan mantri awas", "pmay",
    // Ministry & Govt
    "ministry of finance", "government scheme", "budget", "fiscal",
    "finance ministry", "niti aayog", "pib",
    // Global/macro policy
    "fed rate", "us federal", "imf", "world bank", "basel",
  ];

  return newsItems
    .filter((item) => {
      const text = `${item.headline} ${item.tldr} ${item.tags?.join(" ") || ""} ${item.source}`.toLowerCase();
      return POLICY_KEYWORDS.some((word) => text.includes(word));
    })
    .slice(0, 25)
    .map((item) => ({
      id: item.id,
      headline: item.headline,
      tldr: item.tldr,
      source: item.source,
      time: item.time,
      url: item.url,
      category: item.category,
      risk: item.risk,
      segment: item.segment,
      tags: item.tags || [],
      trending: item.trending || false,
    }));
}

function extractPenaltyAmount(text = "") {
  const match = text.match(/(?:rs\.?|inr|₹)\s?([\d,.]+)\s?(crore|cr|lakh|lakhs)?/i);
  if (!match) return null;
  return `${match[1]} ${match[2] || ""}`.trim();
}

function buildPenaltyTracker(newsItems) {
  return newsItems
    .filter((item) => {
      const text = `${item.headline} ${item.tldr} ${(item.tags || []).join(" ")}`.toLowerCase();
      return ["penalty", "fine", "fined", "compliance action"].some((word) => text.includes(word));
    })
    .slice(0, 25)
    .map((item) => ({
      id: item.id,
      entity: item.company || item.entities?.[0] || item.source,
      regulator: item.source,
      amount: extractPenaltyAmount(`${item.headline} ${item.tldr}`),
      headline: item.headline,
      category: item.category,
      publishedAt: item.publishedAt || item.ingestedAt,
      slug: item.slug,
      url: item.url,
    }));
}

function sourceTierFor(source) {
  if (["BSE", "NSE", "RBI", "SEBI", "IRDAI", "PFRDA", "IFSCA", "PIB"].includes(source)) return "primary";
  if (String(source || "").startsWith("Google News")) return "aggregator";
  return "direct";
}

function buildSourceStats(sources = []) {
  const counts = sources.reduce((acc, source) => {
    const tier = source.sourceTier || "unknown";
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {});
  const total = sources.length || 1;
  const aggregatorPct = Math.round(((counts.aggregator || 0) / total) * 100);
  const directPct = Math.round((((counts.direct || 0) + (counts.primary || 0)) / total) * 100);

  return {
    totalSources: sources.length,
    primarySources: counts.primary || 0,
    directSources: counts.direct || 0,
    aggregatorSources: counts.aggregator || 0,
    directCoveragePct: directPct,
    aggregatorDependencyPct: aggregatorPct,
  };
}

async function buildIntelligencePayload() {
    const [rssNewsResult, htmlNewsResult, gdeltNewsResult, marketResult, globalResult, archivedItems, bseResult, nseResult] = await Promise.allSettled([
      fetchRssNews(),
      fetchHtmlSourceNews(),
      fetchGdeltNews(),
      fetchMarketData(),
      fetchGlobalData(),
      loadNewsArchive(),
      fetchBseAnnouncements(),
      fetchNseAnnouncements(),
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
    const htmlItems = htmlNewsResult.status === "fulfilled" ? htmlNewsResult.value.items : [];
    const htmlHealth = htmlNewsResult.status === "fulfilled"
      ? htmlNewsResult.value.health
      : HTML_SOURCES.map((source) => ({
          source: source.source,
          url: source.url,
          defaultCategory: source.defaultCategory,
          type: "HTML",
          sourceTier: "direct",
          status: "error",
          itemCount: 0,
          error: htmlNewsResult.reason?.message || "HTML refresh failed",
        }));
    const gdeltItems = gdeltNewsResult.status === "fulfilled" ? gdeltNewsResult.value : [];
    const bseItems = bseResult.status === "fulfilled" ? bseResult.value : [];
    const nseItems = nseResult.status === "fulfilled" ? nseResult.value : [];
    const freshCandidates = dedupeAndRankNews([...bseItems, ...nseItems, ...rssItems, ...htmlItems, ...gdeltItems]);
    const freshDeduped = filterPortalItems(freshCandidates);
    const qualityStats = {
      candidateItems: freshCandidates.length,
      materialItems: freshDeduped.length,
      filteredItems: Math.max(0, freshCandidates.length - freshDeduped.length),
    };

    // Merge fresh news with 24h archive from Redis
    const archive = archivedItems.status === "fulfilled" ? filterPortalItems(archivedItems.value) : [];
    const dedupedNews = freshDeduped.length
      ? filterPortalItems(dedupeAndRankNews([...freshDeduped, ...archive]))
      : archive;

    // Persist merged set back to Redis (fire-and-forget)
    if (freshDeduped.length) saveNewsArchive(freshDeduped);

    const newsItems = withArticleSlugs(
      dedupedNews.length
        ? dedupedNews
        : filterPortalItems(NEWS_ITEMS)
    ).map(applyTimeFields);
    const apiHealth = [
      {
        source: "BSE Filings",
        url: "https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w",
        type: "API",
        status: bseResult.status === "fulfilled" ? "ok" : "error",
        itemCount: bseResult.status === "fulfilled" ? bseResult.value.length : 0,
        error: bseResult.status === "rejected" ? bseResult.reason?.message || "BSE filings failed" : null,
      },
      {
        source: "NSE Filings",
        url: "https://www.nseindia.com/api/corporate-announcements",
        type: "API",
        status: nseResult.status === "fulfilled" ? "ok" : "error",
        itemCount: nseResult.status === "fulfilled" ? nseResult.value.length : 0,
        error: nseResult.status === "rejected" ? nseResult.reason?.message || "NSE filings failed" : null,
      },
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
    const penalties = buildPenaltyTracker(newsItems);
    const materialUpdates = buildMaterialUpdates(newsItems, market.peerData, resolvedRatings);
    const watchlist = buildWatchlist(newsItems, market.peerData, resolvedRatings);
    const dailyBrief = await buildDailyBrief(newsItems, resolvedRatings);
    const sourceStats = buildSourceStats([...rssHealth, ...htmlHealth, ...apiHealth]);

    return {
      newsItems,
      alerts: alerts.length ? alerts : ALERTS,
      ratingChanges: resolvedRatings,
      sectorMetrics: market.sectorMetrics,
      peerData: market.peerData,
      globalData,
      coLendingData: coLendingData.length ? coLendingData : CO_LENDING_DATA,
      govtSchemes: govtSchemes.length ? govtSchemes : GOVT_SCHEMES,
      penalties,
      materialUpdates,
      watchlist,
      dailyBrief,
      sources: {
        rss: rssHealth,
        html: htmlHealth,
        apis: apiHealth,
      },
      sourceHealth: [...rssHealth, ...htmlHealth, ...apiHealth],
      sourceStats,
      qualityStats,
      updatedAt: new Date().toISOString(),
      cache: {
        cached: false,
        refreshedAt: new Date().toISOString(),
      },
    };
}

export async function getIntelligenceSnapshot({ forceRefresh = false } = {}) {
  if (!forceRefresh) {
    const cached = await readIntelligenceCache();
    if (cached) {
      return {
        ...cached,
        cache: {
          ...(cached.cache || {}),
          servedFromCache: true,
        },
      };
    }
  }

  try {
    const payload = await buildIntelligencePayload();
    return await writeIntelligenceCache(payload);
  } catch (error) {
    const cached = await readIntelligenceCache();
    if (cached) {
      return {
        ...cached,
        error: error.message,
        cache: {
          ...(cached.cache || {}),
          servedFromCache: true,
          refreshFailed: true,
          refreshError: error.message,
        },
      };
    }

    return await fallbackPayload(error);
  }
}

export async function GET(request) {
  const url = new URL(request.url);
  const forceRefresh = url.searchParams.has("refresh");
  return Response.json(await getIntelligenceSnapshot({ forceRefresh }));
}

export async function POST() {
  return Response.json(await getIntelligenceSnapshot({ forceRefresh: true }));
}
