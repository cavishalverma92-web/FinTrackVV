"use client";

import { AlertTriangle, TrendingUp, BarChart2, ExternalLink, Clock } from "lucide-react";

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

function getSegmentCounts(newsItems) {
  const counts = { NBFCs: 0, "Digital Lenders": 0, Banks: 0, "AI & Tech": 0, Others: 0 };
  newsItems.forEach((item) => {
    if (counts[item.segment] !== undefined) counts[item.segment]++;
    else counts.Others++;
  });
  return counts;
}

const SEGMENT_COLORS = {
  NBFCs: "var(--accent-amber)",
  "Digital Lenders": "var(--accent-blue)",
  Banks: "var(--accent-green)",
  "AI & Tech": "#8B6FBF",
  Others: "var(--text-dim)",
};

function getMacroSnippet(globalData = []) {
  const find = (label) => globalData.find((item) => item.indicator?.toLowerCase().includes(label.toLowerCase()));
  const usdInr = find("USD/INR");
  const repo = find("Repo") || find("India");
  const us10y = find("10Y") || find("US 10");
  return [usdInr, repo, us10y].filter(Boolean).slice(0, 3);
}

// Urgency style per bucket index (0 = freshest)
const BUCKET_STYLES = [
  { border: "#F59E0B", bg: "rgba(245,158,11,0.06)", labelColor: "#F59E0B" },
  { border: "var(--accent-blue)", bg: "rgba(77,163,255,0.06)", labelColor: "var(--accent-blue)" },
  { border: "var(--accent-blue)", bg: "rgba(77,163,255,0.04)", labelColor: "var(--accent-blue)" },
  { border: "var(--border-subtle)", bg: "var(--bg-primary)", labelColor: "var(--text-dim)" },
];

const RISK_COLORS = {
  High: { color: "var(--accent-red)", bg: "rgba(217,74,93,0.12)" },
  Medium: { color: "var(--accent-amber)", bg: "rgba(245,158,11,0.12)" },
  Low: { color: "var(--text-dim)", bg: "var(--bg-primary)" },
};

