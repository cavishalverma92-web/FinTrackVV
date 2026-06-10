"use client";

import { BarChart3 } from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function money(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "Awaited";
  return `Rs ${number.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function compactNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "Awaited";
  if (number >= 10000000) return `${(number / 10000000).toFixed(2)}cr`;
  if (number >= 100000) return `${(number / 100000).toFixed(2)}L`;
  if (number >= 1000) return `${(number / 1000).toFixed(1)}k`;
  return number.toLocaleString("en-IN");
}

function EmptyState({ children }) {
  return (
    <div className="rounded-md border border-dashed border-[var(--border-subtle)] bg-[var(--bg-primary)] px-4 py-8 text-center text-sm text-[var(--text-dim)]">
      {children}
    </div>
  );
}

function Section({ title, subtitle, children, action }) {
  return (
    <section className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] card-shadow">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] px-4 py-3">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-[var(--text-dim)]">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export default function KisshtStockMarketChart({ stockMarket }) {
  const points = (stockMarket?.points || []).map((point) => ({
    ...point,
    label: new Date(point.timestamp || point.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
  }));
  const latest = stockMarket?.current || points.at(-1) || null;
  const closes = points.map((point) => Number(point.close)).filter(Number.isFinite);
  const volumes = points.map((point) => Number(point.volume)).filter(Number.isFinite);
  const periodHigh = closes.length ? Math.max(...closes) : null;
  const periodLow = closes.length ? Math.min(...closes) : null;
  const avgVolume = volumes.length ? volumes.reduce((sum, value) => sum + value, 0) / volumes.length : null;
  const moveTone = latest?.changePercent > 0 ? "var(--accent-green)" : latest?.changePercent < 0 ? "var(--accent-red)" : "var(--text-dim)";
  return (
    <Section
      title="Daily Stock Price & Volume"
      subtitle={stockMarket?.symbol ? `${stockMarket.symbol} / ${stockMarket.exchangeName || "market data"}` : stockMarket?.message || "Chart appears when a configured market symbol returns daily candles."}
      action={<BarChart3 size={16} className="text-[var(--text-dim)]" />}
    >
      {points.length ? (
        <div>
          <div className="mb-4 grid gap-2 md:grid-cols-4">
            <div className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3">
              <p className="text-[10px] uppercase tracking-widest text-[var(--text-dim)] font-mono">Latest close</p>
              <p className="mt-1 font-display text-xl font-bold">{money(latest?.close)}</p>
              <p className="mt-1 text-[11px] font-bold" style={{ color: moveTone }}>
                {latest?.changePercent == null ? "Move awaited" : `${latest.changePercent > 0 ? "+" : ""}${latest.changePercent}% day`}
              </p>
            </div>
            <div className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3">
              <p className="text-[10px] uppercase tracking-widest text-[var(--text-dim)] font-mono">Latest volume</p>
              <p className="mt-1 font-display text-xl font-bold">{latest?.volumeLabel || compactNumber(latest?.volume)}</p>
              <p className="mt-1 text-[11px] text-[var(--text-dim)]">Avg {compactNumber(avgVolume)}</p>
            </div>
            <div className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3">
              <p className="text-[10px] uppercase tracking-widest text-[var(--text-dim)] font-mono">Period range</p>
              <p className="mt-1 font-display text-xl font-bold">{money(periodLow)} - {money(periodHigh)}</p>
              <p className="mt-1 text-[11px] text-[var(--text-dim)]">{points.length} daily candles</p>
            </div>
            <div className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3">
              <p className="text-[10px] uppercase tracking-widest text-[var(--text-dim)] font-mono">Updated</p>
              <p className="mt-1 font-display text-xl font-bold">{latest?.label || "Awaited"}</p>
              <p className="mt-1 text-[11px] text-[var(--text-dim)]">{stockMarket?.source || "Market source"}</p>
            </div>
          </div>
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={points} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="kisshtVolume" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity={0.34} />
                    <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity={0.08} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "var(--text-dim)", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={18} />
                <YAxis yAxisId="price" tick={{ fill: "var(--text-dim)", fontSize: 11 }} axisLine={false} tickLine={false} domain={["dataMin - 2", "dataMax + 2"]} width={54} tickFormatter={(value) => `Rs ${value}`} />
                <YAxis yAxisId="volume" orientation="right" tickFormatter={compactNumber} tick={{ fill: "var(--text-dim)", fontSize: 11 }} axisLine={false} tickLine={false} width={58} />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 6,
                    color: "var(--text-primary)",
                    fontSize: 12,
                    boxShadow: "0 12px 28px var(--shadow-soft)",
                  }}
                  formatter={(value, name) => {
                    if (name === "close") return [money(value), "Close"];
                    if (name === "volume") return [compactNumber(value), "Volume"];
                    return [value, name];
                  }}
                  labelStyle={{ color: "var(--text-dim)" }}
                />
                <Bar yAxisId="volume" dataKey="volume" fill="url(#kisshtVolume)" radius={[3, 3, 0, 0]} />
                <Line yAxisId="price" type="monotone" dataKey="close" stroke="var(--accent-burgundy)" strokeWidth={2.8} dot={false} activeDot={{ r: 5, strokeWidth: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <EmptyState>{stockMarket?.message || "No daily stock-price data available from configured symbols yet."}</EmptyState>
      )}
    </Section>
  );
}
