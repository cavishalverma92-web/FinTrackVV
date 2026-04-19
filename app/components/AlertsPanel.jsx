// ============================================================
// ALERTS PANEL — Active alerts dropdown
//
// Shows when the bell icon is clicked in the header.
// Displays critical alerts, warnings, and info items.
// ============================================================

"use client";

import { X, AlertCircle, AlertTriangle, Info, CheckCircle } from "lucide-react";

// Map alert types to styles and icons
const ALERT_CONFIG = {
  critical: {
    icon: AlertCircle,
    color: "var(--accent-red)",
    bg: "rgba(255,77,106,0.1)",
    borderColor: "var(--accent-red)",
    label: "CRITICAL",
  },
  warning: {
    icon: AlertTriangle,
    color: "var(--accent-amber)",
    bg: "rgba(255,181,71,0.1)",
    borderColor: "var(--accent-amber)",
    label: "WARNING",
  },
  info: {
    icon: Info,
    color: "var(--accent-blue)",
    bg: "rgba(77,163,255,0.1)",
    borderColor: "var(--accent-blue)",
    label: "INFO",
  },
  success: {
    icon: CheckCircle,
    color: "var(--accent-green)",
    bg: "rgba(29,111,214,0.1)",
    borderColor: "var(--accent-green)",
    label: "POSITIVE",
  },
};

export default function AlertsPanel({ alerts = [], onClose }) {
  return (
    <div className="px-6 py-4 bg-[var(--bg-card)] border-b border-[var(--border-subtle)] animate-slide-down">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold text-[var(--accent-amber)] uppercase tracking-widest font-mono">
          Active Alerts
        </p>
        <button
          onClick={onClose}
          className="text-[var(--text-dim)] hover:text-[var(--text-primary)] cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Alert items */}
      <div className="flex flex-col gap-2">
        {alerts.map((alert, index) => {
          const config = ALERT_CONFIG[alert.type];
          const Icon = config.icon;

          return (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg"
              style={{
                backgroundColor: config.bg,
                borderLeft: `3px solid ${config.borderColor}`,
              }}
            >
              <Icon
                size={16}
                className="flex-shrink-0 mt-0.5"
                style={{ color: config.color }}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[9px] font-bold uppercase tracking-widest font-mono"
                    style={{ color: config.color }}
                  >
                    {config.label}
                  </span>
                  <span className="text-[10px] text-[var(--text-dim)] font-mono">
                    · {alert.source}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                  {alert.text}
                </p>
                <p className="text-[10px] text-[var(--text-dim)] mt-1 font-mono">
                  {alert.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
