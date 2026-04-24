"use client";

import { RefreshCw, Rss, Server, Clock } from "lucide-react";

function formatUpdatedAt(value) {
  if (!value) return "Not refreshed yet";
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SourceRow({ source, type }) {
  const Icon = type === "RSS" ? Rss : Server;
  const isOk = source.status === "ok";
  const isFallback = source.status === "fallback";
  const statusColor = isOk
    ? "var(--accent-green)"
    : isFallback
      ? "var(--accent-amber)"
      : "var(--accent-red)";

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 p-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] card-hover"
    >
      <div className="w-9 h-9 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center flex-shrink-0">
        <Icon size={15} className="text-[var(--accent-blue)]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {source.source}
          </p>
          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono text-[var(--text-dim)] bg-[var(--bg-primary)]">
            {type}
          </span>
          {source.sourceTier && (
            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono text-[var(--text-dim)] bg-[var(--bg-primary)]">
              {source.sourceTier}
            </span>
          )}
          <span
            className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono"
            style={{ color: statusColor, backgroundColor: `${statusColor}18` }}
          >
            {source.status || "pending"}
          </span>
        </div>
        <p className="text-[11px] text-[var(--text-dim)] truncate">
          {source.url}
        </p>
        <p className="text-[10px] text-[var(--text-dim)] mt-1 font-mono">
          {source.itemCount ?? 0} items
          {source.error ? ` - ${source.error}` : ""}
        </p>
      </div>
    </a>
  );
}

export default function SourceControl({
  sources,
  qualityStats,
  updatedAt,
  cache,
  dataStatus,
  dataError,
  onRefresh,
}) {
  const rssSources = sources?.rss || [];
  const htmlSources = sources?.html || [];
  const apiSources = sources?.apis || [];
  const allSources = [...rssSources, ...htmlSources, ...apiSources];
  const okCount = allSources.filter((source) => source.status === "ok").length;
  const errorCount = allSources.filter((source) => source.status === "error").length;
  const itemCount = allSources.reduce((sum, source) => sum + Number(source.itemCount || 0), 0);
  const directCount = allSources.filter((source) => source.sourceTier === "direct" || source.sourceTier === "primary").length;
  const aggregatorCount = allSources.filter((source) => source.sourceTier === "aggregator").length;
  const isLoading = dataStatus === "loading";

  return (
    <div className="max-w-4xl animate-fade-in">
      <div className="mb-5">
        <h2 className="text-lg font-bold font-display tracking-tight">
          Source Refresh
        </h2>
        <p className="text-xs text-[var(--text-dim)] mt-1">
          Refresh live news, market data, and FX signals without restarting the app.
        </p>
      </div>

      <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] mb-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[rgba(36,116,204,0.12)] flex items-center justify-center">
              <Clock size={16} className="text-[var(--accent-blue)]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Last refreshed: {formatUpdatedAt(updatedAt)}
              </p>
              <p className="text-[11px] text-[var(--text-dim)] mt-1">
                The dashboard opens from the last good cache; Refresh Now rebuilds it.
              </p>
              {cache?.savedAt && (
                <p className="text-[10px] text-[var(--text-dim)] mt-1 font-mono">
                  Cache saved: {formatUpdatedAt(cache.savedAt)}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--accent-green)] text-white text-xs font-bold cursor-pointer disabled:opacity-60 disabled:cursor-wait"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            {isLoading ? "Refreshing" : "Refresh Now"}
          </button>
        </div>

        {dataError && (
          <p className="mt-4 text-[11px] text-[var(--accent-amber)]">
            Last refresh note: {dataError}
          </p>
        )}
        {cache?.refreshFailed && (
          <p className="mt-2 text-[11px] text-[var(--accent-red)]">
            Refresh failed; showing the last good cached intelligence.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-5">
        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
          <p className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-wider font-mono">Healthy</p>
          <p className="text-2xl font-bold text-[var(--accent-green)] font-display mt-1">{okCount}</p>
        </div>
        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
          <p className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-wider font-mono">Issues</p>
          <p className="text-2xl font-bold text-[var(--accent-red)] font-display mt-1">{errorCount}</p>
        </div>
        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
          <p className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-wider font-mono">Raw Items</p>
          <p className="text-2xl font-bold text-[var(--text-primary)] font-display mt-1">{itemCount}</p>
        </div>
        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
          <p className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-wider font-mono">Direct + Primary</p>
          <p className="text-2xl font-bold text-[var(--accent-blue)] font-display mt-1">{directCount}</p>
        </div>
        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
          <p className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-wider font-mono">Aggregators</p>
          <p className="text-2xl font-bold text-[var(--accent-amber)] font-display mt-1">{aggregatorCount}</p>
        </div>
        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] md:col-span-5">
          <p className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-wider font-mono">Quality Gate</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {qualityStats
              ? `${qualityStats.materialItems || 0} material items kept from ${qualityStats.candidateItems || 0} candidates; ${qualityStats.filteredItems || 0} noisy items filtered.`
              : "No quality gate stats available for this snapshot."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div>
          <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-3">
            RSS Feeds
          </h3>
          <div className="flex flex-col gap-2">
            {rssSources.map((source, index) => (
              <SourceRow key={`${source.url}-${index}`} source={source} type="RSS" />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-3">
            Direct Pages
          </h3>
          <div className="flex flex-col gap-2">
            {htmlSources.map((source, index) => (
              <SourceRow key={`${source.url}-${index}`} source={source} type="HTML" />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-3">
            APIs
          </h3>
          <div className="flex flex-col gap-2">
            {apiSources.map((source, index) => (
              <SourceRow key={`${source.url}-${index}`} source={source} type="API" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
