"use client";

import { useState } from "react";
import { FILTER_OPTIONS } from "../../data/appConfig";
import { Flame, Clock, ExternalLink, RefreshCw } from "lucide-react";

function Tag({ label, color = "var(--accent-blue)" }) {
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider font-mono"
      style={{
        color,
        backgroundColor: `${color}18`,
      }}
    >
      {label}
    </span>
  );
}

function getCategoryColor(category) {
  const colors = {
    Regulation: "var(--accent-amber)",
    "Credit Rating": "var(--accent-green)",
    "Ratings / Credit": "var(--accent-green)",
    Penalty: "var(--accent-red)",
    Fundraise: "var(--accent-blue)",
    "Funding / M&A": "var(--accent-blue)",
    Partnership: "var(--accent-blue)",
    "Risk Signal": "var(--accent-red)",
    "Risk Alert": "var(--accent-red)",
    Earnings: "var(--accent-green)",
    "Company Filing": "#8B6FBF",
    Policy: "#8B6FBF",
    "AI & Tech": "var(--accent-blue)",
    "Product / Tech": "var(--accent-blue)",
  };
  return colors[category] || "var(--text-secondary)";
}

function getCategoryClass(category) {
  const map = {
    Regulation: "cat-regulation",
    "Credit Rating": "cat-rating",
    "Ratings / Credit": "cat-rating",
    Penalty: "cat-risk",
    Fundraise: "cat-fundraise",
    "Funding / M&A": "cat-fundraise",
    Partnership: "cat-partnership",
    "Risk Signal": "cat-risk",
    "Risk Alert": "cat-risk",
    Earnings: "cat-rating",
    "Company Filing": "cat-policy",
    Policy: "cat-policy",
    "AI & Tech": "cat-ai",
    "Product / Tech": "cat-ai",
  };
  return map[category] || "";
}

function getImpactColor(level) {
  if (level === "Critical") return "var(--accent-red)";
  if (level === "High") return "var(--accent-amber)";
  if (level === "Medium") return "var(--accent-blue)";
  return "var(--text-dim)";
}

function isNew(publishedTs) {
  return publishedTs && Date.now() - publishedTs < 2 * 60 * 60 * 1000;
}

