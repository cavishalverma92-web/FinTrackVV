"use client";

import { useCallback, useEffect, useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import NewsFeed from "./NewsFeed";
import NewsDetail from "./NewsDetail";
import DailyBrief from "./DailyBrief";
import RatingTracker from "./RatingTracker";
import FinancialMetrics from "./FinancialMetrics";
import CoLendingTracker from "./CoLendingTracker";
import AlertsPanel from "./AlertsPanel";
import GlobalIntel from "./GlobalIntel";
import GovtSchemes from "./GovtSchemes";
import SourceControl from "./SourceControl";
import MaterialUpdates from "./MaterialUpdates";
import WatchlistPanel from "./WatchlistPanel";

const INITIAL_DATA = {
  newsItems: [],
  alerts: [],
  ratingChanges: [],
  sectorMetrics: [],
  peerData: [],
  globalData: [],
  coLendingData: [],
  govtSchemes: [],
  penalties: [],
  materialUpdates: [],
  watchlist: [],
  dailyBrief: null,
  sources: null,
  sourceStats: null,
  updatedAt: null,
  cache: null,
};

function inferDataStatus(data) {
  return data?.cache?.refreshFailed || data?.error ? "fallback" : "ready";
}

export default function DashboardClient({ initialIntelligence }) {
  const [activeTab, setActiveTab] = useState("feed");
  const [selectedNews, setSelectedNews] = useState(null);
  const [showAlerts, setShowAlerts] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [intelligence, setIntelligence] = useState({ ...INITIAL_DATA, ...(initialIntelligence || {}) });
  const [dataStatus, setDataStatus] = useState(initialIntelligence ? inferDataStatus(initialIntelligence) : "loading");
  const [dataError, setDataError] = useState(initialIntelligence?.error || null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadIntelligence = useCallback(async (force = false) => {
    try {
      setDataStatus("loading");
      const response = force
        ? await fetch("/api/intelligence", { method: "POST", cache: "no-store" })
        : await fetch("/api/intelligence", { cache: "no-store" });
      if (!response.ok) throw new Error(`Live data request failed (${response.status})`);
      const data = await response.json();
      setIntelligence({ ...INITIAL_DATA, ...data });
      setDataError(data.error || null);
      setDataStatus(inferDataStatus(data));
    } catch (error) {
      setDataError(error.message);
      setDataStatus("fallback");
    }
  }, []);

  useEffect(() => {
    if (!initialIntelligence) loadIntelligence();
    const refreshId = window.setInterval(loadIntelligence, 15 * 60 * 1000);
    return () => window.clearInterval(refreshId);
  }, [initialIntelligence, loadIntelligence]);

  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved === "true") setDarkMode(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSelectedNews(null);
  };

  const handleSelectAndNavigate = (newsItem) => {
    setSelectedNews(newsItem);
    setActiveTab("feed");
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <Header
        showAlerts={showAlerts}
        alertCount={intelligence.alerts.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleAlerts={() => setShowAlerts(!showAlerts)}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode((d) => !d)}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((s) => !s)}
      />

      {showAlerts && (
        <AlertsPanel
          alerts={intelligence.alerts}
          onClose={() => setShowAlerts(false)}
        />
      )}

      {intelligence.updatedAt && Date.now() - new Date(intelligence.updatedAt).getTime() > 2 * 60 * 60 * 1000 && (
        <div className="flex items-center justify-between gap-3 px-6 py-2 bg-[rgba(183,121,31,0.1)] border-b border-[rgba(183,121,31,0.25)]">
          <p className="text-[11px] text-[var(--accent-amber)] font-mono">
            Data last refreshed {Math.floor((Date.now() - new Date(intelligence.updatedAt).getTime()) / 3600000)}h ago - feed may be stale
          </p>
          <button
            onClick={() => loadIntelligence(true)}
            className="text-[11px] font-bold text-[var(--accent-amber)] hover:underline cursor-pointer"
          >
            Refresh now
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          tabCounts={{
            feed: intelligence.newsItems.length,
            summary: intelligence.materialUpdates.length,
            ratings: intelligence.ratingChanges.length,
            metrics: intelligence.peerData.length,
            colending: intelligence.coLendingData.length,
            schemes: intelligence.govtSchemes.length,
            global: intelligence.globalData.length,
          }}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {dataStatus === "loading" && intelligence.newsItems.length === 0 && (
            <div className="animate-pulse space-y-4">
              <div className="h-5 w-48 bg-[var(--bg-elevated)] rounded" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 rounded-xl bg-[var(--bg-elevated)]" />
                ))}
              </div>
              <div className="space-y-3 mt-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-20 rounded-xl bg-[var(--bg-elevated)]" />
                ))}
              </div>
            </div>
          )}

          {activeTab === "feed" && (
            <div className="flex gap-6 h-full">
              <div className="flex-1 min-w-0">
                <MaterialUpdates
                  updates={intelligence.materialUpdates}
                  onSelectNews={setSelectedNews}
                />
                <NewsFeed
                  newsItems={intelligence.newsItems}
                  dataStatus={dataStatus}
                  dataError={dataError}
                  sources={intelligence.sources}
                  updatedAt={intelligence.updatedAt}
                  cache={intelligence.cache}
                  searchQuery={searchQuery}
                  selectedId={selectedNews?.id}
                  onSelectNews={setSelectedNews}
                  onRefresh={() => loadIntelligence(true)}
                />
              </div>
              <div className="w-[400px] flex-shrink-0 hidden lg:block">
                <NewsDetail news={selectedNews} />
              </div>
            </div>
          )}

          {activeTab === "summary" && (
            <>
              <MaterialUpdates updates={intelligence.materialUpdates} />
              <DailyBrief
                newsItems={intelligence.newsItems}
                ratingChanges={intelligence.ratingChanges}
                brief={intelligence.dailyBrief}
                globalData={intelligence.globalData}
                dataStatus={dataStatus}
                onSelectNews={handleSelectAndNavigate}
              />
              <WatchlistPanel watchlist={intelligence.watchlist} />
            </>
          )}

          {activeTab === "ratings" && (
            <RatingTracker ratingChanges={intelligence.ratingChanges} />
          )}

          {activeTab === "metrics" && (
            <>
              <FinancialMetrics
                sectorMetrics={intelligence.sectorMetrics}
                peerData={intelligence.peerData}
              />
              <WatchlistPanel watchlist={intelligence.watchlist} />
            </>
          )}

          {activeTab === "colending" && (
            <CoLendingTracker coLendingData={intelligence.coLendingData} />
          )}

          {activeTab === "schemes" && (
            <GovtSchemes govtSchemes={intelligence.govtSchemes} onSelectNews={handleSelectAndNavigate} />
          )}

          {activeTab === "global" && (
            <GlobalIntel globalData={intelligence.globalData} />
          )}

          {activeTab === "sources" && (
            <SourceControl
              sources={intelligence.sources}
              updatedAt={intelligence.updatedAt}
              cache={intelligence.cache}
              dataStatus={dataStatus}
              dataError={dataError}
              onRefresh={() => loadIntelligence(true)}
            />
          )}
        </main>
      </div>

      {intelligence.sources && (
        <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-card)] px-6 py-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-[9px] font-black text-[var(--text-dim)] uppercase tracking-widest font-mono flex-shrink-0">
              Live Sources
            </span>
            {[
              ...([...new Set((intelligence.sources.rss || []).map((s) => s.source))].map((name) => {
                const ok = (intelligence.sources.rss || []).some((s) => s.source === name && s.status === "ok");
                return { name, ok, type: "rss" };
              })),
              ...(intelligence.sources.apis || []).map((s) => ({ name: s.source, ok: s.status === "ok", type: "api" })),
            ].map((src) => (
              <span
                key={src.name}
                className="inline-flex items-center gap-1 text-[9px] font-mono"
                style={{ color: src.ok ? "var(--accent-green)" : "var(--accent-red)" }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0"
                  style={{ backgroundColor: src.ok ? "var(--accent-green)" : "var(--accent-red)" }}
                />
                {src.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
