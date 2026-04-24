import Link from "next/link";
import { notFound } from "next/navigation";
import { getIntelligenceSnapshot } from "../../api/intelligence/route";
import { slugify } from "../../lib/content";

export const revalidate = 300;

export async function generateMetadata({ params }) {
  const intelligence = await getIntelligenceSnapshot();
  const entities = [...new Set((intelligence.newsItems || []).flatMap((item) => item.entities || []))];
  const entity = entities.find((name) => slugify(name) === params.slug);

  return {
    title: entity ? `${entity} | FinServTracker Entity Coverage` : "Entity Not Found | FinServTracker",
    description: entity
      ? `Latest coverage, filings, and intelligence for ${entity}.`
      : "Requested entity coverage was not found.",
  };
}

export default async function EntityPage({ params }) {
  const intelligence = await getIntelligenceSnapshot();
  const entities = [...new Set((intelligence.newsItems || []).flatMap((item) => item.entities || []))];
  const entity = entities.find((name) => slugify(name) === params.slug);
  if (!entity) notFound();

  const items = (intelligence.newsItems || []).filter((item) => (item.entities || []).includes(entity));

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <Link href="/" className="text-sm text-[var(--accent-blue)] hover:underline">
          Back to dashboard
        </Link>
        <h1 className="text-3xl font-bold font-display tracking-tight mt-4 mb-2">{entity}</h1>
        <p className="text-sm text-[var(--text-dim)] mb-8">{items.length} relevant item{items.length === 1 ? "" : "s"} in the current snapshot.</p>

        <div className="space-y-3">
          {items.map((item) => (
            <Link
              key={item.slug}
              href={`/article/${item.slug}`}
              className="block rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 hover:border-[var(--border-hover)]"
            >
              <p className="text-[11px] font-mono text-[var(--text-dim)] mb-2">
                {item.source} · {item.time}
              </p>
              <p className="text-base font-semibold leading-snug mb-2">{item.headline}</p>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.tldr}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
