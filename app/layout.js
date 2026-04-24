import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://fin-track-vv.vercel.app"),
  title: "FinServTracker — NBFC & Lending Intelligence",
  description: "Real-time CEO intelligence dashboard for NBFCs, Digital Lenders and Banks — RBI, SEBI, ratings, market data.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📈</text></svg>",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
