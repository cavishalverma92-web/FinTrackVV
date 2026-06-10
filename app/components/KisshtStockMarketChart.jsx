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
  return (
    <Section
      title="Daily Stock Price & Volume"
      subtitle={stockMarket?.symbol ? `${stockMarket.symbol} / ${stockMarket.exchangeName || "market data"}` : stockMarket?.message || "Chart appears when a configured market symbol returns daily candles."}
      action={<BarChart3 size={16} className="text-[var(--text-dim)]" />}
    >
      {points.length ? (
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "var(--text-dim)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="price" tick={{ fill: "var(--text-dim)", fontSize: 11 }} axisLine={false} tickLine={false} domain={["dataMin", "dataMax"]} width={46} />
              <YAxis yAxisId="volume" orientation="right" tickFormatter={compactNumber} tick={{ fill: "var(--text-dim)", fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 6,
                  color: "var(--text-primary)",
                  fontSize: 12,
                }}
                formatter={(value, name) => {
                  if (name === "close") return [money(value), "Close"];
                  if (name === "volume") return [compactNumber(value), "Volume"];
                  return [value, name];
                }}
                labelStyle={{ color: "var(--text-dim)" }}
              />
              <Bar yAxisId="volume" dataKey="volume" fill="var(--accent-blue)" opacity={0.22} radius={[3, 3, 0, 0]} />
              <Line yAxisId="price" type="monotone" dataKey="close" stroke="var(--accent-burgundy)" strokeWidth={2.4} dot={{ r: 2 }} activeDot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState>{stockMarket?.message || "No daily stock-price data available from configured symbols yet."}</EmptyState>
      )}
    </Section>
  );
}
