"use client";

import { AlertTriangle, TrendingUp, Zap, Star, BarChart2 } from "lucide-react";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getBriefLabel() {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning Brief";
  if (hour < 16) return "Afternoon Update";
  return "Evening Wrap";
}

function getTopThree(newsItems) {
  const priority = { Critical: 4, High: 3, Medium: 2, Low: 1 };
  return [...newsItems]
    .map((item) => ({
      ...item,
      score:
        (priority[item.impactNBFC] || 0) +
        (priority[item.impactDigital] || 0) +
        (priority[item.impactInvestor] || 0) +
        (item.trending ? 2 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function getRiskRatio(newsItems) {
  const risks = newsItems.filter(
    (item) => item.risk === "High" || item.impactNBFC === "Critical" || item.impactDigital === "Critical"
  ).length;
  const opportunities = newsItems.filter(
    (item) =>
      item.risk !== "High" &&
      item.impactNBFC !== "Critical" &&
      ["Fundraise", "Partnership", "Credit Rating"].includes(item.category)
  ).length;
  const mood = risks > opportunities ? "caution" : risks === 0 ? "clear" : "balanced";
  return { risks, opportunities, mood };
}

function getMacroSnippet(globalData = []) {
  const find = (label) => globalData.find((item) => item.indicator?.toLowerCase().includes(label.toLowerCase()));
  const usdInr = find("USD/INR");
  const repo = find("Repo") || find("India");
  const us10y = find("10Y") || find("US 10");
  return [usdInr, repo, us10y].filter(Boolean).slice(0, 3);
}

export default function DailyBrief({
  newsItems = [],
  ratingChanges = [],
  brief,
  globalData = [],
  dataStatus = "ready",
}) {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const greeting = getGreeting();
  const briefLabel = getBriefLabel();
  const topThree = getTopThree(newsItems);
  const { risks, opportunities, mood } = getRiskRatio(newsItems);
  const macroSnippet = getMacroSnippet(globalData);

  const marketPulse = brief?.marketPulse || newsItems.slice(0, 4).map((item) => item.headline).join(" ");
  const riskSignals = brief?.riskSignals?.length
    ? brief.riskSignals
    : newsItems.filter((item) => item.risk === "High").slice(0, 3).map((item) => item.headline);
  const opportunityItems = brief?.opportunities?.length
    ? brief.opportunities
    : newsItems.filter((item) => item.risk !== "High").slice(0, 3).map((item) => item.headline);

  const freshCount = newsItems.filter(
    (item) => item.publishedTs && Date.now() - item.publishedTs < 6 * 60 * 60 * 1000
  ).length;

  const moodColor =
    mood === "caution" ? "var(--accent-amber)" :
    mood === "clear" ? "var(--accent-green)" :
    "var(--accent-blue)";
  const moodLabel =
    mood === "caution" ? "Risk-heavy day" :
    mood === "clear" ? "Clear outlook" :
    "Balanced signals";

  return (
    <div className="max-w-3xl animate-fade-in">
      <div className="p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] mb-5">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-xs text-[var(--text-dim)] font-mono mb-0.5">{greeting}, Vishal</p>
            <h2 className="text-xl font-bold font-display tracking-tight">
              Daily Intelligence Brief
            </h2>
            <p className="text-xs text-[var(--text-dim)] font-mono mt-1">
              {today}
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold text-[var(--accent-green)] bg-[rgba(29,111,214,0.1)] font-mono uppercase tracking-wider flex-shrink-0">
            {briefLabel}
          </span>
        </div>

        {/* ── Stats bar ── */}
        <div className="flex items-center gap-4 mt-4 mb-5 p-3 rounded-lg bg-[var(--bg-primary)] flex-wrap">
          <Stat label="Articles" value={newsItems.length} />
          <div className="w-px h-6 bg-[var(--border-subtle)] hidden sm:block" />
          <Stat label="Fresh (6h)" value={freshCount} color={freshCount > 5 ? "var(--accent-green)" : "var(--text-dim)"} />
          <div className="w-px h-6 bg-[var(--border-subtle)] hidden sm:block" />
          <Stat label="Risk signals" value={risks} color={risks > 3 ? "var(--accent-red)" : "var(--text-secondary)"} />
          <div className="w-px h-6 bg-[var(--border-subtle)] hidden sm:block" />
          <Stat label="Opportunities" value={opportunities} color="var(--accent-green)" />
          <div className="w-px h-6 bg-[var(--border-subtle)] hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: moodColor }}
            />
            <span className="text-[11px] font-semibold font-mono" style={{ color: moodColor }}>
              {moodLabel}
            </span>
          </div>
          {dataStatus === "loading" && (
            <span className="text-[10px] text-[var(--text-dim)] font-mono ml-auto">Refreshing…</span>
          )}
        </div>

        {/* ── 3 Things That Matter Today ── */}
        {topThree.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Star size={12} className="text-[var(--accent-amber)]" />
              <h3 className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest font-mono">
                3 Things That Matter Today
              </h3>
            </div>
            <div className="space-y-2">
              {topThree.map((item, i) => (
                <div
                  key={item.id}
                  className="flex gap-3 p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)]"
                >
                  <span className="text-[11px] font-black text-[var(--accent-amber)] font-mono flex-shrink-0 mt-0.5">
                    {i + 1}.
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--text-primary)] leading-snug">
                      {item.headline}
                    </p>
                    {item.tldr && (
                      <p className="text-[11px] text-[var(--text-dim)] mt-0.5 leading-relaxed line-clamp-1">
                        {item.tldr}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[9px] font-bold uppercase tracking-wider font-mono text-[var(--text-dim)]">
                        {item.source}
                      </span>
                      {item.impactNBFC && item.impactNBFC !== "Low" && (
                        <span className="text-[9px] font-mono text-[var(--accent-amber)]">NBFC: {item.impactNBFC}</span>
                      )}
                      {item.impactDigital && item.impactDigital !== "Low" && (
                        <span className="text-[9px] font-mono text-[var(--accent-blue)]">Digital: {item.impactDigital}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Macro Corner ── */}
        {macroSnippet.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-[var(--bg-primary)] border-l-[3px] border-[var(--accent-blue)]">
            <div className="flex items-center gap-2 mb-2">
              <BarChart2 size={12} className="text-[var(--accent-blue)]" />
              <p className="text-[10px] font-bold text-[var(--accent-blue)] uppercase tracking-widest font-mono">
                Macro Corner
              </p>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              {macroSnippet.map((item) => (
                <span key={item.indicator} className="text-xs font-mono">
                  <span className="text-[var(--text-dim)]">{item.indicator}: </span>
                  <span
                    className="font-bold"
                    style={{
                      color: item.signal === "Caution" ? "var(--accent-amber)" :
                             item.signal === "Positive" ? "var(--accent-green)" :
                             "var(--text-primary)",
                    }}
                  >
                    {item.value}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Market Pulse ── */}
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
        </div>

        {/* ── Key Developments ── */}
        <div className="mb-6">
          <h3 className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest font-mono mb-4">
            Key Developments
          </h3>
          {newsItems.slice(0, 6).map((item, i) => (
            <div
              key={item.id}
              className={`flex gap-3 py-3 ${i < Math.min(newsItems.length, 6) - 1 ? "border-b border-[var(--border-subtle)]" : ""}`}
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

        {/* ── Credit Rating Actions ── */}
        {ratingChanges.length > 0 && (
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
                  <span className="text-[11px] text-[var(--text-dim)] font-mono">{r.from} → {r.to}</span>
                  <span className="text-[10px] text-[var(--text-dim)] ml-auto font-mono">{r.agency}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <SignalList
          title="Opportunities"
          icon={TrendingUp}
          color="var(--accent-green)"
          bg="rgba(29,111,214,0.08)"
          items={opportunityItems}
          empty="No opportunity signals in the current source refresh."
        />
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="flex flex-col">
      <span className="text-[18px] font-black font-display leading-none" style={{ color: color || "var(--text-primary)" }}>
        {value}
      </span>
      <span className="text-[9px] font-semibold text-[var(--text-dim)] uppercase tracking-wider font-mono mt-0.5">
        {label}
      </span>
    </div>
  );
}

function SignalList({ title, icon: Icon, color, bg, items, empty }) {
  const list = items.length ? items : [empty];
  return (
    <div className="p-4 rounded-xl border-l-[3px] mb-6" style={{ backgroundColor: bg, borderColor: color }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={12} style={{ color }} />
        <p className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color }}>
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
