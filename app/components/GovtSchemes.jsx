// ============================================================
// GOVT SCHEMES — CGFMU & Credit Guarantee Tracker
//
// Tracks government schemes that impact NBFC lending:
// - CGFMU (Credit Guarantee Fund for Micro Units)
// - ECLGS (Emergency Credit Line)
// - PSL Co-Lending Framework
//
// Shows coverage, guarantee %, impact on credit cost.
// ============================================================

"use client";

import { Shield, TrendingDown, Building2, CheckCircle2 } from "lucide-react";

// Status styling
function statusStyle(status) {
  const map = {
    "Extended": { color: "var(--accent-green)", bg: "rgba(29,111,214,0.12)", icon: CheckCircle2 },
    "Core Scheme": { color: "var(--accent-green)", bg: "rgba(29,111,214,0.12)", icon: Shield },
    "Regulatory Watch": { color: "var(--accent-blue)", bg: "rgba(94,167,239,0.14)", icon: Building2 },
    "Regulatory Update": { color: "var(--accent-blue)", bg: "rgba(94,167,239,0.14)", icon: Building2 },
    "New Update": { color: "var(--accent-amber)", bg: "rgba(255,181,71,0.12)", icon: CheckCircle2 },
    "Active & Growing": { color: "var(--accent-green)", bg: "rgba(29,111,214,0.12)", icon: TrendingDown },
    "Winding Down": { color: "var(--accent-amber)", bg: "rgba(255,181,71,0.12)", icon: Building2 },
  };
  return map[status] || map["Extended"];
}

export default function GovtSchemes({ govtSchemes = [] }) {
  const topInsight = govtSchemes[0]?.summary || govtSchemes[0]?.scheme || "Live policy feeds are refreshing. Scheme signals will populate as source data arrives.";

  return (
    <div className="animate-fade-in">
      {/* ── Header ── */}
      <div className="mb-5">
        <h2 className="text-lg font-bold font-display tracking-tight">
          Government Schemes & Regulatory Updates
        </h2>
        <p className="text-xs text-[var(--text-dim)] mt-1">
          CGFMU, credit guarantees, PSL, co-lending and RBI/SEBI updates impacting financial services
        </p>
      </div>

      {/* ── Key Insight Box ── */}
      <div className="p-4 rounded-xl bg-[rgba(29,111,214,0.08)] border border-[rgba(29,111,214,0.15)] mb-6 border-l-[3px] border-l-[var(--accent-green)]">
        <div className="flex items-center gap-2 mb-2">
          <Shield size={14} className="text-[var(--accent-green)]" />
          <p className="text-[10px] font-bold text-[var(--accent-green)] uppercase tracking-widest font-mono">
            Key Insight
          </p>
        </div>
        <p className="text-xs text-[var(--text-primary)] leading-relaxed">
          {topInsight}
        </p>
      </div>

      {/* ── Scheme Cards ── */}
      <div className="flex flex-col gap-4">
        {govtSchemes.map((scheme, index) => {
          const sStyle = statusStyle(scheme.status);
          const StatusIcon = sStyle.icon;

          return (
            <div
              key={index}
              className={`
                rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]
                overflow-hidden animate-fade-in stagger-${index + 1}
              `}
            >
              {/* Scheme Header */}
              <div className="p-5 border-b border-[var(--border-subtle)]">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">
                      {scheme.url ? (
                        <a href={scheme.url} target="_blank" rel="noreferrer" className="text-[var(--accent-green)] hover:underline">
                          {scheme.scheme}
                        </a>
                      ) : scheme.scheme}
                    </h3>
                    <p className="text-[11px] text-[var(--text-dim)]">
                      Source: {scheme.source || "Configured sources"} · {scheme.validTill}
                    </p>
                  </div>
                  <span
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider font-mono flex-shrink-0"
                    style={{ color: sStyle.color, backgroundColor: sStyle.bg }}
                  >
                    <StatusIcon size={12} />
                    {scheme.status}
                  </span>
                </div>
              </div>

              {/* Scheme Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--border-subtle)]">
                {/* Coverage Limit */}
                <div className="p-4 bg-[var(--bg-card)]">
                  <p className="text-[10px] font-semibold text-[var(--text-dim)] uppercase tracking-widest font-mono mb-1">
                    Coverage
                  </p>
                  <p className="text-lg font-bold text-[var(--accent-green)] font-display">
                    {scheme.coverage}
                  </p>
                </div>

                {/* Guarantee % */}
                <div className="p-4 bg-[var(--bg-card)]">
                  <p className="text-[10px] font-semibold text-[var(--text-dim)] uppercase tracking-widest font-mono mb-1">
                    Guarantee
                  </p>
                  <p className="text-lg font-bold text-[var(--text-primary)] font-display">
                    {scheme.guarantee}
                  </p>
                </div>

                {/* Total Approvals */}
                <div className="p-4 bg-[var(--bg-card)]">
                  <p className="text-[10px] font-semibold text-[var(--text-dim)] uppercase tracking-widest font-mono mb-1">
                    Total Approvals
                  </p>
                  <p className="text-lg font-bold text-[var(--text-primary)] font-display">
                    {scheme.totalApprovals}
                  </p>
                </div>

                {/* Credit Cost Impact */}
                <div className="p-4 bg-[var(--bg-card)]">
                  <p className="text-[10px] font-semibold text-[var(--text-dim)] uppercase tracking-widest font-mono mb-1">
                    Credit Cost Impact
                  </p>
                  <p className="text-lg font-bold text-[var(--accent-green)] font-display">
                    {scheme.impactOnCreditCost}
                  </p>
                </div>
              </div>

              {/* Eligible Entities */}
              <div className="px-5 py-3 border-t border-[var(--border-subtle)]">
                <span className="text-[10px] text-[var(--text-dim)]">Eligible: </span>
                <span className="text-[11px] text-[var(--text-secondary)] font-medium">
                  {scheme.eligibleEntities}
                </span>
                {scheme.summary && (
                  <p className="text-[11px] text-[var(--text-dim)] mt-2 leading-relaxed">
                    {scheme.summary}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Data Source Note ── */}
      <p className="text-[10px] text-[var(--text-dim)] mt-5 font-mono">
        Sources: RBI, Ministry of Finance, SEBI, ET BFSI and other configured live feeds
      </p>
    </div>
  );
}
