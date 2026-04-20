// ============================================================
// SIDEBAR — Left navigation menu
// Shows all the dashboard tabs. Highlights the active one.
// ============================================================

"use client";

import {
  Newspaper, FileText, TrendingUp, BarChart3,
  Handshake, Landmark, Globe, RefreshCw,
} from "lucide-react";
import { NAV_TABS } from "../../data/appConfig";

// Map icon names to actual icon components
const ICONS = {
  Newspaper: Newspaper,
  FileText: FileText,
  TrendingUp: TrendingUp,
  BarChart3: BarChart3,
  Handshake: Handshake,
  Landmark: Landmark,
  Globe: Globe,
  RefreshCw: RefreshCw,
};

export default function Sidebar({ activeTab, onTabChange, open = false, onClose, tabCounts = {} }) {
  return (
    <>
      {/* Mobile overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={onClose}
        />
      )}
    <aside className={`
      w-56 border-r border-[var(--border-subtle)] bg-[var(--bg-card)] flex flex-col py-4
      md:relative md:flex md:translate-x-0
      fixed inset-y-0 left-0 z-30 transition-transform duration-200
      ${open ? "flex translate-x-0" : "-translate-x-full md:translate-x-0"}
    `}>
      {/* Navigation label */}
      <div className="px-4 mb-3">
        <p className="text-[10px] font-semibold text-[var(--text-dim)] uppercase tracking-widest font-mono">
          Modules
        </p>
      </div>

      {/* Tab buttons */}
      <nav className="flex flex-col gap-1 px-2">
        {NAV_TABS.map((tab) => {
          const Icon = ICONS[tab.icon];
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => { onTabChange(tab.id); onClose?.(); }}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg
                text-sm font-medium cursor-pointer transition-all text-left
                ${isActive
                  ? "bg-[rgba(29,111,214,0.1)] text-[var(--accent-green)]"
                  : "text-[var(--text-dim)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-secondary)]"
                }
              `}
            >
              {Icon && <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />}
              <span>{tab.label}</span>
              {tabCounts[tab.id] > 0 && (
                <span className={`ml-auto text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-[var(--bg-primary)] text-[var(--text-dim)]"}`}>
                  {tabCounts[tab.id]}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom section: data source info */}
      <div className="mt-auto px-4 pt-4 border-t border-[var(--border-subtle)]">
        <p className="text-[10px] text-[var(--text-dim)] font-mono leading-relaxed">
          Sources: RBI · SEBI · CRISIL · ICRA · CARE · Bloomberg · Reuters · NSE · BSE
        </p>
        <p className="text-[10px] text-[var(--text-dim)] font-mono mt-2">
          Last refresh: {new Date().toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })} IST
        </p>
      </div>
    </aside>
    </>
  );
}
