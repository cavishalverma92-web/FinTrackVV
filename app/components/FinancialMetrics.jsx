"use client";

import { ExternalLink } from "lucide-react";

function Sparkline({ data = [], color, width = 80, height = 24 }) {
  const clean = data.length ? data.map((item) => Number(item || 0)) : [0, 0];
  const max = Math.max(...clean);
  const min = Math.min(...clean);
  const range = max - min || 1;
  const points = clean.map((value, index) => {
    const x = clean.length === 1 ? width : (index / (clean.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  const lastY = height - ((clean[clean.length - 1] - min) / range) * (height - 4) - 2;

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={width} cy={lastY} r="2.5" fill={color} />
    </svg>
  );
}

function MetricCard({ metric }) {
  const color = metric.up ? "var(--accent-green)" : "var(--accent-red)";

  return (
    <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex-1 min-w-[160px]">
      <p className="text-[10px] font-semibold text-[var(--text-dim)] uppercase tracking-widest font-mono mb-2">
        {metric.label}
      </p>
      <p className="text-xl font-bold text-[var(--text-primary)] font-display tracking-tight">
        {metric.value}
      </p>
      <div className="flex items-center gap-3 mt-2">
        <span className="text-xs font-semibold" style={{ color }}>
          {metric.up ? "▲" : "▼"} {metric.change}
        </span>
        <Sparkline data={metric.sparkData} color={color} />
      </div>
    </div>
  );
}

function gnpaColor(value) {
  if (value > 3) return "var(--accent-red)";
  if (value > 2) return "var(--accent-amber)";
  return "var(--accent-green)";
}

function roeColor(value) {
  if (value > 16) return "var(--accent-green)";
  return "var(--text-secondary)";
}

function formatRsCr(value) {
  const number = Number(value || 0);
  if (!number) return "-";
  if (number >= 1000) return `Rs ${(number / 1000).toFixed(0)}K Cr`;
  return `Rs ${number.toFixed(0)} Cr`;
}

function median(values) {
  const clean = values.map(Number).filter(Boolean).sort((a, b) => a - b);
  if (!clean.length) return 0;
  const middle = Math.floor(clean.length / 2);
  return clean.length % 2 ? clean[middle] : (clean[middle - 1] + clean[middle]) / 2;
}

function buildRadar(peerData) {
  const withPat = [...peerData].filter((peer) => Number(peer.qtrProfit || 0) > 0);
  const withPb = [...peerData].filter((peer) => Number(peer.pb || 0) > 0);
  const withAssets = [...peerData].filter((peer) => Number(peer.assetSize || 0) > 0);
  const biggestPat = withPat.sort((a, b) => Number(b.qtrProfit) - Number(a.qtrProfit))[0];
  const largestAssets = withAssets.sort((a, b) => Number(b.assetSize) - Number(a.assetSize))[0];
  const expensive = withPb.sort((a, b) => Number(b.pb) - Number(a.pb))[0];
  const value = withPb.sort((a, b) => Number(a.pb) - Number(b.pb))[0];

  return [
    {
      label: "Highest latest PAT",
      name: biggestPat?.name || "-",
      value: biggestPat ? formatRsCr(biggestPat.qtrProfit) : "-",
      note: "Latest quarter",
    },
    {
      label: "Largest asset base",
      name: largestAssets?.name || "-",
      value: largestAssets ? formatRsCr(largestAssets.assetSize) : "-",
      note: "Public financials",
    },
    {
      label: "Premium valuation",
      name: expensive?.name || "-",
      value: expensive ? `${expensive.pb}x P/B` : "-",
      note: "Highest available P/B",
    },
    {
      label: "Lower P/B screen",
      name: value?.name || "-",
      value: value ? `${value.pb}x P/B` : "-",
      note: `Median ${median(peerData.map((peer) => peer.pb)).toFixed(1)}x`,
    },
  ];
}

function RadarCard({ item }) {
  return (
    <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
      <p className="text-[10px] font-semibold text-[var(--text-dim)] uppercase tracking-widest font-mono">
        {item.label}
      </p>
      <p className="text-sm font-bold text-[var(--text-primary)] mt-2">
        {item.name}
      </p>
      <p className="text-lg font-bold text-[var(--accent-green)] mt-1">
        {item.value}
      </p>
      <p className="text-[10px] text-[var(--text-dim)] mt-1 font-mono">
        {item.note}
      </p>
    </div>
  );
}

export default function FinancialMetrics({ sectorMetrics = [], peerData = [] }) {
  const radar = buildRadar(peerData);
  const patCoverage = peerData.filter((peer) => peer.qtrProfit).length;
  const pbCoverage = peerData.filter((peer) => peer.pb).length;
  const assetCoverage = peerData.filter((peer) => peer.assetSize).length;

  return (
    <div className="animate-fade-in">
      <div className="mb-5">
        <h2 className="text-lg font-bold font-display tracking-tight">
          Financial Services Metrics
        </h2>
        <p className="text-xs text-[var(--text-dim)] mt-1">
          Market data, Screener links and best-effort public financial ratios
        </p>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        {sectorMetrics.map((metric, index) => (
          <MetricCard key={index} metric={metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        {radar.map((item) => (
          <RadarCard key={item.label} item={item} />
        ))}
      </div>

      <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] mb-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Data Coverage
            </h3>
            <p className="text-[11px] text-[var(--text-dim)] mt-1">
              Live quote coverage plus public Screener extraction for financial fields
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Coverage label="PAT" value={patCoverage} total={peerData.length} />
            <Coverage label="P/B" value={pbCoverage} total={peerData.length} />
            <Coverage label="Assets" value={assetCoverage} total={peerData.length} />
          </div>
        </div>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--border-subtle)]">
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            Peer Comparison
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                {[
                  { label: "Entity", align: "left" },
                  { label: "Price", align: "right" },
                  { label: "Mkt Cap", align: "right" },
                  { label: "Asset Size", align: "right" },
                  { label: "GNPA %", align: "right" },
                  { label: "ROE %", align: "right" },
                  { label: "ROCE %", align: "right" },
                  { label: "Qtr Sales", align: "right" },
                  { label: "Latest Qtr PAT", align: "right" },
                  { label: "Book Value", align: "right" },
                  { label: "Div Yld", align: "right" },
                  { label: "Debt/Eq", align: "right" },
                  { label: "CoF %", align: "right" },
                  { label: "P/E", align: "right" },
                  { label: "P/B", align: "right" },
                  { label: "Price Move", align: "right" },
                  { label: "Source", align: "right" },
                ].map((col) => (
                  <th
                    key={col.label}
                    className="px-4 py-3 text-[10px] font-semibold text-[var(--text-dim)] uppercase tracking-wider font-mono whitespace-nowrap"
                    style={{ textAlign: col.align }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {peerData.map((peer, index) => (
                <tr
                  key={peer.symbol || peer.name || index}
                  className="border-b border-[rgba(30,41,59,0.3)] card-hover"
                >
                  <td className="px-4 py-3 font-semibold text-[var(--text-primary)] whitespace-nowrap">
                    {peer.screenerUrl ? (
                      <a href={peer.screenerUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[var(--accent-green)] hover:underline">
                        {peer.name}
                        <ExternalLink size={11} />
                      </a>
                    ) : peer.name}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--text-secondary)] font-mono">
                    {peer.price ? `Rs ${peer.price}` : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--text-secondary)] font-mono">
                    {formatRsCr(peer.marketCap)}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--text-secondary)] font-mono">
                    {formatRsCr(peer.assetSize)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold" style={{ color: gnpaColor(peer.gnpa) }}>
                    {peer.gnpa ? `${peer.gnpa}%` : "-"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono" style={{ color: roeColor(peer.roe) }}>
                    {peer.roe ? `${peer.roe}%` : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--text-secondary)] font-mono">
                    {peer.roce ? `${peer.roce}%` : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--text-secondary)] font-mono">
                    {peer.qtrSales ? `${peer.qtrSales} Cr` : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--text-secondary)] font-mono">
                    {peer.qtrProfit ? `${peer.qtrProfit} Cr` : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--text-secondary)] font-mono">
                    {peer.bookValue ? `Rs ${peer.bookValue}` : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--text-secondary)] font-mono">
                    {peer.dividendYield ? `${peer.dividendYield}%` : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--text-secondary)] font-mono">
                    {peer.debtToEquity ? peer.debtToEquity : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--text-secondary)] font-mono">
                    {peer.cof ? `${peer.cof}%` : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--text-secondary)] font-mono">
                    {peer.pe ? `${peer.pe}x` : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--text-secondary)] font-mono">
                    {peer.pb ? `${peer.pb}x` : "-"}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono font-semibold ${Number(peer.disbGrowth || 0) >= 0 ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]"}`}>
                    {Number(peer.disbGrowth || 0) >= 0 ? "+" : ""}{peer.disbGrowth || 0}%
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--text-dim)] font-mono whitespace-nowrap">
                    {peer.dataSource || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Coverage({ label, value, total }) {
  return (
    <span className="px-3 py-1.5 rounded-md bg-[var(--bg-primary)] text-[11px] font-semibold text-[var(--text-secondary)]">
      {label}: {value}/{total}
    </span>
  );
}
