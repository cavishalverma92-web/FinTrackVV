// ============================================================
// MOCK DATA — Replace with real API calls later
// This file contains all the sample data for the dashboard.
// Each section is clearly labeled so you can find and edit it.
// ============================================================


// ─────────────────────────────────────────────────────────────
// 1. NEWS ITEMS
// These appear in the "Live Feed" tab.
// To add a new item: copy one object, change the values.
// ─────────────────────────────────────────────────────────────
export const NEWS_ITEMS = [
  {
    id: 1,
    time: "2 min ago",
    source: "RBI",
    category: "Regulation",
    headline: "RBI Releases Draft Guidelines on Digital Lending — Tighter KYC Norms for NBFCs",
    tldr: "RBI proposes enhanced KYC requirements and loan disbursement controls for digital lending entities operating through third-party platforms.",
    whyMatters: "Directly impacts cost of compliance for digital lenders. May slow onboarding velocity by 15-20% but improves portfolio quality long-term. Second-order effect: consolidation favoring larger, tech-enabled NBFCs with existing compliance infrastructure.",
    impactNBFC: "High",
    impactDigital: "Critical",
    impactInvestor: "Medium",
    tags: ["Regulation", "KYC", "Digital Lending"],
    risk: "Medium",
    trending: true,
  },
  {
    id: 2,
    time: "18 min ago",
    source: "CRISIL",
    category: "Credit Rating",
    headline: "CRISIL Upgrades Bajaj Finance to AAA/Stable — AUM Growth & Asset Quality Cited",
    tldr: "Bajaj Finance credit rating upgraded to AAA with stable outlook, reflecting strong AUM growth of 28% YoY and improving GNPA metrics.",
    whyMatters: "Sets benchmark for large NBFCs. May trigger re-rating of the sector. Lowers cost of borrowing by ~15-25 bps. Signals that diversified NBFC model with tech investment is being rewarded by rating agencies.",
    impactNBFC: "High",
    impactDigital: "Medium",
    impactInvestor: "High",
    tags: ["Rating Upgrade", "NBFC", "Asset Quality"],
    risk: "Low",
    trending: false,
  },
  {
    id: 3,
    time: "42 min ago",
    source: "Bloomberg",
    category: "Fundraise",
    headline: "PhonePe-Backed Lending Arm Raises $200M Series C at $1.2B Valuation",
    tldr: "PhonePe's lending subsidiary closes $200M round led by Tiger Global with participation from GIC. Plans to expand to 50M credit-eligible users by FY27.",
    whyMatters: "Signals continued investor confidence in India embedded lending. Competition intensifies for mid-ticket unsecured loans. PhonePe's distribution advantage (500M+ users) creates significant origination moat.",
    impactNBFC: "Medium",
    impactDigital: "Critical",
    impactInvestor: "High",
    tags: ["Fundraise", "Embedded Finance", "Competition"],
    risk: "Low",
    trending: true,
  },
  {
    id: 4,
    time: "1h ago",
    source: "ET BFSI",
    category: "Partnership",
    headline: "HDFC Bank Partners With Three NBFCs for Priority Sector Co-Lending in Rural India",
    tldr: "HDFC Bank expands co-lending program targeting rural micro-enterprise loans up to ₹10L through NBFC origination partners across 150 districts.",
    whyMatters: "Co-lending volumes set to grow 3x. Creates origination opportunity for NBFCs with rural distribution. Bank gets PSL compliance; NBFC gets lower cost of funds. Win-win model scaling rapidly.",
    impactNBFC: "Critical",
    impactDigital: "Medium",
    impactInvestor: "Medium",
    tags: ["Co-Lending", "Partnership", "PSL"],
    risk: "Low",
    trending: false,
  },
  {
    id: 5,
    time: "2h ago",
    source: "Reuters",
    category: "Risk Signal",
    headline: "Unsecured Loan Delinquencies Rise 120bps QoQ Across Fintech Lenders — RBI Data",
    tldr: "RBI quarterly data shows sharp uptick in 90+ DPD for unsecured personal loans originated through digital platforms, especially in the ₹50K-₹2L ticket size.",
    whyMatters: "Early warning for credit cycle turn. May trigger tighter underwriting norms and increased provisioning. Investor sentiment for unsecured lenders will weaken. Could lead to RBI intervention on growth caps.",
    impactNBFC: "High",
    impactDigital: "Critical",
    impactInvestor: "Critical",
    tags: ["Risk", "GNPA", "Unsecured Lending"],
    risk: "High",
    trending: true,
  },
  {
    id: 6,
    time: "3h ago",
    source: "MoF",
    category: "Policy",
    headline: "Finance Ministry Extends CGFMU Coverage to ₹20L for MSME Loans Through March 2027",
    tldr: "Credit Guarantee Fund for Micro Units extends coverage limit and validity period. NBFCs now eligible for 85% guarantee on loans up to ₹20L to registered MSMEs.",
    whyMatters: "Dramatically reduces credit risk for small-ticket MSME lending. Expected to unlock ₹50,000 Cr in incremental disbursements across the sector. NBFCs with MSME focus get significant credit cost reduction.",
    impactNBFC: "Critical",
    impactDigital: "High",
    impactInvestor: "Medium",
    tags: ["CGFMU", "Govt Scheme", "MSME"],
    risk: "Low",
    trending: false,
  },
  {
    id: 7,
    time: "4h ago",
    source: "Mint",
    category: "AI & Tech",
    headline: "Five Leading NBFCs Adopt AI-Based Underwriting Models — Default Rates Drop 35%",
    tldr: "Industry report shows NBFCs using machine learning credit scoring see 35% lower default rates vs traditional scorecards. Bureau-plus-alternative-data models gaining traction.",
    whyMatters: "Tech-first NBFCs gaining structural advantage in risk selection. Traditional lenders face competitive disadvantage. Creates new data moat that compounds over lending cycles.",
    impactNBFC: "High",
    impactDigital: "Critical",
    impactInvestor: "Medium",
    tags: ["AI", "Underwriting", "Technology"],
    risk: "Low",
    trending: true,
  },
  {
    id: 8,
    time: "5h ago",
    source: "SEBI",
    category: "Regulation",
    headline: "SEBI Proposes Tighter NCD Listing Norms — Minimum Issue Size Raised to ₹50 Cr",
    tldr: "SEBI draft circular proposes raising minimum NCD public issue size to ₹50 Cr from ₹25 Cr. Additional disclosure requirements for NBFC issuers.",
    whyMatters: "Impacts smaller NBFCs' ability to raise public debt. May push more issuers toward private placements. Larger NBFCs unaffected but get competitive advantage in public debt markets.",
    impactNBFC: "High",
    impactDigital: "Low",
    impactInvestor: "Medium",
    tags: ["SEBI", "NCD", "Capital Markets"],
    risk: "Medium",
    trending: false,
  },
];


