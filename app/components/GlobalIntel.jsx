// ============================================================
// GLOBAL INTEL — International leading indicators
//
// Shows US Fed rate, UK base rate, global fintech funding,
// and other leading indicators that affect Indian NBFCs.
// ============================================================

"use client";

import { useState } from "react";

// Signal color mapping
function signalStyle(signal) {
  const styles = {
    "Dovish": { color: "var(--accent-green)", bg: "rgba(29,111,214,0.12)" },
    "Recovery": { color: "var(--accent-green)", bg: "rgba(29,111,214,0.12)" },
    "Positive": { color: "var(--accent-green)", bg: "rgba(29,111,214,0.12)" },
    "Neutral": { color: "var(--text-secondary)", bg: "rgba(148,163,184,0.12)" },
    "Caution": { color: "var(--accent-amber)", bg: "rgba(255,181,71,0.12)" },
    "Hawkish": { color: "var(--accent-red)", bg: "rgba(255,77,106,0.12)" },
  };
  return styles[signal] || styles.Neutral;
}

export default function GlobalIntel({ globalData = [] }) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  return (
    <div className="animate-fade-in">
      {/* ── Header ── */}
      <div className="mb-5">
        <h2 className="text-lg font-bold font-display tracking-tight">
          Global Intelligence
        </h2>
        <p className="text-xs text-[var(--text-dim)] mt-1">
          Leading indicators from US, UK & global fintech — signals that affect Indian lending
        </p>
      </div>

      {/* ── Indicator Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {globalData.map((item, index) => {
          const sStyle = signalStyle(item.signal);
          const isExpanded = expandedIndex === index;

          return (
            <div
              key={index}
              onClick={() => setExpandedIndex(isExpanded ? null : index)}
              className={`
                p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]
                cursor-pointer card-hover animate-fade-in stagger-${index + 1}
              `}
            >
              {/* Indicator name */}
              <p className="text-[10px] font-semibold text-[var(--text-dim)] uppercase tracking-widest font-mono mb-3">
                {item.indicator}
              </p>

              {/* Value */}
              <p className="text-2xl font-bold text-[var(--text-primary)] font-display tracking-tight mb-2">
                {item.value}
              </p>

              {/* Trend + Signal */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-secondary)]">
                  {item.trend}
                </span>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono"
                  style={{ color: sStyle.color, backgroundColor: sStyle.bg }}
                >
                  {item.signal}
                </span>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] animate-slide-down">
                  <p className="text-[10px] font-bold text-[var(--accent-blue)] uppercase tracking-widest font-mono mb-2">
                    Analysis
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
