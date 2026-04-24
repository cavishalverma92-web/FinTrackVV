import Link from "next/link";
import { getIntelligenceSnapshot } from "../api/intelligence/route";

export const revalidate = 300;

export const metadata = {
  title: "Penalty Tracker | FinServTracker",
  description: "Structured penalty and compliance action tracker across Indian financial services coverage.",
};

export default async function PenaltiesPage() {
  const intelligence = await getIntelligenceSnapshot();
  const penalties = intelligence.penalties || [];

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Link href="/" className="text-sm text-[var(--accent-blue)] hover:underline">
          Back to dashboard
        </Link>
        <h1 className="text-3xl font-bold font-display tracking-tight mt-4 mb-2">Penalty Tracker</h1>
        <p className="text-sm text-[var(--text-dim)] mb-8">
          Structured compliance and penalty signals extracted from the current intelligence snapshot.
        </p>

        <div className="grid gap-3">
          {penalties.length === 0 && (
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 text-sm text-[var(--text-dim)]">
              No structured penalty items were detected in the current snapshot.
            </div>
          )}
          {penalties.map((item) => (
            <div key={item.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
              <div className="flex flex-wrap gap-2 text-[11px] font-mono text-[var(--text-dim)] mb-3">
                <span>{item.regulator}</span>
                {item.amount && <span>Amount: {item.amount}</span>}
                <span>{item.category}</span>
              </div>
              <h2 className="text-lg font-semibold mb-2">{item.headline}</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-3">
                Entity: {item.entity}
              </p>
              <div className="flex flex-wrap gap-3">
                {item.slug && (
                  <Link href={`/article/${item.slug}`} className="text-sm text-[var(--accent-blue)] hover:underline">
                    Open article page
                  </Link>
                )}
                {item.url && (
                  <a href={item.url} target="_blank" rel="noreferrer" className="text-sm text-[var(--accent-blue)] hover:underline">
                    Open source link
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