// ─────────────────────────────────────────────────────────────
// 2. CREDIT RATING CHANGES
// These appear in the "Ratings" tab.
// ─────────────────────────────────────────────────────────────
export const RATING_CHANGES = [
  {
    entity: "Bajaj Finance",
    from: "AA+",
    to: "AAA",
    outlook: "Stable",
    agency: "CRISIL",
    direction: "up",
    date: "Today",
    rationale: "Strong AUM growth of 28% YoY, improving asset quality with GNPA declining to 1.1%, and diversified product mix across consumer, SME, and mortgage segments.",
  },
  {
    entity: "Poonawalla Fincorp",
    from: "AA-",
    to: "AA",
    outlook: "Positive",
    agency: "ICRA",
    direction: "up",
    date: "Yesterday",
    rationale: "Successful transition to digital-first model, strong capital buffers (CAR 32%), and improving profitability metrics following strategic pivot.",
  },
  {
    entity: "IIFL Finance",
    from: "AA",
    to: "AA-",
    outlook: "Watch",
    agency: "CARE",
    direction: "down",
    date: "2d ago",
    rationale: "Regulatory concerns around gold loan operations, temporary business restrictions imposed by RBI, and near-term uncertainty on operational normalization timeline.",
  },
  {
    entity: "Muthoot Finance",
    from: "AA+",
    to: "AA+",
    outlook: "Stable → Positive",
    agency: "India Ratings",
    direction: "up",
    date: "3d ago",
    rationale: "Consistent gold loan AUM growth, strong collection metrics (CE ratio >99%), and improving diversification into housing and microfinance segments.",
  },
  {
    entity: "Manappuram Finance",
    from: "AA",
    to: "AA",
    outlook: "Stable → Negative",
    agency: "CRISIL",
    direction: "down",
    date: "4d ago",
    rationale: "Microfinance subsidiary showing elevated stress, gold loan margins under pressure from competition, and concentration risk in Kerala and Tamil Nadu markets.",
  },
  {
    entity: "Shriram Finance",
    from: "AA",
    to: "AA+",
    outlook: "Stable",
    agency: "CRISIL",
    direction: "up",
    date: "5d ago",
    rationale: "Successful merger integration, strong commercial vehicle loan franchise, improving cost efficiencies, and consistent disbursement growth across segments.",
  },
  {
    entity: "Tata Capital",
    from: "AAA",
    to: "AAA",
    outlook: "Stable",
    agency: "ICRA",
    direction: "up",
    date: "1w ago",
    rationale: "Strong parentage, diversified lending portfolio, conservative underwriting standards, and robust capital position supporting sustained growth.",
  },
];


