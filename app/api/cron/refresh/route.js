import { getIntelligenceSnapshot } from "../../intelligence/route";

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

  const payload = await getIntelligenceSnapshot({ forceRefresh: true });

  return Response.json({
    ok: true,
    refreshedAt: payload.updatedAt,
    newsItems: payload.newsItems?.length || 0,
    materialUpdates: payload.materialUpdates?.length || 0,
    sourceHealth: payload.sourceHealth?.length || 0,
    qualityStats: payload.qualityStats || null,
    cache: payload.cache || null,
  });
}
