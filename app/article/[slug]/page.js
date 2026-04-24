import Link from "next/link";
import { notFound } from "next/navigation";
import { getIntelligenceSnapshot } from "../../api/intelligence/route";

export const revalidate = 300;

function articleMetadata(item) {
  const description = item.tldr || item.whyMatters || item.headline;
  const url = `https://fin-track-vv.vercel.app/article/${item.slug}`;
  return {
    title: `${item.headline} | FinServTracker`,
    description,
    openGraph: {
      title: item.headline,
      description,
      type: "article",
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: item.headline,
      description,
    },
  };
}

export async function generateMetadata({ params }) {
  const intelligence = await getIntelligenceSnapshot();
  const article = intelligence.newsItems?.find((item) => item.slug === params.slug);
  if (!article) {
    return {
      title: "Article Not Found | FinServTracker",
    };
  }
  return articleMetadata(article);
}

export default async function ArticlePage({ params }) {
  const intelligence = await getIntelligenceSnapshot();
  const article = intelligence.newsItems?.find((item) => item.slug === params.slug);

  if (!article) notFound();

  const related = (intelligence.newsItems || [])
    .filter((item) => item.slug !== article.slug && item.category === article.category)
    .slice(0, 4);

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-6">
          <Link href="/" className="text-sm text-[var(--accent-blue)] hover:underline">
            Back to dashboard
          </Link>
        </div>

        <article className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-4 text-[11px] font-mono">
            <span className="px-2 py-0.5 rounded bg-[var(--bg-primary)] text-[var(--text-secondary)]">
              {article.source}
            </span>
            <span className="px-2 py-0.5 rounded bg-[var(--bg-primary)] text-[var(--text-secondary)]">
              {article.category}
            </span>
            <span className="text-[var(--text-dim)]">{article.time}</span>
            {article.exchange && (
              <span className="px-2 py-0.5 rounded bg-[var(--bg-primary)] text-[var(--text-secondary)]">
                {article.exchange}
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-4xl font-bold font-display tracking-tight leading-tight mb-5">
            {article.headline}
          </h1>

          <p className="text-base text-[var(--text-secondary)] leading-relaxed mb-6">
            {article.tldr}
          </p>

          {(article.sector || article.eventType || article.materialityReason) && (
            <section className="mb-8 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] p-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-dim)] mb-3">
                Materiality
              </h2>
              <div className="flex flex-wrap gap-2 mb-3">
                {article.eventType && <span className="px-2 py-1 rounded bg-[var(--bg-card)] text-[11px] font-mono text-[var(--text-secondary)]">{article.eventType}</span>}
                {article.sector && <span className="px-2 py-1 rounded bg-[var(--bg-card)] text-[11px] font-mono text-[var(--text-secondary)]">{article.sector}</span>}
              </div>
              {article.materialityReason && (
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{article.materialityReason}</p>
              )}
            </section>
          )}

          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <ImpactCard label="NBFC Impact" value={article.impactNBFC} />
            <ImpactCard label="Digital Impact" value={article.impactDigital} />
            <ImpactCard label="Investor Impact" value={article.impactInvestor} />
          </div>

          <section className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-dim)] mb-3">
              Why This Matters
            </h2>
            <p className="text-sm leading-relaxed text-[var(--text-primary)]">
              {article.whyMatters}
            </p>
          </section>

          {article.scoreReasoning && (
            <section className="mb-8">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-dim)] mb-3">
                Score Reasoning
              </h2>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                {article.scoreReasoning}
              </p>
            </section>
          )}

          {article.tags?.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-dim)] mb-3">
                Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 rounded bg-[var(--bg-primary)] text-[11px] font-mono text-[var(--text-secondary)]">
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {article.entities?.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-dim)] mb-3">
                Affected Entities
              </h2>
              <div className="flex flex-wrap gap-2">
                {article.entities.map((entity) => (
                  <Link key={entity} href={`/entity/${entity.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} className="px-2 py-1 rounded bg-[var(--bg-primary)] text-[11px] font-mono text-[var(--text-secondary)]">
                    {entity}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="flex flex-wrap gap-3">
            {article.url && (
              <a
                href={article.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-[var(--accent-blue)] text-white text-sm font-semibold"
              >
                Open source article
              </a>
            )}
            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-[var(--border-subtle)] text-sm font-semibold text-[var(--text-primary)]"
            >
              Explore latest feed
            </Link>
          </div>
        </article>

        {related.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-bold mb-4">Related Coverage</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={`/article/${item.slug}`}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 hover:border-[var(--border-hover)]"
                >
                  <p className="text-[11px] font-mono text-[var(--text-dim)] mb-2">
                    {item.source} · {item.time}
                  </p>
                  <p className="text-sm font-semibold leading-snug text-[var(--text-primary)]">
                    {item.headline}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function ImpactCard({ label, value }) {
  return (
    <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)] mb-2">
        {label}
      </p>
      <p className="text-lg font-bold text-[var(--text-primary)]">{value || "Medium"}</p>
    </div>
  );
}