// ─────────────────────────────────────────────────────────────
// 3. FINANCIAL METRICS (Sector Summary)
// These appear as cards at the top of the "Financials" tab.
// ─────────────────────────────────────────────────────────────
export const SECTOR_METRICS = [
  {
    label: "Sector AUM",
    value: "₹42.3L Cr",
    change: "+18.2% YoY",
    up: true,
    sparkData: [28, 30, 31, 33, 35, 37, 38, 40, 42.3],
  },
  {
    label: "Avg GNPA",
    value: "2.8%",
    change: "-40bps QoQ",
    up: true,   // "up" means "good" here, GNPA going down is good
    sparkData: [4.2, 3.9, 3.6, 3.4, 3.2, 3.1, 3.0, 2.9, 2.8],
  },
  {
    label: "Avg Cost of Funds",
    value: "8.4%",
    change: "+15bps QoQ",
    up: false,  // Cost going up is bad
    sparkData: [7.8, 7.9, 8.0, 8.1, 8.1, 8.2, 8.2, 8.3, 8.4],
  },
  {
    label: "Disbursements",
    value: "₹3.2L Cr",
    change: "+24% YoY",
    up: true,
    sparkData: [1.8, 2.0, 2.2, 2.4, 2.5, 2.6, 2.8, 3.0, 3.2],
  },
  {
    label: "Avg ROE",
    value: "14.6%",
    change: "+120bps YoY",
    up: true,
    sparkData: [11.2, 11.8, 12.4, 12.9, 13.2, 13.6, 14.0, 14.3, 14.6],
  },
  {
    label: "Sector PE",
    value: "18.4x",
    change: "-1.2x QoQ",
    up: false,
    sparkData: [22, 21, 20.5, 20, 19.8, 19.5, 19.2, 18.8, 18.4],
  },
];


// ─────────────────────────────────────────────────────────────
// 4. PEER COMPARISON TABLE
// Individual NBFC data for the comparison table.
// ─────────────────────────────────────────────────────────────
export const PEER_DATA = [
  { name: "Bajaj Finance", aum: 310000, gnpa: 1.1, roe: 22.4, cof: 7.2, pe: 32, disbGrowth: 28 },
  { name: "Shriram Finance", aum: 215000, gnpa: 5.2, roe: 15.1, cof: 8.8, pe: 14, disbGrowth: 18 },
  { name: "Poonawalla Fincorp", aum: 72000, gnpa: 1.4, roe: 12.8, cof: 7.6, pe: 28, disbGrowth: 42 },
  { name: "Muthoot Finance", aum: 88000, gnpa: 2.1, roe: 18.2, cof: 8.1, pe: 16, disbGrowth: 15 },
  { name: "Manappuram Finance", aum: 42000, gnpa: 2.8, roe: 14.6, cof: 8.9, pe: 11, disbGrowth: 12 },
  { name: "IIFL Finance", aum: 78000, gnpa: 1.9, roe: 16.3, cof: 8.4, pe: 19, disbGrowth: 22 },
  { name: "Tata Capital", aum: 95000, gnpa: 1.6, roe: 14.8, cof: 7.8, pe: 24, disbGrowth: 26 },
  { name: "L&T Finance", aum: 82000, gnpa: 2.4, roe: 13.2, cof: 8.2, pe: 15, disbGrowth: 20 },
];


