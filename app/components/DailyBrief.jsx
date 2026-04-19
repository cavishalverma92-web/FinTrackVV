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
          <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4">
            Key Developments
          </h3>
          {newsItems.slice(0, 6).map((item, i) => (
            <div
              key={item.id}
              className={`flex gap-3 py-3 ${
                i < Math.min(newsItems.length, 6) - 1 ? "border-b border-[var(--border-subtle)]" : ""
              }`}
            >
              <span className="text-xs font-bold text-[var(--accent-green)] font-mono flex-shrink-0 mt-0.5 w-5">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)] leading-snug">
                  {item.headline}
                </p>
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
          <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-3">
            Credit Rating Changes
          </h3>
          <div className="space-y-2">
            {ratingChanges.slice(0, 4).map((r, i) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <span className={`font-bold ${r.direction === "up" ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]"}`}>
                  {r.direction === "up" ? "Up" : "Down"}
                </span>
                <span className="text-[var(--text-primary)] font-medium">{r.entity}:</span>
                <span className="text-[var(--text-dim)] font-mono">
                  {r.from} {"->"} {r.to}
                </span>
                <span className="text-[var(--text-dim)]">({r.outlook})</span>
                <span className="text-[var(--text-dim)]">- {r.agency}</span>
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
            <span className="flex-shrink-0" style={{ color }}>*</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
