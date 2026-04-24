"use client";

import { ExternalLink, FileText, RefreshCw } from "lucide-react";

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

function percentileColor(value, allValues, higherIsBetter = true) {
  const clean = allValues.map(Number).filter(Boolean).sort((a, b) => a - b);
  if (!clean.length || !value) return "var(--text-secondary)";
  const idx = clean.findIndex((v) => v >= Number(value));
  const pct = idx === -1 ? 1 : idx / clean.length;
  if (higherIsBetter) {
    if (pct >= 0.67) return "var(--accent-green)";
    if (pct <= 0.33) return "var(--accent-red)";
  } else {
    if (pct <= 0.33) return "var(--accent-green)";
    if (pct >= 0.67) return "var(--accent-red)";
  }
  return "var(--text-secondary)";
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

function confidenceColor(value) {
  if (value === "High") return "var(--accent-green)";
  if (value === "Medium") return "var(--accent-amber)";
  return "var(--accent-red)";
}

function formatRsCr(value) {
  const number = Number(value || 0);
  if (!number) return "-";
  if (number >= 1000) return `Rs ${(number / 1000).toFixed(0)}K Cr`;
  return `Rs ${number.toFixed(0)} Cr`;
}

function formatUpdatedAt(value) {
  if (!value) return "Not refreshed yet";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
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

export default function FinancialMetrics({
  sectorMetrics = [],
  peerData = [],
  updatedAt,
  cache,
  dataStatus = "ready",
  onRefresh,
}) {
  const radar = buildRadar(peerData);
  const allROA = peerData.map((p) => p.roa);
  const allROE = peerData.map((p) => p.roe);
  const allROCE = peerData.map((p) => p.roce);
  const allGNPA = peerData.map((p) => p.gnpa);
  const allPB = peerData.map((p) => p.pb);
  const allPE = peerData.map((p) => p.pe);
  const patCoverage = peerData.filter((peer) => peer.qtrProfit).length;
  const pbCoverage = peerData.filter((peer) => peer.pb).length;
  const assetCoverage = peerData.filter((peer) => peer.assetSize).length;
  const aumCoverage = peerData.filter((peer) => peer.loanBook).length;
  const roaCoverage = peerData.filter((peer) => peer.roa).length;
  const deckCoverage = peerData.filter((peer) => peer.presentationUrl).length;
  const highConfidence = peerData.filter((peer) => peer.metricsConfidence === "High").length;
  const isLoading = dataStatus === "loading";

  return (
    <div className="animate-fade-in">
      <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold font-display tracking-tight">
            Financial Services Metrics
          </h2>
          <p className="text-xs text-[var(--text-dim)] mt-1">
            Market data / Loan Book (AUM) / ROA / BSE investor decks / Screener ratios
          </p>
          <p className="text-[10px] text-[var(--text-dim)] mt-1 font-mono">
            Updated {formatUpdatedAt(updatedAt)}
            {cache?.servedFromCache ? " / served from latest cache" : ""}
          </p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-sm bg-[var(--accent-burgundy)] text-white text-[11px] font-bold cursor-pointer disabled:opacity-60 disabled:cursor-wait"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
            Refresh Financials
          </button>
        )}
      </div>

      {!peerData.length && (
        <div className="p-6 rounded-md bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm text-[var(--text-secondary)]">
          Financial metrics are not available in the current snapshot. Use Refresh Financials to rebuild the market-data payload.
        </div>
      )}

      {!!peerData.length && (
        <>
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
            <Coverage label="Loan Book" value={aumCoverage} total={peerData.length} />
            <Coverage label="ROA" value={roaCoverage} total={peerData.length} />
            <Coverage label="PAT" value={patCoverage} total={peerData.length} />
            <Coverage label="P/B" value={pbCoverage} total={peerData.length} />
            <Coverage label="Assets" value={assetCoverage} total={peerData.length} />
            <Coverage label="Investor Deck" value={deckCoverage} total={peerData.length} />
            <Coverage label="High Confidence" value={highConfidence} total={peerData.length} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-3 text-[10px] font-mono text-[var(--text-dim)]">
        <span className="font-semibold uppercase tracking-wider">Peer rank:</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block bg-[var(--accent-green)]" /> Top third</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block bg-[var(--text-secondary)]" /> Middle</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block bg-[var(--accent-red)]" /> Bottom third</span>
        <span className="opacity-60">· P/E and P/B: lower = better (green)</span>
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
                  { label: "Deck", align: "center" },
                  { label: "Price", align: "right" },
                  { label: "Mkt Cap", align: "right" },
                  { label: "Loan Book (AUM)", align: "right" },
                  { label: "Asset Size", align: "right" },
                  { label: "ROA %", align: "right" },
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
                  { label: "Confidence", align: "center" },
                  { label: "As of", align: "right" },
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
                  <td className="px-4 py-3 text-center">
                    {peer.presentationUrl ? (
                      <a
                        href={peer.presentationUrl}
                        target="_blank"
                        rel="noreferrer"
                        title={peer.presentationDate ? `Investor deck · ${peer.presentationDate}` : "Investor presentation"}
                        className="inline-flex items-center justify-center text-[var(--accent-blue)] hover:text-[var(--accent-green)]"
                      >
                        <FileText size={13} />
                      </a>
                    ) : <span className="text-[var(--text-dim)]">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--text-secondary)] font-mono">
                    {peer.price ? `Rs ${peer.price}` : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--text-secondary)] font-mono">
                    {formatRsCr(peer.marketCap)}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--text-secondary)] font-mono">
                    {formatRsCr(peer.loanBook)}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--text-secondary)] font-mono">
                    {formatRsCr(peer.assetSize)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold" style={{ color: percentileColor(peer.roa, allROA, true) }}>
                    {peer.roa ? `${peer.roa}%` : "-"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold" style={{ color: gnpaColor(peer.gnpa) }}>
                    {peer.gnpa ? `${peer.gnpa}%` : "-"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold" style={{ color: percentileColor(peer.roe, allROE, true) }}>
                    {peer.roe ? `${peer.roe}%` : "-"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold" style={{ color: percentileColor(peer.roce, allROCE, true) }}>
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
                  <td className="px-4 py-3 text-right font-mono" style={{ color: percentileColor(peer.pe, allPE, false) }}>
                    {peer.pe ? `${peer.pe}x` : "-"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono" style={{ color: percentileColor(peer.pb, allPB, false) }}>
                    {peer.pb ? `${peer.pb}x` : "-"}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono font-semibold ${Number(peer.disbGrowth || 0) >= 0 ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]"}`}>
                    {Number(peer.disbGrowth || 0) >= 0 ? "+" : ""}{peer.disbGrowth || 0}%
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-semibold" style={{ color: confidenceColor(peer.metricsConfidence) }}>
                    {peer.metricsConfidence || "Low"}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--text-dim)] font-mono whitespace-nowrap">
                    {peer.metricsAsOf || "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--text-dim)] font-mono whitespace-nowrap">
                    {peer.metricsSource || peer.dataSource || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
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
