// ============================================================
// CO-LENDING TRACKER — Bank-NBFC partnerships
//
// Shows active co-lending tie-ups with deal details,
// volumes, status, and geography.
// ============================================================

"use client";

import { ArrowRight, MapPin, ExternalLink } from "lucide-react";

// Status color helper
function statusStyle(status) {
  const styles = {
    Active: { color: "var(--accent-green)", bg: "rgba(29,111,214,0.12)" },
    Scaling: { color: "var(--accent-blue)", bg: "rgba(77,163,255,0.12)" },
    New: { color: "var(--accent-amber)", bg: "rgba(255,181,71,0.12)" },
    Paused: { color: "var(--accent-red)", bg: "rgba(255,77,106,0.12)" },
  };
  return styles[status] || styles.Active;
}

export default function CoLendingTracker({ coLendingData = [] }) {
  // Calculate total volume (rough extraction from strings)
  const totalDeals = coLendingData.length;
  const activeDeals = coLendingData.filter((d) => d.status === "Active").length;
  const sourceLinkFor = (deal) => deal.url || deal.sourceUrl || (
    deal.bank && deal.nbfc
      ? `https://news.google.com/search?q=${encodeURIComponent(`${deal.bank} ${deal.nbfc} co-lending India`)}`
      : null
  );

  return (
    <div className="animate-fade-in">
      {/* ── Header ── */}
      <div className="mb-5">
        <h2 className="text-lg font-bold font-display tracking-tight">
          Co-Lending & Partnership Tracker
        </h2>
        <p className="text-xs text-[var(--text-dim)] mt-1">
          Bank–NBFC tie-ups, embedded finance deals, and PSL partnerships
        </p>
      </div>

      {/* ── Summary Cards ── */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
          <p className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest font-mono mb-1">
            Total Deals
          </p>
          <p className="text-2xl font-bold text-[var(--text-primary)] font-display">
            {totalDeals}
          </p>
        </div>
        <div className="flex-1 p-4 rounded-xl bg-[rgba(29,111,214,0.08)] border border-[rgba(29,111,214,0.15)]">
          <p className="text-[10px] font-bold text-[var(--accent-green)] uppercase tracking-widest font-mono mb-1">
            Active
          </p>
          <p className="text-2xl font-bold text-[var(--accent-green)] font-display">
            {activeDeals}
          </p>
        </div>
        <div className="flex-1 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
          <p className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest font-mono mb-1">
            Top Segment
          </p>
          <p className="text-lg font-bold text-[var(--text-primary)] font-display">
            MSME
          </p>
        </div>
      </div>

      {/* ── Deals List ── */}
      <div className="flex flex-col gap-3">
        {coLendingData.map((deal, index) => {
          const sStyle = statusStyle(deal.status);
          const sourceLink = sourceLinkFor(deal);

          return (
            <div
              key={index}
              className={`
                p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]
                card-hover animate-fade-in stagger-${index + 1}
              `}
            >
              {/* Top row: Bank → NBFC */}
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className="text-sm font-bold text-[var(--text-primary)]">
                  {deal.bank}
                </span>
                <ArrowRight size={14} className="text-[var(--accent-green)]" />
                <span className="text-sm font-bold text-[var(--accent-green)]">
                  {deal.nbfc}
                </span>
                <span
                  className="ml-auto px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider font-mono"
                  style={{ color: sStyle.color, backgroundColor: sStyle.bg }}
                >
                  {deal.status}
                </span>
              </div>

              {/* tldr */}
              {deal.tldr && deal.tldr !== deal.headline && (
                <p className="text-[11px] text-[var(--text-dim)] leading-relaxed mb-3 line-clamp-2">
                  {deal.tldr}
                </p>
              )}

              {/* Details row */}
              <div className="flex items-center gap-6 flex-wrap text-[11px] text-[var(--text-dim)]">
                <div>
                  <span className="text-[var(--text-dim)]">Segment: </span>
                  <span className="text-[var(--text-secondary)] font-medium">{deal.segment}</span>
                </div>
                <div>
                  <span className="text-[var(--text-dim)]">Volume: </span>
                  <span className="text-[var(--accent-green)] font-bold font-mono">{deal.volume}</span>
                </div>
                <div>
                  <span className="text-[var(--text-dim)]">Since: </span>
                  <span className="text-[var(--text-secondary)]">{deal.startDate}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin size={10} />
                  <span className="text-[var(--text-secondary)]">{deal.geography}</span>
                </div>
                {sourceLink && (
                  <a
                    href={sourceLink}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent-blue)] hover:underline"
                  >
                    {deal.url || deal.sourceUrl ? "Source" : "Search source"} <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
