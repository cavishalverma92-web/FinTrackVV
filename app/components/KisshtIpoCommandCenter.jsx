"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Bell,
  Clock,
  ExternalLink,
  FileText,
  Filter,
  Newspaper,
  Radio,
  RefreshCw,
  ShieldAlert,
  Signal,
  TrendingUp,
  Video,
} from "lucide-react";

const EMPTY_FILTERS = {
  sentiment: "All",
  risk: "All",
  topic: "All",
  timeRange: "48h",
  entity: "All",
  sortBy: "Most Recent",
};

function formatDate(value) {
  if (!value) return "Awaited";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ageLabel(value) {
  if (!value) return "Awaited";
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function Badge({ children, tone = "neutral" }) {
  const tones = {
    positive: "text-[var(--accent-green)] bg-[rgba(18,107,79,0.1)] border-[rgba(18,107,79,0.22)]",
    negative: "text-[var(--accent-red)] bg-[rgba(168,50,50,0.1)] border-[rgba(168,50,50,0.22)]",
    warning: "text-[var(--accent-amber)] bg-[rgba(163,101,27,0.1)] border-[rgba(163,101,27,0.22)]",
    blue: "text-[var(--accent-blue)] bg-[rgba(40,90,127,0.1)] border-[rgba(40,90,127,0.2)]",
    neutral: "text-[var(--text-secondary)] bg-[var(--bg-primary)] border-[var(--border-subtle)]",
  };
  return (
    <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider font-mono ${tones[tone] || tones.neutral}`}>
      {children}
    </span>
  );
}

function KpiCard({ icon: Icon, label, value, detail, tone = "neutral" }) {
  return (
    <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 card-shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)] font-mono">{label}</p>
          <p className="mt-2 text-2xl font-bold font-display text-[var(--text-primary)]">{value}</p>
        </div>
        <div className={`rounded-sm border p-2 ${tone === "negative" ? "text-[var(--accent-red)] border-[rgba(168,50,50,0.2)] bg-[rgba(168,50,50,0.08)]" : "text-[var(--accent-blue)] border-[rgba(40,90,127,0.2)] bg-[rgba(40,90,127,0.08)]"}`}>
          <Icon size={17} />
        </div>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-[var(--text-dim)]">{detail}</p>
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

function EmptyState({ children }) {
  return (
    <div className="rounded-md border border-dashed border-[var(--border-subtle)] bg-[var(--bg-primary)] px-4 py-8 text-center text-sm text-[var(--text-dim)]">
      {children}
    </div>
  );
}

function sentimentTone(value) {
  if (value === "Positive") return "positive";
  if (value === "Negative") return "negative";
  return "neutral";
}

function riskTone(value) {
  if (value === "High") return "negative";
  if (value === "Medium") return "warning";
  return "neutral";
}

function withinRange(item, range) {
  if (range === "48h") return true;
  if (!item.publishedAt) return true;
  const hours = { "1h": 1, "6h": 6, "24h": 24 }[range] || 48;
  return Date.now() - new Date(item.publishedAt).getTime() <= hours * 60 * 60 * 1000;
}

export default function KisshtIpoCommandCenter({ initialSnapshot }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot || {});
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const news = snapshot.news || [];
  const risk = snapshot.risk || {};
  const gmp = snapshot.gmp || {};
  const brokers = snapshot.brokers || { notes: [], summary: {} };
  const youtube = snapshot.youtube || { items: [] };
  const social = snapshot.social || { items: [] };
  const subscription = snapshot.subscription || { categories: [] };
  const sourceStatus = snapshot.sourceStatus || [];
  const summary = snapshot.summary || {};

  const filteredNews = useMemo(() => news.filter((item) => {
    if (filters.sentiment !== "All" && item.sentiment !== filters.sentiment) return false;
    if (filters.risk !== "All" && item.riskLevel !== filters.risk) return false;
    if (filters.topic !== "All" && !(item.categoryTags || []).includes(filters.topic)) return false;
    if (filters.entity !== "All" && !(item.matchedEntity || "").toLowerCase().includes(filters.entity.toLowerCase())) return false;
    return withinRange(item, filters.timeRange);
  }).sort((a, b) => {
    if (filters.sortBy === "Most Recent") return new Date(b.publishedAt || b.updatedAt || 0) - new Date(a.publishedAt || a.updatedAt || 0);
    if (filters.sortBy === "Oldest") return new Date(a.publishedAt || a.updatedAt || 0) - new Date(b.publishedAt || b.updatedAt || 0);
    if (filters.sortBy === "Highest Risk") return ({ High: 3, Medium: 2, Low: 1 }[b.riskLevel] || 0) - ({ High: 3, Medium: 2, Low: 1 }[a.riskLevel] || 0);
    return (b.materialityScore || 0) - (a.materialityScore || 0);
  }), [news, filters]);

  const sentimentSplit = summary.daily?.sentimentSplit || {
    positive: news.filter((item) => item.sentiment === "Positive").length,
    neutral: news.filter((item) => item.sentiment === "Neutral").length,
    negative: news.filter((item) => item.sentiment === "Negative").length,
  };
  const topics = [...new Set(news.flatMap((item) => item.categoryTags || []))];
  const workingSources = sourceStatus.filter((source) => source.status === "Working").length;
  const sourceProblems = sourceStatus.filter((source) => ["Failed", "Manual/API required"].includes(source.status));
  const notifications = [
    ...(risk.highRiskAlerts || []).slice(0, 3).map((item) => ({
      tone: "negative",
      title: item.headline,
      detail: item.reason,
      url: item.url,
    })),
    ...(risk.topFive || []).filter((item) => item.severity !== "High").slice(0, 2).map((item) => ({
      tone: "warning",
      title: item.headline,
      detail: item.reason,
      url: item.url,
    })),
    ...(gmp.current ? [{
      tone: "positive",
      title: `Latest sourced GMP: Rs ${gmp.current.gmp}`,
      detail: gmp.current.gmpPercent == null ? gmp.current.source : `${gmp.current.gmpPercent}% from ${gmp.current.source}`,
      url: gmp.current.url,
    }] : []),
    ...sourceProblems.slice(0, 2).map((source) => ({
      tone: source.status === "Failed" ? "negative" : "warning",
      title: `${source.source}: ${source.status}`,
      detail: source.message || "Source needs manual/API access.",
      url: source.url,
    })),
  ];

  const refresh = async () => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      const response = await fetch("/api/kissht/refresh", { method: "POST", cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Refresh failed");
      setSnapshot(data);
    } catch (error) {
      setRefreshError(error.message);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-2.5 text-sm font-bold text-[var(--accent-blue)] card-shadow hover:bg-[var(--paper-highlight)]">
            <ArrowLeft size={17} /> Return to FinServTracker
          </Link>
          <div className="relative flex items-center gap-3">
            <div className="flex items-center gap-2 text-[11px] text-[var(--text-dim)] font-mono">
              <span className="inline-flex h-2 w-2 rounded-full bg-[var(--accent-green)] pulse-live" />
              Auto-refresh via cache TTL
            </div>
            <button
              onClick={() => setNotificationsOpen((open) => !open)}
              className="relative inline-flex items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-xs font-bold text-[var(--text-primary)] card-shadow"
              aria-label="Open IPO notifications"
            >
              <Bell size={15} />
              Alerts
              {notifications.length > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent-red)] px-1 text-[10px] font-bold text-white">
                  {notifications.length}
                </span>
              )}
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 top-11 z-20 w-[min(92vw,380px)] rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3 card-shadow">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dim)] font-mono">IPO Notifications</p>
                  <button onClick={() => setNotificationsOpen(false)} className="text-[11px] text-[var(--text-dim)]">Close</button>
                </div>
                <div className="max-h-80 space-y-2 overflow-auto">
                  {notifications.length ? notifications.map((note) => (
                    <a key={`${note.title}-${note.url}`} href={note.url || "#"} target={note.url ? "_blank" : undefined} rel="noreferrer" className="block rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3">
                      <div className="mb-1"><Badge tone={note.tone}>{note.tone}</Badge></div>
                      <p className="text-sm font-semibold leading-snug">{note.title}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-dim)]">{note.detail}</p>
                    </a>
                  )) : <EmptyState>No active IPO alerts.</EmptyState>}
                </div>
              </div>
            )}
          </div>
        </div>

        <header className="mb-6 border-y border-[var(--border-strong)] py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-16 w-40 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-white px-4 card-shadow">
                <img
                  src="https://www.kissht.com/_next/static/media/logo-blue.b298452f.svg"
                  alt="Kissht"
                  className="max-h-9 w-full object-contain"
                />
              </div>
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.26em] text-[var(--accent-burgundy)] font-mono">IPO War Room | By Vishal Verma</p>
                <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">Kissht IPO Command Center</h1>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)]">
                  Real-time monitoring of news, GMP, broker notes, YouTube coverage, subscription and risk signals.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
              <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-[11px] text-[var(--text-dim)] font-mono">
                Last updated {formatDate(snapshot.updatedAt)}
                {snapshot.cache?.servedFromCache ? " / cached" : ""}
              </div>
              <button
                onClick={refresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-sm bg-[var(--accent-burgundy)] px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
              >
                <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>
          {refreshError && <p className="mt-3 text-xs text-[var(--accent-red)]">{refreshError}</p>}
          {snapshot.error && <p className="mt-3 text-xs text-[var(--accent-amber)]">{snapshot.error}</p>}
        </header>

        <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <KpiCard icon={TrendingUp} label="Current GMP" value={gmp.current ? `Rs ${gmp.current.gmp}` : "Awaited"} detail={gmp.current?.gmpPercent != null ? `${gmp.current.gmpPercent}% from ${gmp.current.source}${gmp.range && gmp.range.min !== gmp.range.max ? `; range Rs ${gmp.range.min}-${gmp.range.max}` : ""}` : "Awaited / not available from public sources."} />
          <KpiCard icon={BarChart3} label="Total Subscription" value={subscription.current?.total || "Awaited"} detail="QIB / NII / Retail appears once public IPO subscription data is available." />
          <KpiCard icon={ShieldAlert} label="Negative Alerts" value={String(risk.count24h || 0)} detail={`${risk.highRiskAlerts?.length || 0} high-risk alerts; trend: ${risk.trend || "Quiet"}.`} tone={(risk.highRiskAlerts?.length || 0) ? "negative" : "neutral"} />
          <KpiCard icon={Newspaper} label="News Coverage" value={String(news.length)} detail={`${sentimentSplit.positive} positive / ${sentimentSplit.neutral} neutral / ${sentimentSplit.negative} negative in high-confidence feed.`} />
          <KpiCard icon={FileText} label="Broker View" value={`${brokers.summary?.subscribe || 0}/${brokers.summary?.avoid || 0}`} detail={`${brokers.summary?.subscribe || 0} subscribe, ${brokers.summary?.neutral || 0} neutral, ${brokers.summary?.avoid || 0} avoid, ${brokers.summary?.awaited || 0} awaited.`} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <Section
              title="Live News Timeline"
              subtitle="High-confidence Kissht / OnEMI / SI Creva public coverage from the latest 48-hour window."
              action={<Badge tone="blue">{filteredNews.length} visible</Badge>}
            >
              <div className="mb-4 flex flex-wrap gap-2">
                <Select label="Sentiment" value={filters.sentiment} options={["All", "Positive", "Neutral", "Negative"]} onChange={(value) => setFilters((f) => ({ ...f, sentiment: value }))} />
                <Select label="Risk" value={filters.risk} options={["All", "High", "Medium", "Low"]} onChange={(value) => setFilters((f) => ({ ...f, risk: value }))} />
                <Select label="Time" value={filters.timeRange} options={["1h", "6h", "24h", "48h"]} onChange={(value) => setFilters((f) => ({ ...f, timeRange: value }))} />
                <Select label="Topic" value={filters.topic} options={["All", ...topics]} onChange={(value) => setFilters((f) => ({ ...f, topic: value }))} />
                <Select label="Sort" value={filters.sortBy} options={["Most Recent", "Materiality", "Highest Risk", "Oldest"]} onChange={(value) => setFilters((f) => ({ ...f, sortBy: value }))} />
                <button onClick={() => setFilters(EMPTY_FILTERS)} className="inline-flex items-center gap-1 rounded-sm border border-[var(--border-subtle)] px-2 py-1 text-[11px] text-[var(--text-dim)]">
                  <Filter size={11} /> Reset
                </button>
              </div>
              <div className="space-y-3">
                {filteredNews.length ? filteredNews.map((item) => (
                  <article key={item.id} className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4 card-hover">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge tone="blue">{item.sourceName}</Badge>
                      <Badge tone={sentimentTone(item.sentiment)}>{item.sentiment}</Badge>
                      <Badge tone={riskTone(item.riskLevel)}>{item.riskLevel} risk</Badge>
                      <span className="text-[11px] text-[var(--text-dim)] font-mono">{ageLabel(item.publishedAt)}</span>
                      <span className="text-[11px] text-[var(--text-dim)] font-mono">M{item.materialityScore} / R{item.relevanceScore}</span>
                    </div>
                    <h3 className="text-base font-bold leading-snug">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{item.summary}</p>
                    <p className="mt-2 text-xs leading-relaxed text-[var(--text-dim)]">
                      <span className="font-bold text-[var(--text-secondary)]">Why this matters: </span>{item.whyThisMatters}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {(item.categoryTags || []).map((tag) => <Badge key={tag}>{tag}</Badge>)}
                      <a href={item.url} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-[var(--accent-blue)] hover:underline">
                        Source <ExternalLink size={12} />
                      </a>
                    </div>
                    {item.relatedUrls?.length > 1 && (
                      <div className="mt-3 text-[11px] text-[var(--text-dim)]">
                        Also covered by: {item.relatedUrls.slice(1).map((url, index) => (
                          <a key={url} href={url} target="_blank" rel="noreferrer" className="ml-2 text-[var(--accent-blue)] hover:underline">source {index + 2}</a>
                        ))}
                      </div>
                    )}
                  </article>
                )) : <EmptyState>No news found in the selected period.</EmptyState>}
              </div>
            </Section>

            <div className="grid gap-4 md:grid-cols-2">
              <BriefCard title="Hourly CEO Brief" bullets={summary.hourly?.bullets || ["No major new development in this period."]} />
              <BriefCard title="Daily CEO Brief" bullets={[
                `${summary.daily?.topDevelopments?.length || 0} top developments tracked today.`,
                `Sentiment split: ${sentimentSplit.positive} positive / ${sentimentSplit.neutral} neutral / ${sentimentSplit.negative} negative.`,
                summary.daily?.mostImportantNegative?.headline ? `Key negative: ${summary.daily.mostImportantNegative.headline}` : "No major negative story detected.",
                `GMP: ${summary.daily?.gmpTrend || "Awaited"}; Subscription: ${summary.daily?.subscriptionTrend || "Awaited"}.`,
              ]} />
            </div>
          </div>

          <aside className="space-y-4">
            <Section title="Risk Monitor" subtitle={`Last updated ${formatDate(risk.lastUpdatedAt)}`}>
              <div className="mb-3 grid grid-cols-3 gap-2 text-center">
                <MiniMetric label="24h" value={risk.count24h || 0} />
                <MiniMetric label="48h" value={risk.count48h || 0} />
                <MiniMetric label="Trend" value={risk.trend || "Quiet"} />
              </div>
              <div className="space-y-2">
                {risk.topFive?.length ? risk.topFive.map((item) => (
                  <div key={item.id} className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge tone={riskTone(item.severity)}>{item.severity}</Badge>
                      <span className="text-[10px] text-[var(--text-dim)] font-mono">{item.actionRequired}</span>
                    </div>
                    <a href={item.url} target="_blank" rel="noreferrer" className="text-sm font-semibold leading-snug hover:underline">{item.headline}</a>
                    <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-dim)]">{item.reason}</p>
                  </div>
                )) : <EmptyState>No high-risk alerts found.</EmptyState>}
              </div>
            </Section>

            <Section title="Source Freshness" subtitle={`${workingSources}/${sourceStatus.length} sources working`}>
              <div className="max-h-[520px] space-y-2 overflow-auto pr-1">
                {sourceStatus.slice(0, 28).map((source) => (
                  <div key={`${source.source}-${source.sourceType}-${source.url}`} className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-bold">{source.source}</p>
                      <Badge tone={source.status === "Working" ? "positive" : source.status === "Failed" ? "negative" : "warning"}>{source.status}</Badge>
                    </div>
                    <p className="mt-1 text-[10px] text-[var(--text-dim)] font-mono">L{source.reliabilityLevel} / {source.sourceType} / {source.itemCount || 0} items</p>
                    <p className="mt-1 text-[10px] text-[var(--text-dim)]">{source.message || `Fetched ${ageLabel(source.lastFetchedAt)}`}</p>
                  </div>
                ))}
              </div>
            </Section>
          </aside>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <GmpSection gmp={gmp} />
          <SubscriptionSection subscription={subscription} />
          <BrokerSection brokers={brokers} />
          <YoutubeSection youtube={youtube} />
          <SocialSection social={social} />
          <Diagnostics sourceStatus={sourceStatus} />
        </div>
      </div>
    </main>
  );
}

function Select({ label, value, options, onChange }) {
  return (
    <label className="flex items-center gap-1 text-[11px] text-[var(--text-dim)]">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-card)] px-2 py-1 text-[11px] text-[var(--text-primary)]">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-2">
      <p className="text-[10px] uppercase tracking-widest text-[var(--text-dim)] font-mono">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}

function BriefCard({ title, bullets }) {
  return (
    <Section title={title}>
      <ul className="space-y-2">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex gap-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--accent-burgundy)]" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function GmpSection({ gmp }) {
  return (
    <Section title="GMP Tracker" subtitle="Source-wise grey market premium tracking. No value is shown unless sourced.">
      {gmp.current ? (
        <div className="mb-4 grid gap-2 md:grid-cols-3">
          <MiniMetric label="Current GMP" value={`Rs ${gmp.current.gmp}`} />
          <MiniMetric label="GMP %" value={gmp.current.gmpPercent == null ? "Unavailable" : `${gmp.current.gmpPercent}%`} />
          <MiniMetric label="Source range" value={gmp.range && gmp.range.min !== gmp.range.max ? `Rs ${gmp.range.min}-${gmp.range.max}` : gmp.sourceCount || 0} />
        </div>
      ) : <EmptyState>GMP awaited from public sources.</EmptyState>}
      <GmpTable points={gmp.points || []} sources={gmp.sources || []} />
    </Section>
  );
}

function GmpTable({ points, sources }) {
  if (!points.length) return <StatusTable rows={sources} />;
  return (
    <div className="mt-4 overflow-auto">
      <table className="w-full text-left text-xs">
        <thead className="text-[10px] uppercase tracking-widest text-[var(--text-dim)] font-mono">
          <tr><th className="py-2">Source</th><th>GMP</th><th>GMP %</th><th>Price band</th><th>Status</th><th>Link</th></tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)]">
          {points.map((point) => (
            <tr key={`${point.source}-${point.url}-${point.gmp}`}>
              <td className="py-2 font-semibold">{point.source}</td>
              <td>Rs {point.gmp}</td>
              <td>{point.gmpPercent == null ? "Unavailable" : `${point.gmpPercent}%`}</td>
              <td>{point.priceBand == null ? "Unavailable" : `Rs ${point.priceBand}`}</td>
              <td><Badge tone="positive">{point.status || point.reliabilityStatus || "Live"}</Badge></td>
              <td>{point.url ? <a href={point.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[var(--accent-blue)] hover:underline">Open <ExternalLink size={10} /></a> : "Awaited"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <StatusTable rows={sources.filter((source) => !points.some((point) => point.source === source.source))} />
    </div>
  );
}

function SubscriptionSection({ subscription }) {
  return (
    <Section title="Subscription Tracker" subtitle="QIB / NII / Retail values appear only after public IPO subscription sources go live.">
      <div className="mb-4 grid gap-2 md:grid-cols-5">
        {(subscription.categories || []).map((row) => <MiniMetric key={row.category} label={row.category} value={row.current || "Awaited"} />)}
      </div>
      <StatusTable rows={subscription.sources || []} />
    </Section>
  );
}

function BrokerSection({ brokers }) {
  return (
    <Section title="Broker IPO Notes" subtitle="Recommendations are recorded only when explicitly available in public sources.">
      <div className="mb-4 grid gap-2 md:grid-cols-4">
        <MiniMetric label="Subscribe" value={brokers.summary?.subscribe || 0} />
        <MiniMetric label="Neutral" value={brokers.summary?.neutral || 0} />
        <MiniMetric label="Avoid" value={brokers.summary?.avoid || 0} />
        <MiniMetric label="Awaited" value={brokers.summary?.awaited || 0} />
      </div>
      <div className="max-h-[460px] overflow-auto">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-[var(--bg-card)] text-[10px] uppercase tracking-widest text-[var(--text-dim)] font-mono">
            <tr><th className="py-2">Broker</th><th>Recommendation</th><th>Thesis</th><th>Link</th></tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {(brokers.notes || []).map((note) => (
              <tr key={note.broker}>
                <td className="py-2 font-semibold">{note.broker}</td>
                <td><Badge tone={note.recommendation === "Avoid" ? "negative" : note.recommendation === "Awaited" ? "warning" : "positive"}>{note.recommendation}</Badge></td>
                <td className="max-w-[240px] py-2 text-[var(--text-dim)]">{note.reportTitle}</td>
                <td>{note.sourceUrl ? <a href={note.sourceUrl} target="_blank" rel="noreferrer" className="text-[var(--accent-blue)] hover:underline">Open</a> : "Awaited"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function YoutubeSection({ youtube }) {
  return (
    <Section title="YouTube Coverage" subtitle="Videos are not fabricated; API/manual status is shown when unavailable." action={<Video size={16} className="text-[var(--text-dim)]" />}>
      {(youtube.items || []).length ? <div /> : <EmptyState>{youtube.status || "YouTube API required"}</EmptyState>}
      <StatusTable rows={youtube.sources || []} />
    </Section>
  );
}

function SocialSection({ social }) {
  return (
    <Section title="Social Buzz" subtitle="Public chatter is separated from verified news.">
      {(social.items || []).length ? (
        <div className="space-y-2">
          {social.items.map((item) => (
            <a key={item.url} href={item.url} target="_blank" rel="noreferrer" className="block rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3">
              <div className="mb-1 flex gap-2"><Badge>{item.platform}</Badge><Badge tone={sentimentTone(item.sentiment)}>{item.sentiment}</Badge></div>
              <p className="text-sm font-semibold">{item.text}</p>
              <p className="mt-1 text-[11px] text-[var(--text-dim)]">{item.snippet}</p>
            </a>
          ))}
        </div>
      ) : <EmptyState>No high-confidence public social chatter found. X/LinkedIn require manual/API access.</EmptyState>}
      <StatusTable rows={social.statuses || []} />
    </Section>
  );
}

function Diagnostics({ sourceStatus }) {
  return (
    <Section title="Raw Source Diagnostics" subtitle="Clean source status without exposing internal stack traces." action={<Radio size={16} className="text-[var(--text-dim)]" />}>
      <div className="grid gap-2 md:grid-cols-2">
        <MiniMetric label="Working" value={sourceStatus.filter((s) => s.status === "Working").length} />
        <MiniMetric label="Manual/API" value={sourceStatus.filter((s) => s.status === "Manual/API required").length} />
        <MiniMetric label="Awaited" value={sourceStatus.filter((s) => s.status === "Awaited" || s.status === "Not available").length} />
        <MiniMetric label="Failed" value={sourceStatus.filter((s) => s.status === "Failed").length} />
      </div>
      <p className="mt-4 text-xs leading-relaxed text-[var(--text-dim)]">
        Reliability levels: 1 official/regulatory, 2 reputed financial media, 3 broker/analyst, 4 IPO portal, 5 YouTube/social/forums.
      </p>
    </Section>
  );
}

function StatusTable({ rows }) {
  if (!rows?.length) return null;
  return (
    <div className="mt-4 overflow-auto">
      <table className="w-full text-left text-xs">
        <thead className="text-[10px] uppercase tracking-widest text-[var(--text-dim)] font-mono">
          <tr><th className="py-2">Source</th><th>Status</th><th>Updated</th><th>Link</th></tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)]">
          {rows.map((row) => (
            <tr key={`${row.source}-${row.url}`}>
              <td className="py-2 font-semibold">{row.source}</td>
              <td><Badge tone={row.status === "Working" ? "positive" : row.status === "Failed" ? "negative" : "warning"}>{row.status}</Badge></td>
              <td className="text-[var(--text-dim)]">{formatDate(row.lastFetchedAt || row.timestamp)}</td>
              <td>{row.url ? <a href={row.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[var(--accent-blue)] hover:underline">Open <ExternalLink size={10} /></a> : "Awaited"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
