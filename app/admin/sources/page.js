import Link from "next/link";
import { getIntelligenceSnapshot } from "../../api/intelligence/route";

export const revalidate = 300;

export const metadata = {
  title: "Sources Admin | FinServTracker",
  description: "Source health, tiering, and refresh visibility for FinServTracker ingestion.",
};

export default async function SourcesAdminPage() {
  const intelligence = await getIntelligenceSnapshot();
  const sources = intelligence.sourceHealth || [];
  const stats = intelligence.sourceStats;

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Link href="/" className="text-sm text-[var(--accent-blue)] hover:underline">
          Back to dashboard
        </Link>
        <h1 className="text-3xl font-bold font-display tracking-tight mt-4 mb-2">Sources Admin</h1>
        <p className="text-sm text-[var(--text-dim)] mb-8">
          Current source health and tiering from the latest intelligence snapshot.
        </p>

        {stats && (
          <div className="grid gap-3 md:grid-cols-4 mb-8">
            <StatCard label="Total Sources" value={stats.totalSources} />
            <StatCard label="Direct Coverage" value={`${stats.directCoveragePct}%`} />
            <StatCard label="Aggregator Share" value={`${stats.aggregatorDependencyPct}%`} />
            <StatCard label="Primary Sources" value={stats.primarySources} />
          </div>
        )}

        <div className="grid gap-3">
          {[...sources]
            .sort((a, b) => {
              const tierRank = { primary: 3, direct: 2, aggregator: 1, unknown: 0 };
              const statusRank = { error: 3, fallback: 2, ok: 1, pending: 0 };
              if ((statusRank[b.status] || 0) !== (statusRank[a.status] || 0)) return (statusRank[b.status] || 0) - (statusRank[a.status] || 0);
              return (tierRank[b.sourceTier] || 0) - (tierRank[a.sourceTier] || 0);
            })
            .map((source) => (
            <div key={`${source.source}-${source.url}`} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
              <div className="flex flex-wrap gap-2 mb-2 text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded bg-[var(--bg-primary)] text-[var(--text-secondary)]">{source.type}</span>
                <span className="px-2 py-0.5 rounded bg-[var(--bg-primary)] text-[var(--text-secondary)]">{source.sourceTier || "unknown"}</span>
                <span className="px-2 py-0.5 rounded bg-[var(--bg-primary)] text-[var(--text-secondary)]">{source.status || "pending"}</span>
              </div>
              <h2 className="text-lg font-semibold mb-1">{source.source}</h2>
              <p className="text-sm text-[var(--text-secondary)] break-all mb-2">{source.url}</p>
              <p className="text-sm text-[var(--text-dim)]">
                {source.itemCount || 0} items{source.error ? ` · ${source.error}` : ""}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)] mb-2">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
