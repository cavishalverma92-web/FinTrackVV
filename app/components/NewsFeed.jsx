"use client";

import { useState, useEffect } from "react";
import { FILTER_OPTIONS } from "../../data/appConfig";
import { Flame, Clock, ExternalLink, RefreshCw } from "lucide-react";

const FRESHNESS_OPTIONS = [
  { label: "All", hours: null },
  { label: "24h", hours: 24 },
  { label: "7d", hours: 24 * 7 },
  { label: "30d", hours: 24 * 30 },
];

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
    Fundraise: "var(--accent-blue)",
    Partnership: "var(--accent-blue)",
    "Risk Signal": "var(--accent-red)",
    Policy: "var(--accent-amber)",
    "AI & Tech": "var(--accent-blue)",
  };
  return colors[category] || "var(--text-secondary)";
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

function itemMatchesFreshness(item, hours) {
  if (!hours) return true;
  if (!item.publishedTs) return false;
  return Date.now() - item.publishedTs <= hours * 60 * 60 * 1000;
}

const SEGMENT_KEYWORDS = {
  NBFCs: [
    "nbfc",
    "non banking",
    "bajaj finance",
    "shriram finance",
    "muthoot",
    "manappuram",
    "iifl",
    "poonawalla",
    "tata capital",
    "l&t finance",
    "cholamandalam",
    "mahindra finance",
    "sundaram finance",
  ],
  "Digital Lenders": [
    "digital lender",
    "digital lending",
    "fintech lender",
    "moneyview",
    "money view",
    "kissht",
    "kreditbee",
    "navi",
    "lendingkart",
    "krazybee",
    "zestmoney",
    "paytm",
    "phonepe",
    "bharatpe",
    "mobikwik",
  ],
  Banks: [
    "bank",
    "hdfc",
    "icici",
    "axis",
    "kotak",
    "sbi",
    "state bank",
    "bank of baroda",
    "canara",
    "union bank",
    "indusind",
    "yes bank",
    "idfc first",
    "rbl",
  ],
  "AI & Tech": [
    "ai",
    "artificial intelligence",
    "machine learning",
    "technology",
    "tech",
    "automation",
    "underwriting model",
    "data science",
    "credit scoring",
    "digital platform",
  ],
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
  if (item.segment === segment) return true;
  const text = itemText(item);

  if (segment === "Others") {
    return !["NBFCs", "Digital Lenders", "Banks", "AI & Tech"].some((group) => itemMatchesSegment(item, group));
  }

  return (SEGMENT_KEYWORDS[segment] || []).some((keyword) => text.includes(keyword));
}

