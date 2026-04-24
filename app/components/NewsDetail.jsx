// ============================================================
// NEWS DETAIL — Intelligence Brief Panel
//
// When a user clicks a news item, this panel shows:
// - TL;DR summary
// - Why This Matters analysis
// - Impact on NBFCs, Digital Lenders, Investors
// - Tags
//
// If no news is selected, it shows a placeholder message.
// ============================================================

"use client";

import { ExternalLink } from "lucide-react";

// ── Impact level badge ──
function ImpactBadge({ level }) {
  const styles = {
    Critical: { color: "var(--accent-red)", bg: "rgba(255,77,106,0.12)" },
    High: { color: "var(--accent-amber)", bg: "rgba(255,181,71,0.12)" },
    Medium: { color: "var(--accent-blue)", bg: "rgba(77,163,255,0.12)" },
    Low: { color: "var(--accent-green)", bg: "rgba(29,111,214,0.12)" },
  };
  const s = styles[level] || styles.Medium;

  return (
    <span
      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono"
      style={{ color: s.color, backgroundColor: s.bg }}
    >
      {level}
    </span>
  );
}

export default function NewsDetail({ news }) {
  // ── Empty state: no news selected ──
  if (!news) {
    return (
      <div className="h-full flex items-start pt-20">
        <div className="w-full text-center p-8 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
          <p className="text-3xl mb-3 opacity-20">◎</p>
          <p className="text-sm text-[var(--text-dim)]">
            Select a news item to view the intelligence brief
          </p>
        </div>
      </div>
    );
  }

  // ── Detail view ──
  return (
    <div className="sticky top-6 animate-slide-left">
      <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
        {/* Section label */}
        <p className="text-[11px] text-[var(--accent-green)] font-bold uppercase tracking-widest font-mono mb-4">
          Intelligence Brief
        </p>

        {/* Headline */}
        <h2 className="text-[15px] font-bold text-[var(--text-primary)] leading-snug mb-5">
          {news.headline}
        </h2>

        {news.sourceType === "exchange_filing" && (
          <div className="flex flex-wrap gap-2 mb-5">
            {news.exchange && (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold text-[var(--text-secondary)] bg-[var(--bg-primary)] font-mono">
                {news.exchange}
              </span>
            )}
            {news.company && (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold text-[var(--text-secondary)] bg-[var(--bg-primary)] font-mono">
                {news.company}
              </span>
            )}
            {news.filingCategory && (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold text-[var(--text-secondary)] bg-[var(--bg-primary)] font-mono">
                {news.filingCategory}
              </span>
            )}
          </div>
        )}

        {news.url && (
          <a
            href={news.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 mb-5 px-3 py-2 rounded-md bg-[var(--accent-blue)] text-white text-[11px] font-bold"
          >
            Read complete news
            <ExternalLink size={12} />
          </a>
        )}

        {/* ── TL;DR Section ── */}
        <div className="mb-5">
          <p className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest mb-2">
            TL;DR
          </p>
          <div className="text-xs text-[var(--text-secondary)] leading-relaxed p-3 bg-[var(--bg-primary)] rounded-lg border-l-[3px] border-[var(--accent-green)]">
            {news.tldr}
          </div>
        </div>

        {/* ── Why This Matters ── */}
        <div className="mb-5">
          <p className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest mb-2">
            Why This Matters
          </p>
          <p className="text-xs text-[var(--text-primary)] leading-relaxed">
            {news.whyMatters}
          </p>
        </div>

        {/* ── Impact Assessment ── */}
        <div className="mb-5">
          <p className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest mb-3">
            Impact Assessment
          </p>
          <div className="flex flex-col gap-2">
            {/* NBFC Impact */}
            <div className="flex items-center justify-between p-2.5 bg-[var(--bg-primary)] rounded-lg">
              <span className="text-[11px] text-[var(--text-secondary)]">NBFCs</span>
              <ImpactBadge level={news.impactNBFC} />
            </div>
            {/* Digital Lenders Impact */}
            <div className="flex items-center justify-between p-2.5 bg-[var(--bg-primary)] rounded-lg">
              <span className="text-[11px] text-[var(--text-secondary)]">Digital Lenders</span>
              <ImpactBadge level={news.impactDigital} />
            </div>
            {/* Investors Impact */}
            <div className="flex items-center justify-between p-2.5 bg-[var(--bg-primary)] rounded-lg">
              <span className="text-[11px] text-[var(--text-secondary)]">Investors</span>
              <ImpactBadge level={news.impactInvestor} />
            </div>
          </div>
        </div>

        {/* ── Risk Level ── */}
        <div className="mb-5">
          <p className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest mb-2">
            Risk Level
          </p>
          <ImpactBadge level={news.risk === "High" ? "Critical" : news.risk === "Medium" ? "Medium" : "Low"} />
        </div>

        {/* ── Tags ── */}
        <div>
          <p className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest mb-2">
            Tags
          </p>
          <div className="flex flex-wrap gap-1.5">
            {news.tags.map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded text-[10px] font-semibold text-[var(--text-secondary)] bg-[var(--bg-primary)] font-mono"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
