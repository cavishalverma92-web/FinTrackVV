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

        <div className="grid gap-3">
          {sources.map((source) => (
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
