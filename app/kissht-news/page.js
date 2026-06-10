import KisshtIpoCommandCenter from "../components/KisshtIpoCommandCenter";
import { getKisshtIpoSnapshot } from "../lib/kisshtIpo";

export const revalidate = 300;
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kissht Real-Time News Center | FinServTracker",
  description: "Real-time monitoring of Kissht, OnEMI Technologies and SI Creva news, stock price, volume, investor narrative and leadership signals.",
  alternates: {
    canonical: "https://fin-track-vv.vercel.app/kissht-news",
  },
  openGraph: {
    title: "Kissht Real-Time News Center",
    description: "Live post-listing dashboard for Kissht / OnEMI Technologies / SI Creva Capital.",
    url: "https://fin-track-vv.vercel.app/kissht-news",
  },
};

export default async function KisshtNewsPage() {
  const snapshot = await getKisshtIpoSnapshot({ allowStale: true });
  return <KisshtIpoCommandCenter initialSnapshot={snapshot} />;
}
