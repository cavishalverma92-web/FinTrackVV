"use client";

import { AlertTriangle, TrendingUp, Zap } from "lucide-react";

export default function DailyBrief({
  newsItems = [],
  ratingChanges = [],
  brief,
  dataStatus = "ready",
}) {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const marketPulse = brief?.marketPulse || newsItems.slice(0, 4).map((item) => item.headline).join(" ");
  const riskSignals = brief?.riskSignals?.length
    ? brief.riskSignals
    : newsItems.filter((item) => item.risk === "High").slice(0, 3).map((item) => item.headline);
  const opportunities = brief?.opportunities?.length
    ? brief.opportunities
    : newsItems.filter((item) => item.risk !== "High").slice(0, 3).map((item) => item.headline);

  return (
    <div className="max-w-3xl animate-fade-in">
      <div className="p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] mb-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold font-display tracking-tight">
              Daily Intelligence Brief
            </h2>
            <p className="text-xs text-[var(--text-dim)] font-mono mt-1">
              {today} - Live Source Edition
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold text-[var(--accent-green)] bg-[rgba(29,111,214,0.1)] font-mono uppercase tracking-wider">
            2-min read
          </span>
        </div>

        <div className="p-4 bg-[var(--bg-primary)] rounded-xl border-l-[3px] border-[var(--accent-green)] mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={12} className="text-[var(--accent-green)]" />
            <p className="text-[10px] font-bold text-[var(--accent-green)] uppercase tracking-widest font-mono">
              Market Pulse
            </p>
          </div>
          <p className="text-[13px] text-[var(--text-primary)] leading-relaxed">
            {marketPulse || "Live feeds are refreshing. The brief will populate as source data arrives."}
          </p>
          {dataStatus === "loading" && (
            <p className="text-[10px] text-[var(--text-dim)] mt-2 font-mono">
              Refreshing RSS and market APIs
            </p>
          )}
        </div>

        <div className="mb-6">
          <h3 className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest font-mono mb-4">
            Key Developments
          </h3>
          {newsItems.slice(0, 6).map((item, i) => (
            <div
              key={item.id}
              className={`flex gap-3 py-3 ${
                i < Math.min(newsItems.length, 6) - 1 ? "border-b border-[var(--border-subtle)]" : ""
              }`}
            >
              <span className="text-[10px] font-black text-[var(--accent-green)] font-mono flex-shrink-0 mt-1 w-5 tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap">
                  <p className="text-xs font-semibold text-[var(--text-primary)] leading-snug flex-1">
                    {item.headline}
                  </p>
                  {item.risk === "High" && (
                    <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-black bg-[rgba(217,74,93,0.12)] text-[var(--accent-red)] font-mono uppercase">
                      High Risk
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[var(--text-dim)] mt-1 leading-relaxed">
                  {item.tldr}
                </p>
              </div>
            </div>
          ))}
        </div>

        <SignalList
          title="Risk Signals"
          icon={AlertTriangle}
          color="var(--accent-red)"
          bg="rgba(255,77,106,0.08)"
          items={riskSignals}
          empty="No high-risk live signals in the current source refresh."
        />

        <div className="mb-6">
          <h3 className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest font-mono mb-3">
            Credit Rating Actions
          </h3>
          <div className="space-y-2">
            {ratingChanges.slice(0, 4).map((r, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-[var(--bg-primary)] flex-wrap">
                <span
                  className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider font-mono"
                  style={{
                    color: r.direction === "up" ? "var(--accent-green)" : "var(--accent-red)",
                    backgroundColor: r.direction === "up" ? "rgba(29,111,214,0.12)" : "rgba(217,74,93,0.12)",
                  }}
                >
                  {r.direction === "up" ? "↑ Upgrade" : "↓ Downgrade"}
                </span>
                <span className="text-xs font-semibold text-[var(--text-primary)]">{r.entity}</span>
                <span className="text-[11px] text-[var(--text-dim)] font-mono">
                  {r.from} → {r.to}
                </span>
                <span className="text-[10px] text-[var(--text-dim)] ml-auto font-mono">{r.agency}</span>
              </div>
            ))}
          </div>
        </div>

        <SignalList
          title="Opportunities"
          icon={TrendingUp}
          color="var(--accent-green)"
          bg="rgba(29,111,214,0.08)"
          items={opportunities}
          empty="No opportunity signals in the current source refresh."
        />
      </div>
    </div>
  );
}

function SignalList({ title, icon: Icon, color, bg, items, empty }) {
  const list = items.length ? items : [empty];

  return (
    <div
      className="p-4 rounded-xl border-l-[3px] mb-6"
      style={{ backgroundColor: bg, borderColor: color }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={12} style={{ color }} />
        <p
          className="text-[10px] font-bold uppercase tracking-widest font-mono"
          style={{ color }}
        >
          {title}
        </p>
      </div>
      <ul className="space-y-2">
        {list.map((item, index) => (
          <li key={index} className="text-xs text-[var(--text-primary)] leading-relaxed flex gap-2">
            <span className="flex-shrink-0 mt-0.5" style={{ color }}>·</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