export default function DailyBrief({
  newsItems = [],
  ratingChanges = [],
  brief,
  globalData = [],
  dataStatus = "ready",
  onSelectNews,
}) {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const greeting = getGreeting();
  const briefLabel = getBriefLabel();
  const { risks, opportunities, mood } = getRiskRatio(newsItems);
  const macroSnippet = getMacroSnippet(globalData);
  const segmentCounts = getSegmentCounts(newsItems);
  const totalSegment = Object.values(segmentCounts).reduce((a, b) => a + b, 0) || 1;

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

  // Time buckets from backend, fall back to empty
  const timeBuckets = brief?.timeBuckets || [];

  // Ratings: prefer brief.ratingSnapshot, fall back to ratingChanges prop
  const downgrades = brief?.ratingSnapshot?.downgrades?.length
    ? brief.ratingSnapshot.downgrades
    : ratingChanges.filter((r) => r.direction === "down").slice(0, 3).map((r) => `${r.entity}: ${r.from} → ${r.to} (${r.agency})`);
  const upgrades = brief?.ratingSnapshot?.upgrades?.length
    ? brief.ratingSnapshot.upgrades
    : ratingChanges.filter((r) => r.direction === "up").slice(0, 3).map((r) => `${r.entity}: ${r.from} → ${r.to} (${r.agency})`);

  // Risk signals and opportunities from backend or fallback
  const riskSignals = brief?.riskSignals?.length
    ? brief.riskSignals
    : newsItems.filter((item) => item.risk === "High").slice(0, 4).map((item) => item.headline);
  const opportunityItems = brief?.opportunities?.length
    ? brief.opportunities
    : newsItems.filter((item) => item.risk !== "High" && ["Fundraise", "Partnership"].includes(item.category)).slice(0, 4).map((item) => item.headline);

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
            <p className="text-xs text-[var(--text-dim)] font-mono mt-1">{today}</p>
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
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: moodColor }} />
            <span className="text-[11px] font-semibold font-mono" style={{ color: moodColor }}>{moodLabel}</span>
          </div>
          {dataStatus === "loading" && (
            <span className="text-[10px] text-[var(--text-dim)] font-mono ml-auto">Refreshing…</span>
          )}
        </div>

        {/* ── Segment Heat Bar ── */}
        {newsItems.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest font-mono mb-2">
              Today's Activity by Segment
            </p>
            <div className="flex h-2 rounded-full overflow-hidden mb-2">
              {Object.entries(segmentCounts)
                .filter(([, count]) => count > 0)
                .map(([seg, count]) => (
                  <div
                    key={seg}
                    style={{ width: `${(count / totalSegment) * 100}%`, backgroundColor: SEGMENT_COLORS[seg] }}
                    title={`${seg}: ${count}`}
                  />
                ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {Object.entries(segmentCounts)
                .filter(([, count]) => count > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([seg, count]) => (
                  <span key={seg} className="flex items-center gap-1.5 text-[10px] font-mono">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: SEGMENT_COLORS[seg] }} />
                    <span className="text-[var(--text-dim)]">{seg}</span>
                    <span className="font-bold text-[var(--text-secondary)]">{count}</span>
                  </span>
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

        {/* ── Time-Bucketed Intelligence ── */}
        {timeBuckets.length > 0 ? (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={12} className="text-[var(--text-dim)]" />
              <h3 className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest font-mono">
                Intelligence by Time
              </h3>
            </div>
            <div className="space-y-4">
              {timeBuckets.map((bucket, idx) => {
                const style = BUCKET_STYLES[Math.min(idx, BUCKET_STYLES.length - 1)];
                return (
                  <TimeBucket
                    key={bucket.label}
                    bucket={bucket}
                    style={style}
                    onSelectNews={onSelectNews}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          /* Fallback: show top news if no buckets yet */
          newsItems.length > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
              <p className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest font-mono mb-2">
                Latest Developments
              </p>
              <ul className="space-y-2">
                {newsItems.slice(0, 6).map((item) => (
                  <li
                    key={item.id}
                    onClick={() => onSelectNews?.(item)}
                    className={`text-xs text-[var(--text-primary)] leading-relaxed flex gap-2 ${onSelectNews ? "cursor-pointer hover:opacity-80" : ""}`}
                  >
                    <span className="text-[var(--accent-green)] flex-shrink-0 mt-0.5">·</span>
                    {item.headline}
                  </li>
                ))}
              </ul>
            </div>
          )
        )}

        {/* ── Credit Rating Actions ── */}
        {(downgrades.length > 0 || upgrades.length > 0) && (
          <div className="mb-6">
            <h3 className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest font-mono mb-3">
              Credit Rating Actions
            </h3>
            <div className="space-y-2">
              {downgrades.map((text, i) => (
                <RatingRow key={`d${i}`} direction="down" text={text} />
              ))}
              {upgrades.map((text, i) => (
                <RatingRow key={`u${i}`} direction="up" text={text} />
              ))}
            </div>
          </div>
        )}

        {/* ── Risk Signals ── */}
        <SignalList
          title="Risk Signals"
          icon={AlertTriangle}
          color="var(--accent-red)"
          bg="rgba(255,77,106,0.08)"
          items={riskSignals}
          empty="No high-risk live signals in the current source refresh."
        />

        {/* ── Opportunities ── */}
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

function TimeBucket({ bucket, style, onSelectNews }) {
  return (
    <div
      className="rounded-xl border-l-[3px] overflow-hidden"
      style={{ borderLeftColor: style.border, backgroundColor: style.bg, border: `1px solid var(--border-subtle)`, borderLeftWidth: "3px", borderLeftColor: style.border }}
    >
      {/* Bucket header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <span className="text-base leading-none">{bucket.icon}</span>
        <span className="text-[11px] font-black uppercase tracking-widest font-mono" style={{ color: style.labelColor }}>
          {bucket.label}
        </span>
        <span className="ml-auto text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-[var(--bg-card)] text-[var(--text-dim)]">
          {bucket.count} {bucket.count === 1 ? "story" : "stories"}
        </span>
      </div>

      {/* Narrative summary */}
      {bucket.summary && (
        <p className="px-4 pb-3 text-[13px] text-[var(--text-primary)] leading-relaxed">
          {bucket.summary}
        </p>
      )}

      {/* Top items */}
      {bucket.topItems?.length > 0 && (
        <div className="border-t border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
          {bucket.topItems.map((item, i) => (
            <TopItem key={i} item={item} onSelectNews={onSelectNews} />
          ))}
        </div>
      )}
    </div>
  );
}

function TopItem({ item, onSelectNews }) {
  const riskStyle = RISK_COLORS[item.risk] || RISK_COLORS.Low;
  return (
    <div
      className={`flex items-start gap-3 px-4 py-2.5 ${onSelectNews ? "cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors" : ""}`}
      onClick={() => item.id && onSelectNews?.({ ...item })}
    >
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-[var(--text-primary)] leading-snug">{item.headline}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {item.source && (
            <span className="text-[9px] font-bold font-mono text-[var(--text-dim)] uppercase tracking-wider">
              {item.source}
            </span>
          )}
          {item.category && (
            <span className="text-[9px] font-mono text-[var(--text-dim)]">{item.category}</span>
          )}
          {item.risk === "High" && (
            <span
              className="text-[9px] font-black uppercase tracking-wider font-mono px-1.5 py-0.5 rounded"
              style={{ color: riskStyle.color, backgroundColor: riskStyle.bg }}
            >
              High Risk
            </span>
          )}
        </div>
      </div>
      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0 text-[var(--accent-blue)] hover:opacity-80 mt-0.5"
        >
          <ExternalLink size={12} />
        </a>
      )}
    </div>
  );
}

function RatingRow({ direction, text }) {
  const isUp = direction === "up";
  return (
    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[var(--bg-primary)]">
      <span
        className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider font-mono flex-shrink-0 mt-0.5"
        style={{
          color: isUp ? "var(--accent-green)" : "var(--accent-red)",
          backgroundColor: isUp ? "rgba(29,111,214,0.12)" : "rgba(217,74,93,0.12)",
        }}
      >
        {isUp ? "↑ Upgrade" : "↓ Downgrade"}
      </span>
      <span className="text-xs text-[var(--text-primary)] leading-snug">{text}</span>
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
