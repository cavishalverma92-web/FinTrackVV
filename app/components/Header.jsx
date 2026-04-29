"use client";

import { Bell, Search, Moon, Sun, Menu, X } from "lucide-react";

export default function Header({
  showAlerts,
  alertCount = 0,
  searchQuery = "",
  onSearchChange,
  onToggleAlerts,
  darkMode = false,
  onToggleDark,
  sidebarOpen = false,
  onToggleSidebar,
}) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-6 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-card)]/95 backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-1.5 rounded-md text-[var(--text-dim)] hover:bg-[var(--bg-primary)] cursor-pointer"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="w-9 h-9 rounded-sm bg-[var(--accent-burgundy)] border border-[rgba(36,31,26,0.2)] flex items-center justify-center text-xl font-bold text-white font-display">
          F
        </div>
        <div>
          <h1 className="text-[19px] leading-5 font-bold tracking-tight font-display text-[var(--text-primary)]">
            FinServTracker
          </h1>
          <p className="text-[9px] text-[var(--text-dim)] font-mono uppercase tracking-widest">
            Financial Service Intelligence by Vishal Verma
          </p>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-md px-3 py-2 w-96">
        <Search size={14} className="text-[var(--text-dim)]" />
        <input
          type="text"
          placeholder="Search news, companies, ratings..."
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-dim)] outline-none w-full"
        />
        <kbd className="text-[10px] text-[var(--text-dim)] font-mono bg-[var(--bg-card)] px-1.5 py-0.5 rounded-sm border border-[var(--border-subtle)]">
          /
        </kbd>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[rgba(18,107,79,0.08)] border border-[rgba(18,107,79,0.18)] rounded-sm">
          <div className="w-2 h-2 rounded-full bg-[var(--accent-green)] pulse-live" />
          <span className="text-[11px] font-semibold text-[var(--accent-green)] font-mono">LIVE</span>
        </div>

        <button
          onClick={onToggleDark}
          className="p-2 rounded-md border border-[var(--border-subtle)] text-[var(--text-dim)] hover:border-[var(--border-hover)] hover:text-[var(--text-secondary)] cursor-pointer transition-all"
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <button
          onClick={onToggleAlerts}
          className={`
            relative flex items-center gap-2 px-3 py-2 rounded-md border
            text-xs font-semibold font-mono cursor-pointer transition-all
            ${showAlerts
              ? "bg-[rgba(143,29,44,0.1)] border-[var(--accent-burgundy)] text-[var(--accent-burgundy)]"
              : "bg-transparent border-[var(--border-subtle)] text-[var(--text-dim)] hover:border-[var(--border-hover)]"
            }
          `}
        >
          <Bell size={14} />
          <span>{alertCount}</span>
          {alertCount > 0 && (
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[var(--accent-red)] border-2 border-[var(--bg-card)]" />
          )}
        </button>
      </div>
    </header>
  );
}
