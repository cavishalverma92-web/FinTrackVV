"use client";

import { useState } from "react";
import { ExternalLink, Search } from "lucide-react";

function statusColor(risk) {
  if (risk === "High") return "var(--accent-red)";
  if (risk === "Medium") return "var(--accent-amber)";
  return "var(--accent-blue)";
}

function money(value) {
  if (!value) return "-";
  if (value >= 1000) return `Rs ${(value / 1000).toFixed(0)}K Cr`;
  return `Rs ${value} Cr`;
}

export default function WatchlistPanel({ watchlist = [] }) {
  const [query, setQuery] = useState("");

  if (!watchlist.length) return null;

  const filtered = query.trim()
    ? watchlist.filter((item) =>
        `${item.name} ${item.group} ${item.latestHeadline}`.toLowerCase().includes(query.toLowerCase())
      )
    : watchlist;

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold font-display tracking-tight">
            Company Watchlist
          </h2>
          <p className="text-xs text-[var(--text-dim)] mt-1">
            Named lender radar across news, ratings and financial metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5">
            <Search size={12} className="text-[var(--text-dim)]" />
            <input
              type="text"
              placeholder="Search entities..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent text-xs text-[var(--text-primary)] placeholder-[var(--text-dim)] outline-none w-32"
            />
          </div>
          <span className="text-[10px] text-[var(--text-dim)] font-mono">
            {watchlist.filter((item) => item.risk !== "Low").length} need attention
          </span>
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-[var(--text-dim)] py-4">No entities match "{query}"</p>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.slice(0, 9).map((item) => {
          const color = statusColor(item.risk);

          return (
            <article
              key={item.name}
              className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] card-hover"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      {item.name}
                    </h3>
                    {item.screenerUrl && (
                      <a href={item.screenerUrl} target="_blank" rel="noreferrer" className="text-[var(--accent-blue)]">
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                  <p className="text-[10px] text-[var(--text-dim)] font-mono uppercase tracking-wider">
                    {item.group}
                  </p>
                </div>
                <span
                  className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider font-mono"
                  style={{ color, backgroundColor: `${color}18` }}
                >
                  {item.status}
                </span>
              </div>

              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mt-3 line-clamp-2">
                {item.latestHeadline}
              </p>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <MiniStat label="Updates" value={item.updates} />
                <MiniStat label="P/B" value={item.pb ? `${item.pb}x` : "-"} />
                <MiniStat label="PAT" value={item.qtrProfit ? `${item.qtrProfit} Cr` : "-"} />
              </div>
              <div className="mt-2">
                <MiniStat label="Asset size" value={money(item.assetSize)} wide />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function MiniStat({ label, value, wide = false }) {
  return (
    <div className={`rounded-md bg-[var(--bg-primary)] px-3 py-2 ${wide ? "flex items-center justify-between" : ""}`}>
      <p className="text-[9px] text-[var(--text-dim)] font-mono uppercase tracking-wider">
        {label}
      </p>
      <p className="text-xs font-bold text-[var(--text-primary)] mt-1">
        {value}
      </p>
    </div>
  );
}
