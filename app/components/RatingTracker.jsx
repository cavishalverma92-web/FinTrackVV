// ============================================================
// RATING TRACKER — Credit rating changes
//
// Monitors CRISIL, ICRA, CARE, India Ratings.
// Shows upgrade/downgrade direction, outlook changes,
// and the rationale behind each rating action.
// ============================================================

"use client";

import { useState } from "react";
import { ArrowUpCircle, ArrowDownCircle, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

export default function RatingTracker({ ratingChanges = [] }) {
  // Track which rating item is expanded to show rationale
  const [expandedIndex, setExpandedIndex] = useState(null);
  const sourceLinkFor = (rating) => rating.url || rating.sourceUrl || (
    rating.entity
      ? `https://news.google.com/search?q=${encodeURIComponent(`${rating.entity} ${rating.agency || ""} credit rating India`)}`
      : null
  );

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  // Count upgrades and downgrades
  const upgradeCount = ratingChanges.filter((r) => r.direction === "up").length;
  const downgradeCount = ratingChanges.filter((r) => r.direction === "down").length;

  return (
    <div className="animate-fade-in">
      {/* ── Header ── */}
      <div className="mb-5">
        <h2 className="text-lg font-bold font-display tracking-tight">
          Credit Rating Tracker
        </h2>
        <p className="text-xs text-[var(--text-dim)] mt-1">
          Monitoring CRISIL · ICRA · CARE · India Ratings
        </p>
      </div>

      {/* ── Summary Cards ── */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 p-4 rounded-xl bg-[rgba(29,111,214,0.08)] border border-[rgba(29,111,214,0.15)]">
          <p className="text-[10px] font-bold text-[var(--accent-green)] uppercase tracking-widest font-mono mb-1">
            Upgrades
          </p>
          <p className="text-2xl font-bold text-[var(--accent-green)] font-display">
            {upgradeCount}
          </p>
          <p className="text-[10px] text-[var(--text-dim)] mt-1">Last 7 days</p>
        </div>
        <div className="flex-1 p-4 rounded-xl bg-[rgba(255,77,106,0.08)] border border-[rgba(255,77,106,0.15)]">
          <p className="text-[10px] font-bold text-[var(--accent-red)] uppercase tracking-widest font-mono mb-1">
            Downgrades
          </p>
          <p className="text-2xl font-bold text-[var(--accent-red)] font-display">
            {downgradeCount}
          </p>
          <p className="text-[10px] text-[var(--text-dim)] mt-1">Last 7 days</p>
        </div>
        <div className="flex-1 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
          <p className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest font-mono mb-1">
            Total Tracked
          </p>
          <p className="text-2xl font-bold text-[var(--text-primary)] font-display">
            {ratingChanges.length}
          </p>
          <p className="text-[10px] text-[var(--text-dim)] mt-1">Entities monitored</p>
        </div>
      </div>

      {/* ── Rating Changes List ── */}
      <div className="flex flex-col gap-2">
        {ratingChanges.map((rating, index) => {
          const sourceLink = sourceLinkFor(rating);
          return (
          <div
            key={index}
            className={`
              rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]
              overflow-hidden transition-all animate-fade-in stagger-${index + 1}
            `}
          >
            {/* Main row */}
            <div
              className="flex items-center gap-4 p-4 cursor-pointer card-hover flex-wrap"
              onClick={() => toggleExpand(index)}
            >
              {/* Direction icon */}
              <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                ${rating.direction === "up"
                  ? "bg-[rgba(29,111,214,0.12)]"
                  : "bg-[rgba(255,77,106,0.12)]"
                }
              `}>
                {rating.direction === "up"
                  ? <ArrowUpCircle size={20} className="text-[var(--accent-green)]" />
                  : <ArrowDownCircle size={20} className="text-[var(--accent-red)]" />
                }
              </div>

              {/* Entity name & agency */}
              <div className="flex-1 min-w-[160px]">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {rating.entity}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-[var(--text-dim)] flex-wrap">
                  <span>{rating.agency} · {rating.date}</span>
                  {sourceLink && (
                    <a
                      href={sourceLink}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                      className="inline-flex items-center gap-1 font-semibold text-[var(--accent-blue)] hover:underline"
                    >
                      {rating.url || rating.sourceUrl ? "Source" : "Search source"} <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>

              {/* Rating change */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[var(--text-dim)] font-mono">
                  {rating.from}
                </span>
                <span className={`text-base ${rating.direction === "up" ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]"}`}>
                  →
                </span>
                <span className={`text-sm font-bold font-mono ${rating.direction === "up" ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]"}`}>
                  {rating.to}
                </span>
              </div>

              {/* Outlook */}
              <span
                className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider font-mono"
                style={{
                  color: rating.direction === "up" ? "var(--accent-green)"
                    : rating.outlook.includes("Watch") || rating.outlook.includes("Negative")
                    ? "var(--accent-red)" : "var(--accent-amber)",
                  backgroundColor: rating.direction === "up" ? "rgba(29,111,214,0.12)"
                    : rating.outlook.includes("Watch") || rating.outlook.includes("Negative")
                    ? "rgba(255,77,106,0.12)" : "rgba(255,181,71,0.12)",
                }}
              >
                {rating.outlook}
              </span>

              {/* Expand icon */}
              {expandedIndex === index
                ? <ChevronUp size={16} className="text-[var(--text-dim)]" />
                : <ChevronDown size={16} className="text-[var(--text-dim)]" />
              }
            </div>

            {/* Expanded rationale */}
            {expandedIndex === index && (
              <div className="px-4 pb-4 animate-slide-down">
                <div className="p-3 bg-[var(--bg-primary)] rounded-lg border-l-[3px] border-[var(--accent-blue)]">
                  <p className="text-[10px] font-bold text-[var(--accent-blue)] uppercase tracking-widest font-mono mb-2">
                    Rationale
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {rating.rationale}
                  </p>
                </div>
              </div>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
}
