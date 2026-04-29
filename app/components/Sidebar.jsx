"use client";

import Link from "next/link";
import {
  Newspaper, FileText, TrendingUp, BarChart3,
  Handshake, Landmark, Globe, RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { NAV_TABS } from "../../data/appConfig";

const ICONS = {
  Newspaper,
  FileText,
  TrendingUp,
  BarChart3,
  Handshake,
  Landmark,
  Globe,
  RefreshCw,
};

export default function Sidebar({ activeTab, onTabChange, open = false, onClose, tabCounts = {} }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={onClose}
        />
      )}
      <aside className={`
        w-60 border-r border-[var(--border-subtle)] bg-[rgba(255,253,248,0.72)] flex flex-col py-5
        md:relative md:flex md:translate-x-0
        fixed inset-y-0 left-0 z-30 transition-transform duration-200
        ${open ? "flex translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="px-4 mb-3">
          <p className="text-[10px] font-semibold text-[var(--text-dim)] uppercase tracking-widest font-mono">
            Desk
          </p>
        </div>

        <nav className="flex flex-col gap-1 px-2">
          {NAV_TABS.map((tab) => {
            const Icon = ICONS[tab.icon];
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => { onTabChange(tab.id); onClose?.(); }}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-md border border-transparent
                  text-sm font-medium cursor-pointer transition-all text-left
                  ${isActive
                    ? "bg-[var(--paper-highlight)] text-[var(--accent-burgundy)] border-[var(--border-subtle)]"
                    : "text-[var(--text-dim)] hover:bg-[var(--bg-card)] hover:text-[var(--text-secondary)] hover:border-[var(--border-subtle)]"
                  }
                `}
              >
                {Icon && <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />}
                <span>{tab.label}</span>
                {tabCounts[tab.id] > 0 && (
                  <span className={`ml-auto text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-sm ${isActive ? "bg-[var(--accent-burgundy)] text-white" : "bg-[var(--bg-primary)] text-[var(--text-dim)]"}`}>
                    {tabCounts[tab.id]}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-2 pt-4">
          <p className="px-3 mb-2 text-[10px] font-semibold text-[var(--text-dim)] uppercase tracking-widest font-mono">
            Command Center
          </p>
          <Link
            href="/kissht-ipo"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md border border-[var(--border-subtle)] bg-[var(--paper-highlight)] text-sm font-medium text-[var(--accent-burgundy)] hover:bg-[var(--bg-card)]"
          >
            <ShieldAlert size={16} />
            <span>Kissht IPO</span>
          </Link>
        </div>

        <div className="mt-auto px-4 pt-4 border-t border-[var(--border-subtle)]">
          <p className="text-[10px] text-[var(--text-dim)] font-mono leading-relaxed">
            Sources: RBI, SEBI, CRISIL, ICRA, CARE, Bloomberg, Reuters, NSE, BSE
          </p>
          <p className="text-[10px] text-[var(--text-dim)] font-mono mt-2">
            Last refresh: {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} IST
          </p>
        </div>
      </aside>
    </>
  );
}