export default function NewsFeed({
  newsItems = [],
  dataStatus = "ready",
  dataError,
  sources,
  updatedAt,
  cache,
  searchQuery = "",
  selectedId,
  onSelectNews,
  onRefresh,
}) {
  const [filter, setFilter] = useState("All");
  const [freshness, setFreshness] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("newsFreshness");
    if (saved !== null) setFreshness(saved === "null" ? null : Number(saved));
  }, []);

  function handleFreshnessChange(hours) {
    setFreshness(hours);
    localStorage.setItem("newsFreshness", hours === null ? "null" : String(hours));
  }

  const filteredNews = newsItems
    .filter((item) => itemMatchesSegment(item, filter))
    .filter((item) => itemMatchesFreshness(item, freshness))
    .filter((item) => itemMatchesSearch(item, searchQuery));
  const sourceCount = (sources?.rss?.length || 0) + (sources?.apis?.length || 0);
  const updatedLabel = formatUpdatedAt(updatedAt);

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-bold font-display tracking-tight">
              Live Intelligence Feed
            </h2>
            <p className="text-xs text-[var(--text-dim)] mt-1">
              {dataStatus === "loading" ? "Refreshing live sources" : "Real-time updates from trusted sources"}
              {" "}- {newsItems.length} items
              {filteredNews.length !== newsItems.length ? ` - ${filteredNews.length} visible` : ""}
          {sourceCount ? ` - ${sourceCount} sources` : ""}
          {updatedLabel ? ` - Updated ${updatedLabel}` : ""}
          {cache?.servedFromCache ? " - cached" : ""}
        </p>
        {cache?.savedAt && (
          <p className="text-[10px] text-[var(--text-dim)] mt-1 font-mono">
            Last good snapshot: {new Date(cache.savedAt).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
          </div>
          <button
            onClick={onRefresh}
            disabled={dataStatus === "loading"}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--accent-green)] text-white text-[11px] font-bold cursor-pointer disabled:opacity-60 disabled:cursor-wait"
          >
            <RefreshCw size={13} className={dataStatus === "loading" ? "animate-spin" : ""} />
            News Refresh
          </button>
        </div>
        {dataStatus === "fallback" && (
          <p className="text-[11px] text-[var(--accent-amber)] mt-2">
            Live source refresh is unavailable, showing the last local snapshot. {dataError}
          </p>
        )}
        {dataStatus === "ready" && sources?.rss?.length > 0 && (
          <p className="text-[10px] text-[var(--text-dim)] mt-2 font-mono">
            RSS: {sources.rss.map((source) => source.source).join(", ")}
            {sources.apis?.length ? ` - APIs: ${sources.apis.map((source) => source.source).join(", ")}` : ""}
          </p>
        )}
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`
              px-3 py-1.5 rounded-md text-[11px] font-semibold
              cursor-pointer transition-all border-none
              ${filter === f
                ? "bg-[var(--accent-green)] text-white"
                : "bg-[var(--bg-elevated)] text-[var(--text-dim)] hover:text-[var(--text-secondary)]"
              }
            `}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <span className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-wider font-mono">
          Freshness
        </span>
        {FRESHNESS_OPTIONS.map((option) => (
          <button
            key={option.label}
            onClick={() => handleFreshnessChange(option.hours)}
            className={`
              px-3 py-1.5 rounded-md text-[11px] font-semibold cursor-pointer transition-all
              ${freshness === option.hours
                ? "bg-[var(--accent-blue)] text-white"
                : "bg-[var(--bg-elevated)] text-[var(--text-dim)] hover:text-[var(--text-secondary)]"
              }
            `}
          >
            {option.label}
          </button>
        ))}
        {searchQuery.trim() && (
          <span className="text-[11px] text-[var(--text-dim)] ml-1">
            Search: "{searchQuery.trim()}"
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {filteredNews.map((item, index) => (
          <article
            key={item.id}
            onClick={() => onSelectNews(item)}
            className={`
              p-4 rounded-xl cursor-pointer transition-all border
              animate-fade-in stagger-${Math.min(index + 1, 8)}
              ${selectedId === item.id
                ? "bg-[rgba(29,111,214,0.06)] border-[rgba(29,111,214,0.25)]"
                : "bg-[var(--bg-card)] border-[var(--border-subtle)] card-hover"
              }
            `}
          >
            <div className="flex items-center gap-2 mb-2">
              <Tag label={item.source} color="var(--accent-blue)" />
              <Tag label={item.category} color={getCategoryColor(item.category)} />
              {item.trending && (
                <Flame size={12} className="text-[var(--accent-amber)]" />
              )}
              <div className="ml-auto flex items-center gap-1 text-[10px] text-[var(--text-dim)] font-mono">
                <Clock size={10} />
                {item.time}
              </div>
            </div>

            <h3 className="text-[13px] font-semibold text-[var(--text-primary)] leading-snug mb-2">
              {item.headline}
            </h3>

            <p className="text-[11px] text-[var(--text-dim)] leading-relaxed line-clamp-2">
              {item.tldr}
            </p>

            <div className="flex items-center gap-3 mt-3 flex-wrap">
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--accent-blue)] hover:underline"
                >
                  Read full article
                  <ExternalLink size={11} />
                </a>
              )}
              {typeof item.score === "number" && (
                <span className="text-[10px] text-[var(--text-dim)] font-mono">
                  Relevance {item.score}
                </span>
              )}
              {item.risk === "High" && (
                <Tag label="High Risk" color="var(--accent-red)" />
              )}
            </div>
          </article>
        ))}

        {filteredNews.length === 0 && (
          <div className="text-center py-12 text-[var(--text-dim)]">
            <p className="text-3xl mb-3 opacity-20">⌀</p>
            <p className="text-sm font-semibold">No items match the current filters</p>
            <p className="text-xs mt-1 opacity-70">Try adjusting the segment, freshness, or search query</p>
          </div>
        )}
      </div>
    </div>
  );
}
