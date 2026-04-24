import DashboardClient from "./components/DashboardClient";
import { getIntelligenceSnapshot } from "./api/intelligence/route";

export const revalidate = 300;

export const metadata = {
  title: "FinServTracker | Indian Lending Intelligence Feed",
  description: "Live NBFC, bank, digital lender, exchange filing, and macro intelligence for Indian financial services.",
  openGraph: {
    title: "FinServTracker | Indian Lending Intelligence Feed",
    description: "Track Indian financial services news, filings, ratings, and board-ready intelligence briefs.",
    type: "website",
    url: "https://fin-track-vv.vercel.app/",
  },
  twitter: {
    card: "summary_large_image",
    title: "FinServTracker | Indian Lending Intelligence Feed",
    description: "Track Indian financial services news, filings, ratings, and board-ready intelligence briefs.",
  },
};

export default async function Page() {
  const intelligence = await getIntelligenceSnapshot();
  return <DashboardClient initialIntelligence={intelligence} />;
}
