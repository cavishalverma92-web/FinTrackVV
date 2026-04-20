"use client";

import { useState } from "react";
import { ExternalLink, Flame, Clock, Shield } from "lucide-react";

const TABS = ["All", "RBI", "SEBI", "Schemes", "Policy", "Macro"];

const TAB_KEYWORDS = {
  RBI: ["rbi", "reserve bank", "repo rate", "crr", "slr", "mclr", "monetary policy"],
  SEBI: ["sebi", "securities"],
  Schemes: ["scheme", "credit guarantee", "cgfmu", "ncgtc", "eclgs", "mudra", "pmay",
            "jan dhan", "pmjdy", "financial inclusion", "interest subvention", "sidbi", "nabard",
            "stand up india", "startup india", "svanidhi", "atmanirbhar"],
  Policy: ["circular", "guideline", "notification", "direction", "regulation", "compliance",
           "co-lending", "digital lending", "dlg", "dla", "priority sector", "psl",
           "ministry of finance", "pib", "budget", "nhb"],
  Macro: ["fed rate", "us federal", "imf", "world bank", "basel", "global", "inflation",
          "interest rate", "yield", "us 10y", "forex"],
};

function matchesTab(item, tab) {
  if (tab === "All") return true;
  const text = `${item.headline} ${item.tldr} ${item.source} ${item.tags?.join(" ") || ""}`.toLowerCase();
  return (TAB_KEYWORDS[tab] || []).some((kw) => text.includes(kw));
}

function categoryColor(category) {
  const map = {
    Regulation: "var(--accent-amber)",
    "Credit Rating": "var(--accent-green)",
    "Risk Signal": "var(--accent-red)",
    Policy: "#8B6FBF",
    Fundraise: "var(--accent-blue)",
    Partnership: "var(--accent-blue)",
    "AI & Tech": "var(--accent-blue)",
  };
  return map[category] || "var(--text-dim)";
}

function riskColor(risk) {
  if (risk === "High") return "var(--accent-red)";
  if (risk === "Medium") return "var(--accent-amber)";
  return "var(--text-dim)";
}

function Tag({ label, color }) {
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider font-mono"
      style={{ color, backgroundColor: `${color}18` }}
    >
      {label}
    </span>
  );
}

export default function GovtSchemes({ govtSchemes = [] }) {
  const [activeTab, setActiveTab] = useState("All");

  const filtered = govtSchemes.filter((item) => matchesTab(item, activeTab));

  const rbiCount = govtSchemes.filter((item) => matchesTab(item, "RBI")).length;
  const schemeCount = govtSchemes.filter((item) => matchesTab(item, "Schemes")).length;
  const policyCount = govtSchemes.filter((item) => matchesTab(item, "Policy")).length;

  return (
    <div className="animate-fade-in">
      {/* ── Header ── */}
      <div className="mb-5">
        <h2 className="text-lg font-bold font-display tracking-tight">
          Regulatory & Policy Intelligence
        </h2>
        <p className="text-xs text-[var(--text-dim)] mt-1">
          RBI circulars · SEBI notifications · Govt schemes · Lending incentives · Macro policy
        </p>
      </div>

      {/* ── Stats bar ── */}
      <div className="flex items-center gap-4 mb-5 p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] flex-wrap">
        <StatPill label="Total" value={govtSchemes.length} color="var(--text-primary)" />
        <div className="w-px h-5 bg-[var(--border-subtle)]" />
        <StatPill label="RBI" value={rbiCount} color="var(--accent-amber)" />
        <div className="w-px h-5 bg-[var(--border-subtle)]" />
        <StatPill label="Schemes" value={schemeCount} color="var(--accent-green)" />
        <div className="w-px h-5 bg-[var(--border-subtle)]" />
        <StatPill label="Policy" value={policyCount} color="#8B6FBF" />
      </div>

      {/* ── Pinned reference ── */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { label: "RBI Circulars", url: "https://www.rbi.org.in/Scripts/BS_CircularIndexDisplay.aspx", color: "var(--accent-amber)" },
          { label: "RBI Press Releases", url: "https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx", color: "var(--accent-amber)" },
          { label: "NCGTC / CGFMU", url: "https://www.ncgtc.in/", color: "var(--accent-green)" },
          { label: "SEBI Orders", url: "https://www.sebi.gov.in/enforcement/orders/", color: "var(--accent-blue)" },
          { label: "PIB Finance", url: "https://pib.gov.in/", color: "#8B6FBF" },
        ].map((link) => (
          <a
            key={link.label}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all hover:opacity-80"
            style={{ color: link.color, borderColor: `${link.color}40`, backgroundColor: `${link.color}10` }}
          >
            <Shield size={9} />
            {link.label}
            <ExternalLink size={8} />
          </a>
        ))}
      </div>

      {/* ── Category Tabs ── */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-all border
              ${activeTab === tab
                ? "bg-[var(--accent-green)] text-white border-[var(--accent-green)]"
                : "bg-transparent text-[var(--text-dim)] border-[var(--border-subtle)] hover:border-[var(--border-hover)] hover:text-[var(--text-secondary)]"
              }`}
          >
            {tab}
            {tab !== "All" && (
              <span className="ml-1 opacity-60">
                ({govtSchemes.filter((item) => matchesTab(item, tab)).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── News Feed ── */}
      <div className="flex flex-col gap-2">
        {filtered.map((item, index) => (
          <article
            key={item.id || index}
            className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] card-shadow card-hover animate-fade-in"
            style={{ borderLeftWidth: "3px", borderLeftColor: categoryColor(item.category) }}
          >
            {/* Row 1 — meta */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Tag label={item.source} color="var(--accent-blue)" />
              <Tag label={item.category} color={categoryColor(item.category)} />
              {item.trending && <Flame size={12} className="text-[var(--accent-amber)]" />}
              {item.risk === "High" && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-[rgba(217,74,93,0.12)] text-[var(--accent-red)] font-mono uppercase">
                  High Risk
                </span>
              )}
              <div className="ml-auto flex items-center gap-1 text-[10px] text-[var(--text-dim)] font-mono">
                <Clock size={10} />
                {item.time}
              </div>
            </div>

            {/* Row 2 — headline */}
            <h3 className="text-[13px] font-semibold text-[var(--text-primary)] leading-snug mb-2">
              {item.headline}
            </h3>

            {/* Row 3 — tldr */}
            {item.tldr && (
              <p className="text-[11px] text-[var(--text-dim)] leading-relaxed line-clamp-2 mb-2">
                {item.tldr}
              </p>
            )}

            {/* Row 4 — tags + link */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex gap-1.5 flex-wrap">
                {(item.tags || []).slice(0, 3).map((tag) => (
                  <span key={tag} className="text-[9px] font-mono text-[var(--text-dim)] px-1.5 py-0.5 rounded bg-[var(--bg-primary)]">
                    {tag}
                  </span>
                ))}
              </div>
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent-blue)] hover:underline flex-shrink-0"
                >
                  Read <ExternalLink size={10} />
                </a>
              )}
            </div>
          </article>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-[var(--text-dim)]">
            <p className="text-3xl mb-3 opacity-20">⌀</p>
            <p className="text-sm font-semibold">No {activeTab} items in current feed</p>
            <p className="text-xs mt-1 opacity-70">Try switching to All or refresh the feed</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-base font-black font-display" style={{ color }}>{value}</span>
      <span className="text-[9px] font-bold text-[var(--text-dim)] uppercase tracking-wider font-mono">{label}</span>
    </div>
  );
}
