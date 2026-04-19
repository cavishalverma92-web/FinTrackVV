"use client";

import { ExternalLink, ShieldAlert, TrendingUp, Star } from "lucide-react";

function riskColor(risk) {
  if (risk === "High") return "var(--accent-red)";
  if (risk === "Medium") return "var(--accent-amber)";
  return "var(--accent-blue)";
}

function actionLabel(risk, type) {
  if (risk === "High") return { label: "Act Now", color: "var(--accent-red)", bg: "rgba(217,74,93,0.12)" };
  if (type === "Credit Rating" || type === "Regulation") return { label: "Monitor", color: "var(--accent-amber)", bg: "rgba(183,121,31,0.12)" };
  return { label: "Track", color: "var(--accent-blue)", bg: "rgba(94,167,239,0.12)" };
}

export default function MaterialUpdates({ updates = [], onSelectNews }) {
  if (!updates.length) return null;

  const highCount = updates.filter((u) => u.risk === "High").length;

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-lg font-bold font-display tracking-tight flex items-center gap-2">
            Material Updates
            {highCount > 0 && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--accent-red)] text-white font-mono">
                {highCount} urgent
              </span>
            )}
          </h2>
          <p className="text-xs text-[var(--text-dim)] mt-1">
            Top-ranked signals across news, ratings and market moves
          </p>
        </div>
        <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[rgba(29,111,214,0.1)] text-[var(--accent-green)] text-[10px] font-bold uppercase tracking-wider font-mono">
          <Star size={10} /> Decision view
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {updates.slice(0, 4).map((update) => {
          const color = riskColor(update.risk);
          const action = actionLabel(update.risk, update.type);
          const clickable = update.newsItem && onSelectNews;

          return (
            <article
              key={update.id}
              onClick={() => clickable && onSelectNews(update.newsItem)}
              className={`p-4 rounded-xl border card-shadow ${clickable ? "cursor-pointer card-hover" : ""}`}
              style={{ borderColor: `${color}30`, borderLeftColor: color, borderLeftWidth: "3px" }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: `${color}15`, color }}
                >
                  {update.risk === "High" ? <ShieldAlert size={17} /> : <TrendingUp size={17} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider font-mono" style={{ color }}>
                      {update.type}
                    </span>
                    <span className="text-[10px] text-[var(--text-dim)] font-mono">
                      {update.source} · {update.time || "Latest"}
                    </span>
                    <span
                      className="ml-auto px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider font-mono"
                      style={{ color: action.color, backgroundColor: action.bg }}
                    >
                      {action.label}
                    </span>
                  </div>
                  <h3 className="text-[13px] font-semibold text-[var(--text-primary)] leading-snug mb-1.5">
                    {update.title}
                  </h3>
                  <p className="text-[11px] text-[var(--text-dim)] leading-relaxed line-clamp-2">
                    {update.detail}
                  </p>
                  {update.url && (
                    <a
                      href={update.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent-blue)] hover:underline mt-2"
                    >
                      Source <ExternalLink size={10} />
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
