import { getKisshtIpoSnapshot } from "../../../lib/kisshtIpo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

let lastRefreshAt = 0;

function withDeadline(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Refresh timed out; serving last cache.")), timeoutMs)),
  ]);
}

export async function POST() {
  const now = Date.now();
  if (now - lastRefreshAt < 60 * 1000) {
    return Response.json({ ok: false, error: "Refresh cooldown active. Try again in a minute." }, { status: 429 });
  }
  lastRefreshAt = now;
  try {
    const payload = await withDeadline(getKisshtIpoSnapshot({ forceRefresh: true }), 18000);
    return Response.json({ ok: true, ...payload });
  } catch (error) {
    const cached = await getKisshtIpoSnapshot({ allowStale: true });
    return Response.json({
      ok: false,
      warning: error.message,
      ...cached,
    });
  }
}
