# LendingIQ — Setup Guide (For Complete Beginners)

## What You're Building

A real-time CEO Intelligence Dashboard for NBFCs & Digital Lenders.
This guide will get it running on your computer in about 15 minutes.

---

## Step 1: Install Required Software

You need two things installed on your computer:

### A) Install Node.js
1. Go to https://nodejs.org
2. Download the **LTS** version (the green button)
3. Run the installer, click "Next" through everything
4. To verify it installed, open your terminal and type:
   ```
   node --version
   ```
   You should see something like `v20.x.x`

### B) Install VS Code
1. Go to https://code.visualstudio.com
2. Download and install it

---

## Step 2: Open the Project in VS Code

1. Open VS Code
2. Go to **File → Open Folder**
3. Navigate to the `lendingiq` folder and open it
4. You should see all the project files in the left sidebar

---

## Step 3: Install Dependencies

1. In VS Code, open the terminal: **Terminal → New Terminal** (or press Ctrl+`)
2. Type this command and press Enter:
   ```
   npm install
   ```
3. Wait for it to finish (may take 1-2 minutes)

---

## Step 4: Run the App

1. In the same terminal, type:
   ```
   npm run dev
   ```
2. You'll see a message like: `Ready on http://localhost:3000`
3. Open your web browser and go to: **http://localhost:3000**
4. You should see the LendingIQ dashboard!

---

## Step 5: Stop the App

- Press `Ctrl + C` in the terminal to stop the server
- To start again, just type `npm run dev`

---

## Project Structure (What Each File Does)

```
lendingiq/
│
├── SETUP-GUIDE.md          ← You are here
├── package.json            ← Lists all software dependencies
├── next.config.js          ← Next.js configuration
├── tailwind.config.js      ← Styling configuration
├── postcss.config.js       ← CSS processing (required by Tailwind)
│
├── app/                    ← All your application code
│   ├── layout.js           ← The outer shell (fonts, metadata)
│   ├── page.js             ← The main dashboard page
│   ├── globals.css         ← Global styles and colors
│   │
│   └── components/         ← Reusable UI pieces
│       ├── Header.jsx      ← Top bar with logo, live indicator
│       ├── Sidebar.jsx     ← Left navigation menu
│       ├── NewsFeed.jsx    ← Live news feed with filters
│       ├── NewsDetail.jsx  ← Intelligence brief panel
│       ├── DailyBrief.jsx  ← Boardroom-ready daily summary
│       ├── RatingTracker.jsx   ← Credit rating changes
│       ├── FinancialMetrics.jsx ← AUM, GNPA, ROE tables
│       ├── CoLendingTracker.jsx ← Bank-NBFC partnerships
│       ├── AlertsPanel.jsx     ← Risk alerts
│       └── GlobalIntel.jsx     ← US/UK/global indicators
│
└── data/                   ← Sample data (replace with real APIs later)
    └── mockData.js         ← All sample news, ratings, metrics
```

---

## How to Edit and Customize

### Change colors
Open `app/globals.css` and edit the CSS variables at the top.

### Change sample data
Open `data/mockData.js` and edit the news items, ratings, etc.

### Add a new news item
In `data/mockData.js`, copy an existing news object and change the values.

---

## Common Issues

**"npm is not recognized"**
→ Node.js didn't install properly. Restart your computer and try again.

**"Port 3000 is already in use"**
→ Another app is using that port. Run: `npm run dev -- -p 3001`
   Then go to http://localhost:3001

**White screen / errors**
→ Make sure you ran `npm install` first.
→ Check the terminal for error messages.

---

## Next Steps (After MVP is Running)

1. Connect real news APIs (Reuters, ET BFSI RSS feeds)
2. Add a Python backend (FastAPI) for data processing
3. Connect to a database (PostgreSQL)
4. Add the LLM intelligence layer (Claude API)
5. Deploy to the web (Vercel for frontend, AWS for backend)
