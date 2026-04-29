import { getIntelligenceSnapshot } from "../../intelligence/route";
import { getKisshtIpoSnapshot } from "../../../lib/kisshtIpo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function isAuthorized(request) {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) return true;
  return request.headers.get("authorization") === `Bearer ${expectedSecret}`;
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const [payload, kisshtIpo] = await Promise.all([
    getIntelligenceSnapshot({ forceRefresh: true }),
    getKisshtIpoSnapshot({ forceRefresh: true }),
  ]);

  return Response.json({
    ok: true,
    refreshedAt: payload.updatedAt,
    newsItems: payload.newsItems?.length || 0,
    materialUpdates: payload.materialUpdates?.length || 0,
    sourceHealth: payload.sourceHealth?.length || 0,
    kisshtIpo: {
      refreshedAt: kisshtIpo.updatedAt,
      newsItems: kisshtIpo.news?.length || 0,
      sourceHealth: kisshtIpo.sourceStatus?.length || 0,
    },
    qualityStats: payload.qualityStats || null,
    cache: payload.cache || null,
  });
}
