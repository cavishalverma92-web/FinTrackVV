import { getKisshtIpoSnapshot, sliceKisshtPayload } from "../../../lib/kisshtIpo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const payload = await getKisshtIpoSnapshot({ allowStale: true });
  return Response.json(sliceKisshtPayload(payload, "gmp"));
}