function formatUpdatedAt(value) {
  if (!value) return null;
  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function itemMatchesSearch(item, query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return [
    item.headline,
    item.tldr,
    item.source,
    item.category,
    item.risk,
    ...(item.tags || []),
  ].join(" ").toLowerCase().includes(normalized);
}

const SEGMENT_KEYWORDS = {
  NBFCs: [
    "nbfc", "non banking", "non-banking",
    "bajaj finance", "shriram finance", "muthoot", "manappuram",
    "iifl", "poonawalla", "tata capital", "l&t finance",
    "cholamandalam", "mahindra finance", "sundaram finance",
    "can fin", "aavas", "five star", "five-star",
    "creditaccess", "credit access", "fusion finance",
    "mas financial", "aptus", "repco", "home first",
    "aadhar housing", "india shelter",
    "microfinance", "nbfc-mfi", "mfi",
    "housing finance", "hfc",
    "msme lending", "sme finance", "sidbi",
    "arohan", "spandana", "asirvad", "bandhan",
    "ncd issuance", "non convertible debenture",
  ],
  "Digital Lenders": [
    "digital lender", "digital lending", "fintech lender",
    "moneyview", "money view", "kissht", "kreditbee",
    "navi fintech", "navi technologies", "navi mutual fund", "navi loan", "navi insurance", "sachin bansal navi",
    "lendingkart", "krazybee", "zestmoney",
    "paytm lending", "phonepe loan", "bharatpe", "mobikwik",
    "freo", "uni cards", "slice pay", "liquiloans",
    "stashfin", "fibe", "early salary", "cashe", "aye finance",
    "lendbox", "faircent", "p2p lending",
    "bnpl", "buy now pay later", "pay later",
    "lazypay", "simpl", "amazon pay later", "flipkart pay later",
    "flexiloans", "indifi", "neogrowth", "oxyzo", "mintifi", "progcap",
    "yubi", "credavenue", "northern arc capital", "vivriti capital",
    "getvantage", "recur club", "rupeek", "paysense", "finnable",
    "incred", "neobank", "neo-bank", "embedded lending",
  ],
  Banks: [
    "hdfc bank", "icici bank", "axis bank", "kotak bank",
    "kotak mahindra bank", "state bank of india", "sbi",
    "bank of baroda", "canara bank", "union bank",
    "indusind bank", "yes bank", "idfc first",
    "rbl bank", "federal bank", "pnb", "punjab national",
    "au small finance", "jana bank", "equitas bank", "ujjivan",
    "bank credit", "bank lending", "banking sector",
  ],
  "AI & Tech": [
    "artificial intelligence", "machine learning",
    "generative ai", "large language model", "llm",
    "ai in lending", "ai in banking", "ai underwriting", "ai credit",
    "underwriting model", "credit scoring model", "fraud detection",
    "regtech", "insurtech", "wealthtech",
    "ekyc", "video kyc", "digital kyc", "kyc automation",
    "account aggregator", "aa framework", "ocen", "open credit enablement",
    "digital rupee", "cbdc", "upi credit", "ondc", "open banking",
    "embedded finance", "neobank", "neo-bank",
    "perfios", "setu", "signzy", "idfy", "karza", "lentra",
    "nucleus software", "intellect design", "newgen software",
    "fintech technology", "automation in lending", "robo advisor",
  ],
  HFCs: ["housing finance", "home loan", "hfc", "aavas", "aptus", "home first", "can fin", "lic housing", "pnb housing"],
  MFIs: ["microfinance", "nbfc-mfi", "mfi", "creditaccess", "spandana", "fusion finance", "muthoot microfin", "arohan"],
  "Gold Loans": ["gold loan", "muthoot", "manappuram", "rupeek"],
  "Vehicle Finance": ["vehicle finance", "commercial vehicle", "mahindra finance", "shriram finance"],
  Payments: ["upi", "payment aggregator", "payments bank", "phonepe", "paytm", "mobikwik", "bharatpe"],
  Broking: ["zerodha", "groww", "angel one", "broking", "broker"],
  Insurance: ["insurance", "policybazaar", "pb fintech", "hdfc life", "sbi life", "star health"],
};

function itemText(item) {
  return [
    item.headline,
    item.tldr,
    item.source,
    item.category,
    ...(item.tags || []),
  ].join(" ").toLowerCase();
}

function itemMatchesSegment(item, segment) {
  if (segment === "All") return true;
  if (segment === "Exchange Filings") return item.sourceType === "exchange_filing";
  if (item.segment === segment || item.sector === segment) return true;
  const text = itemText(item);

  if (segment === "Others") {
    return !["NBFCs", "Digital Lenders", "Banks", "AI & Tech", "Exchange Filings"].some((group) => itemMatchesSegment(item, group));
  }

  return (SEGMENT_KEYWORDS[segment] || []).some((keyword) => text.includes(keyword));
}

export default function NewsFeed({
  newsItems = [],
  dataStatus = "ready",
  dataError,
  updatedAt,
  cache,
  qualityStats,
  searchQuery = "",
  selectedId,
  onSelectNews,
  onRefresh,
}) {
  const [filter, setFilter] = useState("All");

  const filteredNews = newsItems
    .filter((item) => itemMatchesSegment(item, filter))
    .filter((item) => itemMatchesSearch(item, searchQuery));
  const updatedLabel = formatUpdatedAt(updatedAt);

  return (
    <div>
      <div className="mb-4">
        {/* ── Title row with refresh inline ── */}
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-lg font-bold font-display tracking-tight flex-1">
            Live Intelligence Feed
          </h2>
          <button
            onClick={onRefresh}
            disabled={dataStatus === "loading"}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--accent-green)] text-white text-[11px] font-bold cursor-pointer disabled:opacity-60 disabled:cursor-wait flex-shrink-0"
          >
            <RefreshCw size={12} className={dataStatus === "loading" ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* ── Subtitle ── */}
        <p className="text-xs text-[var(--text-dim)] mb-2">
          {newsItems.length} articles
          {filteredNews.length !== newsItems.length ? ` · ${filteredNews.length} visible` : ""}
          {updatedLabel ? ` · Updated ${updatedLabel}` : ""}
          {cache?.servedFromCache ? " · cached" : ""}
        </p>

        {qualityStats?.filteredItems > 0 && (
          <p className="text-[11px] text-[var(--accent-green)] mt-1">
            Quality gate filtered {qualityStats.filteredItems} noisy or non-BFSI items from this refresh.
          </p>
        )}

        {dataStatus === "fallback" && (
          <p className="text-[11px] text-[var(--accent-amber)] mt-1">
            Showing last snapshot — live refresh unavailable. {dataError}
          </p>
        )}
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`
              px-3 py-1 rounded-full text-[11px] font-semibold
              cursor-pointer transition-all border
              ${filter === f
                ? "bg-[var(--accent-green)] text-white border-[var(--accent-green)]"
                : "bg-transparent text-[var(--text-dim)] border-[var(--border-subtle)] hover:border-[var(--border-hover)] hover:text-[var(--text-secondary)]"
              }
            `}
          >
            {f}
          </button>
        ))}
      </div>

      {searchQuery.trim() && (
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <span className="text-[11px] text-[var(--text-dim)]">
            Search: "{searchQuery.trim()}"
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {filteredNews.map((item, index) => (
          <article
            key={item.id}
            onClick={() => onSelectNews(item)}
            className={`
              p-4 rounded-xl cursor-pointer transition-all border card-shadow
              animate-fade-in stagger-${Math.min(index + 1, 8)}
              ${getCategoryClass(item.category)}
              ${selectedId === item.id
                ? "bg-[rgba(29,111,214,0.06)] border-[rgba(29,111,214,0.25)]"
                : "bg-[var(--bg-card)] border-[var(--border-subtle)] card-hover"
              }
            `}
          >
            {/* Row 1 — meta */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Tag label={item.source} color={item.sourceType === "exchange_filing" ? "#8B6FBF" : "var(--accent-blue)"} />
              {item.sourceType === "exchange_filing" && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider font-mono" style={{ background: "rgba(139,111,191,0.15)", color: "#8B6FBF" }}>
                  Filing
                </span>
              )}
              {item.sourceCount > 1 && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider font-mono bg-[var(--bg-primary)] text-[var(--text-dim)]">
                  +{item.sourceCount - 1} source{item.sourceCount - 1 > 1 ? "s" : ""}
                </span>
              )}
              <Tag label={item.category} color={getCategoryColor(item.category)} />
              {item.sector && item.sector !== item.segment && (
                <Tag label={item.sector} color="var(--text-secondary)" />
              )}
              {item.trending && <Flame size={12} className="text-[var(--accent-amber)]" />}
              {isNew(item.publishedTs) && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-[var(--accent-red)] text-white uppercase tracking-wider font-mono">
                  NEW
                </span>
              )}
              <div className="ml-auto flex items-center gap-1 text-[10px] text-[var(--text-dim)] font-mono">
                <Clock size={10} />
                {item.time}
                {item.timeBasis === "ingested" ? " (ingested)" : ""}
              </div>
            </div>

            {/* Row 2 — headline */}
            <h3 className="text-[13px] font-semibold text-[var(--text-primary)] leading-snug mb-2">
              {item.headline}
            </h3>

            {/* Row 3 — tldr */}
            <p className="text-[11px] text-[var(--text-dim)] leading-relaxed line-clamp-2 mb-3">
              {item.tldr}
            </p>

            {/* Row 4 — impact + link */}
            {item.materialityReason && (
              <p className="text-[10px] text-[var(--text-dim)] leading-relaxed mb-3 font-mono">
                Why shown: {item.materialityReason}
              </p>
            )}

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-3">
                {["impactNBFC", "impactDigital", "impactInvestor"].map((key, i) => {
                  const labels = ["NBFC", "Digital", "Investor"];
                  const val = item[key];
                  if (!val || val === "Low") return null;
                  return (
                    <span key={key} className="text-[10px] font-mono">
                      <span className="text-[var(--text-dim)]">{labels[i]}: </span>
                      <span className="font-bold" style={{ color: getImpactColor(val) }}>{val}</span>
                    </span>
                  );
                })}
              </div>
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent-blue)] hover:underline"
                >
                  Read <ExternalLink size={10} />
                </a>
              )}
            </div>
          </article>
        ))}

        {filteredNews.length === 0 && (
          <div className="text-center py-12 text-[var(--text-dim)]">
            <p className="text-3xl mb-3 opacity-20">⌀</p>
            <p className="text-sm font-semibold">No items match the current filters</p>
            <p className="text-xs mt-1 opacity-70">Try adjusting the segment or search query</p>
          </div>
        )}
      </div>
    </div>
  );
}