// ─────────────────────────────────────────────────────────────
// 5. CO-LENDING PARTNERSHIPS
// Bank-NBFC tie-ups shown in the "Co-Lending" tab.
// ─────────────────────────────────────────────────────────────
export const CO_LENDING_DATA = [
  {
    bank: "HDFC Bank",
    nbfc: "Northern Arc Capital",
    segment: "MSME",
    volume: "₹2,400 Cr",
    status: "Active",
    startDate: "Q2 FY25",
    geography: "Pan-India (Rural Focus)",
  },
  {
    bank: "State Bank of India",
    nbfc: "Tata Capital",
    segment: "Home Loans",
    volume: "₹5,100 Cr",
    status: "Active",
    startDate: "Q1 FY25",
    geography: "Tier 1 & 2 Cities",
  },
  {
    bank: "ICICI Bank",
    nbfc: "Poonawalla Fincorp",
    segment: "Personal Loans",
    volume: "₹1,800 Cr",
    status: "Scaling",
    startDate: "Q3 FY25",
    geography: "Digital-First (Pan-India)",
  },
  {
    bank: "Bank of Baroda",
    nbfc: "Credgenics",
    segment: "MSME",
    volume: "₹900 Cr",
    status: "New",
    startDate: "Q4 FY25",
    geography: "Western India",
  },
  {
    bank: "Kotak Mahindra Bank",
    nbfc: "Shriram Finance",
    segment: "Commercial Vehicle",
    volume: "₹3,200 Cr",
    status: "Active",
    startDate: "Q1 FY24",
    geography: "Pan-India",
  },
  {
    bank: "Axis Bank",
    nbfc: "IIFL Finance",
    segment: "Gold Loans",
    volume: "₹1,500 Cr",
    status: "Paused",
    startDate: "Q2 FY25",
    geography: "South & West India",
  },
];


// ─────────────────────────────────────────────────────────────
// 6. ALERTS
// Active alerts shown in the alerts panel.
// Types: "critical", "warning", "info", "success"
// ─────────────────────────────────────────────────────────────
export const ALERTS = [
  {
    type: "critical",
    text: "Unsecured loan delinquencies spike 120bps QoQ — RBI data",
    time: "2h ago",
    source: "Reuters",
  },
  {
    type: "warning",
    text: "IIFL Finance downgraded to AA- with Watch outlook by CARE",
    time: "2d ago",
    source: "CARE Ratings",
  },
  {
    type: "info",
    text: "CGFMU coverage extended to ₹20L for MSME loans through March 2027",
    time: "3h ago",
    source: "Ministry of Finance",
  },
  {
    type: "success",
    text: "Bajaj Finance upgraded to AAA/Stable by CRISIL — first NBFC in 3 years",
    time: "18m ago",
    source: "CRISIL",
  },
  {
    type: "warning",
    text: "SEBI proposes tighter NCD listing norms — minimum issue ₹50 Cr",
    time: "5h ago",
    source: "SEBI",
  },
];


