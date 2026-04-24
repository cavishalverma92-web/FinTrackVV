"use client";

import { ExternalLink, ShieldAlert, TrendingUp, Star } from "lucide-react";

function riskColor(risk) {
  if (risk === "High") return "var(--accent-red)";
  if (risk === "Medium") return "var(--accent-amber)";
  return "var(--accent-blue)";
}

function actionLabel(risk, type) {
  if (risk === "High") return { label: "Act Now", color: "var(--accent-red)", bg: "rgba(168,50,50,0.1)" };
  if (["Credit Rating", "Ratings / Credit", "Regulation", "Penalty"].includes(type)) return { label: "Monitor", color: "var(--accent-amber)", bg: "rgba(163,101,27,0.1)" };
  return { label: "Track", color: "var(--accent-blue)", bg: "rgba(40,90,127,0.1)" };
}

export default function MaterialUpdates({ updates = [], onSelectNews }) {
  if (!updates.length) return null;

  const highCount = updates.filter((u) => u.risk === "High").length;

  return (
    <section className="mb-4">
      <div className="flex items-center gap-3 mb-2">
        <h2 className="text-lg font-bold font-display tracking-tight">
          Material Updates
        </h2>
        <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-[rgba(18,107,79,0.08)] border border-[rgba(18,107,79,0.16)] text-[var(--accent-green)] text-[9px] font-bold uppercase tracking-wider font-mono ml-auto">
          <Star size={9} /> Decision view
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
        {updates.slice(0, 4).map((update) => {
          const color = riskColor(update.risk);
          const action = actionLabel(update.risk, update.type);
          const clickable = update.newsItem && onSelectNews;

          return (
            <article
              key={update.id}
              onClick={() => clickable && onSelectNews(update.newsItem)}
              className={`px-3 py-2.5 rounded-md border bg-[var(--bg-card)] card-shadow ${clickable ? "cursor-pointer card-hover" : ""}`}
              style={{ borderColor: `${color}25`, borderLeftColor: color, borderLeftWidth: "3px" }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-sm flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${color}15`, color }}
                >
                  {update.risk === "High" ? <ShieldAlert size={13} /> : <TrendingUp size={13} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-[9px] font-bold uppercase tracking-wider font-mono" style={{ color }}>
                      {update.type}
                    </span>
                    <span className="text-[9px] text-[var(--text-dim)] font-mono">
                      {update.source} · {update.time || "Latest"}
                    </span>
                    <span
                      className="ml-auto px-1.5 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-wider font-mono"
                      style={{ color: action.color, backgroundColor: action.bg }}
                    >
                      {action.label}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[12px] font-semibold text-[var(--text-primary)] leading-snug line-clamp-2">
                      {update.title}
                    </h3>
                    {update.url && (
                      <a
                        href={update.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-shrink-0 text-[var(--accent-blue)]"
                      >
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                  {update.reason && (
                    <p className="text-[9px] text-[var(--text-dim)] font-mono mt-1 line-clamp-1">
                      {update.reason}
                    </p>
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
