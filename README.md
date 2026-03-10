Users can follow this minimal path to run locally in minutes.

1. Clone the repository
git clone https://github.com/CitiVision/Founders_FinancialProjection_Dashboard.git
cd Founders_FinancialProjection_Dashboard

2. Install dependencies
Node.js 18+ recommended. From repo root:
npm install

3. Start development server
npm run dev
Open displayed URL, usually http://localhost:5173
App refreshes on change.

4. Build production bundle (optional)
npm run build
Output in dist/.

5. Preview production build (optional)
npm run preview
Confirm same behavior as production.

🛠️ Troubleshooting common issues
npm ERR! ERESOLVE → run npm install --legacy-peer-deps or use Node 18
vite config errors → ensure fresh state:
rm -rf node_modules package-lock.json
npm i
If hot reload fails: restart npm run dev

🧩 Key files for customization
App.jsx — main dashboard logic/UI
package.json — scripts/deps
vite.config.js — dev server
index.html / CSS in index.css (theme styles)

✅ Quick sanity checks
Verify dependencies installed: npm ls recharts
Confirm server is running: curl http://localhost:5173
UI should show:
Overview cards
Inputs with purple cards
Monthly table, Charts, YoY growth
