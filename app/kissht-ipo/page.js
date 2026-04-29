import KisshtIpoCommandCenter from "../components/KisshtIpoCommandCenter";
import { getKisshtIpoSnapshot } from "../lib/kisshtIpo";

export const revalidate = 300;
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kissht IPO Command Center | FinServTracker",
  description: "Real-time monitoring of Kissht, OnEMI Technologies and SI Creva IPO news, GMP, broker notes, subscription and risk signals.",
  openGraph: {
    title: "Kissht IPO Command Center",
    description: "Live IPO war-room dashboard for Kissht / OnEMI Technologies / SI Creva Capital.",
    url: "https://fin-track-vv.vercel.app/kissht-ipo",
  },
};

export default async function KisshtIpoPage() {
  const snapshot = await getKisshtIpoSnapshot({ allowStale: true });
  return <KisshtIpoCommandCenter initialSnapshot={snapshot} />;
}
