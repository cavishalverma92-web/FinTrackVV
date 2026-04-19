"use client";

import { ExternalLink, ShieldAlert, TrendingUp } from "lucide-react";

function riskColor(risk) {
  if (risk === "High") return "var(--accent-red)";
  if (risk === "Medium") return "var(--accent-amber)";
  return "var(--accent-blue)";
}

export default function MaterialUpdates({ updates = [], onSelectNews }) {
  if (!updates.length) return null;

  return (
    <section className="mb-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-lg font-bold font-display tracking-tight">
            Material Updates
          </h2>
          <p className="text-xs text-[var(--text-dim)] mt-1">
            Prioritized signals from news, ratings, valuations and market moves
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-md bg-[rgba(29,111,214,0.1)] text-[var(--accent-green)] text-[10px] font-bold uppercase tracking-wider font-mono">
          Decision view
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {updates.slice(0, 4).map((update) => {
          const color = riskColor(update.risk);
          const clickable = update.newsItem && onSelectNews;

          return (
            <article
              key={update.id}
              onClick={() => clickable && onSelectNews(update.newsItem)}
              className={`p-4 rounded-xl border bg-[var(--bg-card)] ${clickable ? "cursor-pointer card-hover" : ""}`}
              style={{ borderColor: `${color}44` }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${color}18`, color }}
                >
                  {update.risk === "High" ? <ShieldAlert size={16} /> : <TrendingUp size={16} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider font-mono"
                      style={{ color }}
                    >
                      {update.type}
                    </span>
                    <span className="text-[10px] text-[var(--text-dim)] font-mono">
                      {update.source} - {update.time || "Latest"}
                    </span>
                    <span className="ml-auto text-[10px] text-[var(--text-dim)] font-mono">
                      Score {Math.round(update.score || 0)}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] leading-snug">
                    {update.title}
                  </h3>
                  <p className="text-[11px] text-[var(--text-dim)] leading-relaxed mt-2 line-clamp-2">
                    {update.detail}
                  </p>
                  {update.url && (
                    <a
                      href={update.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--accent-blue)] hover:underline mt-3"
                    >
                      Open source
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