// ─────────────────────────────────────────────────────────────
// 7. GLOBAL INTELLIGENCE
// International indicators in the "Global" tab.
// ─────────────────────────────────────────────────────────────
export const GLOBAL_DATA = [
  {
    indicator: "US Fed Rate",
    value: "5.25%",
    trend: "Hold",
    signal: "Neutral",
    detail: "Fed signals data-dependent approach. No rate cuts before September at earliest. Inflation cooling but labor market remains tight.",
  },
  {
    indicator: "UK Base Rate",
    value: "4.75%",
    trend: "↓ Cut Expected",
    signal: "Dovish",
    detail: "BoE dovish pivot. Two more 25bps cuts expected in 2026. UK consumer lending showing signs of slowdown.",
  },
  {
    indicator: "US Consumer Credit",
    value: "$5.1T",
    trend: "+2.1% QoQ",
    signal: "Caution",
    detail: "US consumer credit growth accelerating. Credit card delinquencies at 3.2%, highest since 2012. Possible leading indicator for India digital lending cycle.",
  },
  {
    indicator: "Global Fintech Funding",
    value: "$8.2B",
    trend: "Q1 2026",
    signal: "Recovery",
    detail: "Global fintech VC funding up 40% YoY but still 60% below 2021 peak. India accounts for 12% of global fintech funding, up from 8% in 2023.",
  },
  {
    indicator: "India-US 10Y Spread",
    value: "285bps",
    trend: "Narrowing",
    signal: "Positive",
    detail: "Spread compression reflects improving India macro. FPI flows into Indian debt increasing. Positive for NBFC borrowing costs if sustained.",
  },
  {
    indicator: "DXY (Dollar Index)",
    value: "103.4",
    trend: "Weakening",
    signal: "Positive",
    detail: "Dollar weakness supports EM flows. Rupee stability at ₹83-84 range. Favorable for India capital inflows and NBFC fundraising.",
  },
];


// ─────────────────────────────────────────────────────────────
// 8. GOVT SCHEMES DATA
// CGFMU and other scheme tracking
// ─────────────────────────────────────────────────────────────
export const GOVT_SCHEMES = [
  {
    scheme: "CGFMU (Credit Guarantee for Micro Units)",
    coverage: "₹20L",
    guarantee: "85%",
    validTill: "March 2027",
    eligibleEntities: "All registered NBFCs & MFIs",
    totalApprovals: "₹1,24,000 Cr",
    impactOnCreditCost: "-45bps avg",
    status: "Extended",
  },
  {
    scheme: "ECLGS (Emergency Credit Line)",
    coverage: "₹5L Cr",
    guarantee: "100%",
    validTill: "Closed (claims till March 2026)",
    eligibleEntities: "Banks, NBFCs, MFIs",
    totalApprovals: "₹3,68,000 Cr",
    impactOnCreditCost: "-60bps avg",
    status: "Winding Down",
  },
  {
    scheme: "PSL Co-Lending (RBI Framework)",
    coverage: "No limit",
    guarantee: "N/A (Risk sharing 80:20)",
    validTill: "Ongoing",
    eligibleEntities: "All registered NBFCs",
    totalApprovals: "₹48,000 Cr",
    impactOnCreditCost: "-25bps avg (via lower CoF)",
    status: "Active & Growing",
  },
];


// ─────────────────────────────────────────────────────────────
// 9. FILTER OPTIONS
// Used for filtering news in the Live Feed tab.
// ─────────────────────────────────────────────────────────────
export const FILTER_OPTIONS = [
  "All",
  "Regulation",
  "Credit Rating",
  "Fundraise",
  "Partnership",
  "Risk Signal",
  "Policy",
  "AI & Tech",
];


// ─────────────────────────────────────────────────────────────
// 10. NAVIGATION TABS
// The main tabs shown in the sidebar.
// ─────────────────────────────────────────────────────────────
export const NAV_TABS = [
  { id: "feed", label: "Live Feed", icon: "Newspaper" },
  { id: "summary", label: "Daily Brief", icon: "FileText" },
  { id: "ratings", label: "Credit Ratings", icon: "TrendingUp" },
  { id: "metrics", label: "Financials", icon: "BarChart3" },
  { id: "colending", label: "Co-Lending", icon: "Handshake" },
  { id: "schemes", label: "Govt Schemes", icon: "Landmark" },
  { id: "global", label: "Global Intel", icon: "Globe" },
];
