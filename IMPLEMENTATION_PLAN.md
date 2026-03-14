# Sentient Grid — Financial Dashboard Update Plan
### GitHub Copilot CLI Implementation Guide
**Repo:** `https://github.com/CitiVision/Founders_FinancialProjection_Dashboard.git`  
**Target branch:** `feature/dashboard-v3`  
**File being edited:** `src/App.jsx` (or root `App.jsx`)

---

## Pre-Flight: Repository Setup

Run these commands **first** before touching any code.

```bash
# 1. Clone the repo (if not already local)
git clone https://github.com/CitiVision/Founders_FinancialProjection_Dashboard.git
cd Founders_FinancialProjection_Dashboard

# 2. Create and switch to the new feature branch
git checkout -b feature/dashboard-v3

# 3. Confirm you're on the right branch
git branch

# 4. Verify the existing App.jsx is present
ls src/App.jsx   # or ls App.jsx depending on project structure
```

---

## Code Audit: What's Wrong Right Now

Before writing any new code, understand the **existing bugs and redundancies** Copilot must fix.

### Redundant / Dead Variables (Remove or Wire Up)

| Variable | Issue |
|---|---|
| `avgDealSize` | Appears in `useState` and Inputs UI but is **never used in any calculation**. Remove from inputs UI or wire into per-acre model. |
| `yoyGrowth` | Defined in `useState` but **never referenced inside `useMemo`**. Remove from state or use it to drive year-over-year growth in the model. |
| `pipelineConversion` (was `conversionRate`) | Used only to show a `pipeline` display number. The pipeline count does **not affect cash flow, revenue, or any financial output**. Must be wired into the hiring / lead generation logic. |

### Broken Logic: Sales Cycle Not Delaying Revenue

**Current bug:** The initial 3 clients are scheduled with only `avgPaymentLag`, ignoring `avgSalesCycle`. The correct delay before first revenue hits is:

```
totalDelay (months) = ceil((avgSalesCycle + avgPaymentLag) / 30)
```

So with `avgSalesCycle = 120 days` and `avgPaymentLag = 45 days`, revenue from the initial 3 clients must not appear before **Month 6** (165 days ÷ 30 ≈ 5.5 → Month 6).

### Broken Logic: Onboarding Sessions Count All Clients

**Current bug** (line ~230 in App.jsx):
```js
const totalSessions = clients * (sessionsPerClientPerMonth + onboardingSessionsPerClient);
```
This applies `onboardingSessionsPerClient` to **every client every month**, inflating session counts and over-staffing. The fix: onboarding sessions should only apply to **new clients** (delta from previous month).

---

## Phase 1 — Git Branching & File Scaffolding

```bash
# All work goes into feature/dashboard-v3 (already created above)
# Commit structure — one commit per phase for clean history:
# Phase 1: Scaffold new files
# Phase 2: Bug fixes
# Phase 3: Per-Acre model
# Phase 4: Scenario system
# Phase 5: Compare page
# Phase 6: UX overhaul of Inputs page
# Phase 7: Operating cost variables from doc
# Phase 8: Final wiring & cleanup
```

### Files to Create

```bash
# Create a constants file for the per-acre model defaults
touch src/constants/perAcreDefaults.js

# Create the scenario context/store
touch src/store/scenarios.js

# Create the Compare page component
touch src/pages/ComparePage.jsx

# Create the new Inputs page component (extracted from App.jsx)
touch src/pages/InputsPage.jsx
```

---

## Phase 2 — Bug Fixes (implement in this order)

### Fix 1: Sales Cycle Revenue Delay

**Location:** `App.jsx` inside `useMemo` — the `scheduleReceipt` logic for initial clients.

**Copilot prompt to use:**
```
In the useMemo block, find where initial clients are scheduled with scheduleReceipt.
Replace the paymentLagMonthsInitial calculation so that the delay is:
  Math.round((avgSalesCycle + avgPaymentLag) / 30)
instead of only avgPaymentLag / 30.
Apply the same combined delay to ALL new client receipt scheduling throughout the loop.
```

**Before (current code ~line 170):**
```js
const paymentLagMonthsInitial = Math.round((avgPaymentLag || 0) / 30);
if (initialClients > 0) {
  const monthlyInit = (revenuePerClientY1 || 0) / 12 * initialClients;
  for (let m = 1 + paymentLagMonthsInitial; m <= 60; m++) scheduleReceipt(m, monthlyInit);
}
```

**After:**
```js
// Combined pipeline delay: sales cycle + payment lag
const totalPipelineDelayMonths = Math.round(((avgSalesCycle || 0) + (avgPaymentLag || 0)) / 30);

if (initialClients > 0) {
  const monthlyInit = (revenuePerClientY1 || 0) / 12 * initialClients;
  for (let m = 1 + totalPipelineDelayMonths; m <= 60; m++) scheduleReceipt(m, monthlyInit);
}
```

Also update the delta clients scheduling (further in the loop):
```js
// OLD: const yearlyReceiptMonth = abs + paymentLagMonths;
// NEW:
const totalLagMonths = Math.round(((avgSalesCycle || 0) + (avgPaymentLag || 0)) / 30);
const yearlyReceiptMonth = abs + totalLagMonths;
const monthlyStart = abs + totalLagMonths;
```

### Fix 2: Onboarding Sessions — New Clients Only

**Location:** `App.jsx` inside the `for (let abs = 1; abs <= 60; abs++)` loop.

**Copilot prompt:**
```
Find the totalSessions calculation. Change it so onboardingSessionsPerClient
only applies to (clients - prevClients) i.e. newly added clients this month.
Regular sessionsPerClientPerMonth still applies to all clients.
```

**Before:**
```js
const totalSessions = clients * (sessionsPerClientPerMonth + onboardingSessionsPerClient);
```

**After:**
```js
const newClientsThisMonth = Math.max(0, clients - prevClients);
const totalSessions = 
  (clients * sessionsPerClientPerMonth) +
  (newClientsThisMonth * onboardingSessionsPerClient);
```

Make sure `prevClients` is set **after** the push at the end of the loop (it already is at line ~264: `prevClients = clients;`).

### Fix 3: Remove Dead Variables from State & UI

**Copilot prompt:**
```
Remove avgDealSize from the inputs UI card (keep it in state for now as it will be
used in the per-acre model). Remove yoyGrowth from state entirely — it is never
used in any calculation. Wire pipelineConversion into the lead generation rate
for the hiring model (see Phase 3).
```

---

## Phase 3 — Per-Acre Pricing Model (Scenario 1)

This is the **new pricing model** extracted from `MARKET_STRUCTURE_AND_ECONOMIC_FOUNDATIONS.docx`.

### Model Variables & Default Values

These must become editable inputs in the dashboard.

```js
// src/constants/perAcreDefaults.js
export const PER_ACRE_DEFAULTS = {
  // Pricing
  pricePerAcre: 10000,             // ₹/acre (Baseline tier)
  avgProjectSizeAcres: 35,         // acres per project
  
  // Market funnel
  totalSAMacres: 350000,           // Serviceable Addressable Market
  automationSuitablePct: 55,       // % of projects suitable for automation
  
  // Sales funnel (feeds cash flow timing)
  qualifiedLeadsPerBDPerYear: 600,
  leadToMeetingConvPct: 15,        // 15%
  meetingToDemoConvPct: 60,        // 60%
  demoToDealConvPct: 35,           // 35%
  // Overall: ~3% lead → deal (auto-calculated)
  projectsPerBDPerYear: 18,        // baseline
  
  // Delivery capacity
  hoursPerProject: 4,
  sessionsPerDay: 2,
  workingDaysPerMonth: 20,
  effectiveUtilisationPct: 40,     // %
  projectsPerSpecialistPerYear: 160,
  
  // Target market capture
  marketCapturePct: 1,             // 1% of SAM → ~100 projects
  
  // Team structure (at 1% capture baseline)
  numPlanningSpecialists: 1,
  numBDPersonnel: 6,
  numOperations: 2,
  numFounders: 2,
  
  // Pricing tiers (for UI toggle)
  // Entry: ₹5,000 | Baseline: ₹10,000 | Enterprise: ₹15,000 | Premium: ₹25,000
  activePricingTier: 'baseline',
};
```

### Revenue Calculation for Per-Acre Model

```js
// Revenue per project = pricePerAcre × avgProjectSizeAcres
// revenuePerProject = 10000 × 35 = ₹3,50,000 (₹3.5L)
// Projects this year = marketCapturePct/100 × totalSAMacres / avgProjectSizeAcres
// Monthly cash: distribute projects across the year accounting for sales cycle delay
```

### New Model Logic in useMemo

**Copilot prompt:**
```
Add a new branch to the revenue calculation inside useMemo.
If the active scenario uses pricingModel === 'perAcre':
  - revenuePerProject = pricePerAcre × avgProjectSizeAcres
  - annualProjects = (marketCapturePct / 100) × (totalSAMacres / avgProjectSizeAcres)
  - monthlyProjects = annualProjects / 12
  - monthlyRevenue = monthlyProjects × revenuePerProject
  - Apply the same totalPipelineDelayMonths from Fix 1 to delay when cash arrives
  - For year-over-year growth: use the 10-year model from the document:
    Y1:25 projects, Y2:60, Y3:120, Y4:200, Y5:350 (these are override-able)
```

### Pricing Tier Toggle UI

Add a visual tier selector to the per-acre inputs section:

```jsx
// Four pill buttons: Entry | Baseline | Enterprise | Premium
// Selecting a tier auto-populates pricePerAcre
const PRICE_TIERS = {
  entry: 5000,
  baseline: 10000,
  enterprise: 15000,
  premium: 25000,
};
```

---

## Phase 4 — Scenario Management System (Max 3 Scenarios)

### Data Structure

```js
// src/store/scenarios.js
export const SCENARIO_NAMES = {
  1: 'Scenario A — Per Acre',     // default: per-acre model from the doc
  2: 'Scenario B — Annual SaaS',  // default: current annual/monthly SKU model  
  3: 'Scenario C — Custom',       // blank/user-defined
};

// Each scenario = one full copy of the inputs state + a pricingModel flag
export const DEFAULT_SCENARIO = {
  pricingModel: 'perAcre',  // 'perAcre' | 'annualSaas' | 'monthlyRecurring'
  // ... all current inp fields
};
```

### State Shape in App.jsx

**Copilot prompt:**
```
Refactor the top-level state in App.jsx:
1. Replace the single `inp` state with `scenarios` array (max length 3)
   and `activeScenarioIndex` (0, 1, or 2).
2. Each scenario is an object: { id, name, pricingModel, inputs: {...} }
3. The `upd` function should update inputs on the active scenario only:
   setScenarios(prev => prev.map((s, i) => 
     i === activeScenarioIndex ? { ...s, inputs: { ...s.inputs, [k]: v } } : s
   ))
4. The useMemo model should run for the active scenario.
   Add a second useMemo that runs the model for ALL scenarios (needed for Compare page).
5. Add addScenario() — clone current active scenario, limited to 3 total.
6. Add removeScenario(index) — cannot remove if only 1 scenario exists.
7. Add renameScenario(index, newName).
```

### Scenario Switcher UI (Header)

Add to the header bar, next to the tab navigation:

```jsx
// Scenario tabs with + button
<div style={{ display: 'flex', gap: 4 }}>
  {scenarios.map((s, i) => (
    <button 
      key={i}
      onClick={() => setActiveScenarioIndex(i)}
      style={{ 
        background: activeScenarioIndex === i ? accentColor : 'transparent',
        // double-click to rename
      }}
    >
      {s.name}
    </button>
  ))}
  {scenarios.length < 3 && (
    <button onClick={addScenario} title="Add scenario">＋</button>
  )}
</div>
```

### Pricing Model Selector (in Inputs page)

At the TOP of the Inputs page, show a model selector:

```jsx
// Three cards, click to select:
// [Per Acre Pricing] [Annual SaaS / SKU] [Monthly Recurring]
// Selected card = active pricing model for this scenario
// Selecting a model shows/hides the relevant input groups below
```

---

## Phase 5 — Compare Page

### Route/Tab

Add `"compare"` to the tabs array:
```js
const TABS = ['overview', 'inputs', 'monthly', 'charts', 'compare'];
```

### ComparePage.jsx — Structure

The Compare page renders a side-by-side view of up to 3 scenarios.

**Section 1: Annual Summary Grid**

| Metric | Scenario A | Scenario B | Scenario C |
|---|---|---|---|
| Year 1 Revenue | ₹X | ₹X | ₹X |
| Year 2 Revenue | ... | ... | ... |
| Year 3 Revenue | ... | ... | ... |
| Year 4 Revenue | ... | ... | ... |
| Year 5 Revenue | ... | ... | ... |
| Cumulative Revenue | ... | ... | ... |
| Peak Employees | ... | ... | ... |
| End Capital (Y5) | ... | ... | ... |
| EBITDA % | ... | ... | ... |
| Yr5 Valuation | ... | ... | ... |

**Section 2: Side-by-Side Charts**

```jsx
// 1. Revenue by Year — grouped bar chart (3 bars per year)
// 2. Cash Flow over time — 3 overlapping line charts
// 3. Client / Project growth — 3 area charts overlaid
// 4. Expense evolution — 3 lines
```

**Copilot prompt:**
```
Create a ComparePage component that:
1. Accepts an array of { scenarioName, rows, kpi } objects (one per scenario)
2. Renders a comparison table with Yr1-Y5 revenue, cumulative revenue,
   peak employees, end capital, and EBITDA% for each scenario
3. Renders a grouped BarChart using recharts:
   - X axis: Y1, Y2, Y3, Y4, Y5
   - Each year has N bars (one per scenario), using different colors
4. Renders overlapping LineCharts for cash flow and client growth
5. Has a toggle: "Annual View" vs "Cumulative View"
6. Highlights the winning scenario (highest Y5 revenue) with a crown icon
```

---

## Phase 6 — Inputs Page UX Overhaul

### Design Principles (inspired by Maxio, ChartMogul, ProfitWell, Mosaic)

The current Inputs page is a grid of purple cards — visually dense and hard to navigate. The new design should follow these principles:

1. **Left sidebar navigation** — Section anchors: Pricing Model, Revenue, Pipeline, Team & Capacity, Expenses, Valuation Targets, Regional Mix
2. **Progressive disclosure** — Only show inputs relevant to the selected pricing model
3. **Inline live preview** — Show calculated output next to each input (e.g. "35 acres × ₹10,000 = ₹3.5L per project")
4. **Grouped sliders + number fields** — For percentage inputs (region mix, billing mix) use visual sliders
5. **Validation badges** — Green checkmark when % values sum to 100%, red warning if not
6. **Collapsible year-by-year overrides** — Collapsed by default, expand per year

### New Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [Pricing Model Selector: Per Acre | Annual SaaS | Monthly Recurring]   │
├──────────────┬──────────────────────────────────────────────────────────┤
│  LEFT NAV    │  MAIN CONTENT (scrollable)                                │
│              │                                                           │
│  ▸ Revenue   │  ┌──── REVENUE ENGINE ────────────────────────────┐       │
│  ▸ Pipeline  │  │  Price/Acre: [_____] × Avg Project: [____] acres│      │
│  ▸ Team      │  │  = ₹3.5L per project                [live calc] │      │
│  ▸ Expenses  │  │  Pricing tier: [Entry][Baseline][Enterprise][Pro]│     │
│  ▸ Valuation │  └────────────────────────────────────────────────┘       │
│  ▸ Regional  │                                                           │
│              │  ┌──── PIPELINE & TIMING ─────────────────────────┐       │
│              │  │  Avg Sales Cycle: [____] days                   │      │
│              │  │  Avg Payment Lag: [____] days                   │      │
│              │  │  Total delay to revenue: 165 days (5.5 mo) [🔒] │      │
│              │  │  Lead → Meeting: [15]% | Meeting → Demo: [60]%  │      │
│              │  │  Demo → Deal:    [35]% | Overall: ~3% [🔒]      │      │
│              │  └────────────────────────────────────────────────┘       │
└──────────────┴──────────────────────────────────────────────────────────┘
```

### Input Section Definitions

#### A. Revenue Engine (per pricing model)

**Per Acre model:**
- Price per acre (with tier toggle: Entry ₹5K / Baseline ₹10K / Enterprise ₹15K / Premium ₹25K)
- Average project size (acres)
- Calculated: Revenue per project (read-only)
- Initial number of projects (Y1)
- Year-by-year project targets: Y1–Y5 (expandable)
- Market capture % (SOM assumption)

**Annual SaaS / SKU model:**
- SKU names and annual prices
- SKU client mix %
- Billing mix per SKU (% annual vs % monthly)
- Per-year price overrides (collapsed by default)

**Monthly Recurring model:**
- Monthly price per client
- Churn rate %
- Net Revenue Retention %

#### B. Sales & Payment Pipeline

- Avg Sales Cycle (days) — *wired to delay revenue timing*
- Avg Payment Lag (days) — *wired to delay cash receipt*
- Total delay (auto-calculated, read-only with lock icon)
- Lead → Meeting conversion %
- Meeting → Demo conversion %
- Demo → Deal conversion %
- Overall conversion rate (auto-calculated, ~3%)
- Qualified leads per BD per year

#### C. Team & Capacity

- Initial employees
- Sessions per client per month (service sessions)
- Onboarding sessions per **new** client (one-time, shown with note: "only counted for new clients each month")
- Session capacity per employee
- New hire salary (per computational designer)
- New hire office cost (per person)

#### D. Operating Expenses

Extracted from the document — these replace the current sparse expense section:

```
BD Team Cost          ₹[____] /yr  (or use: numBD × ₹25L salary benchmark)
Planning Specialist   ₹[____] /yr  (or use: numSpecialists × ₹35L)
Operations Cost       ₹[____] /yr  (or use: numOps × ₹18L)
Founder Salaries      ₹[____] /yr  (or use: numFounders × ₹50L)
Cloud Infrastructure  ₹[____] /yr
Software / CRM        ₹[____] /yr
Workstation / Rent    ₹[____] /mo
API / Integration     ₹[____] /mo
```

Add a **"Use benchmarks"** toggle that auto-fills from the document's salary benchmarks based on team size.

#### E. Valuation & Returns

- Current valuation
- P/E ratio
- 5-year return target
- EBITDA % target
- Inflation %

#### F. Regional Mix

- Keep existing per-year region % inputs
- Add visual stacked bar showing the mix per year
- Keep FX rates

---

## Phase 7 — Operating Cost Variables from Document

### New State Variables to Add

**Copilot prompt:**
```
Add the following new fields to the scenarios inputs state object.
These come from the MARKET_STRUCTURE_AND_ECONOMIC_FOUNDATIONS.docx:
```

```js
// Team roles (headcount)
numBDPersonnel: 6,
numPlanningSpecialists: 1,
numOperationsStaff: 2,
numFounders: 2,

// Annual salary benchmarks (₹ per person per year)
salaryBD: 2500000,           // ₹25L
salaryPlanningSpecialist: 3500000, // ₹35L
salaryOperations: 1800000,   // ₹18L
salaryFounder: 5000000,      // ₹50L

// Annual infrastructure costs (₹)
cloudInfraAnnual: 4000000,   // ₹40L (1% capture baseline)
softwareCRMAnnual: 3000000,  // ₹30L

// Toggle: use headcount × salary, or override with flat amount
useHeadcountSalaryModel: true,
```

### Updated Monthly Burn Calculation

```js
// If useHeadcountSalaryModel:
const annualSalaries = 
  (numBDPersonnel        * salaryBD) +
  (numPlanningSpecialists * salaryPlanningSpecialist) +
  (numOperationsStaff    * salaryOperations) +
  (numFounders           * salaryFounder);
const monthlyBurnBase = 
  (annualSalaries / 12) +
  (cloudInfraAnnual / 12) +
  (softwareCRMAnnual / 12) +
  rent;            // workstation/rent stays monthly
// Else: use existing salaries flat input
```

---

## Phase 8 — Wire It All Up & Commit

### Final Copilot Prompts (in order)

```
1. "Wire the per-acre model into the main useMemo: when pricingModel === 'perAcre',
    compute revenue as (projectsThisYear * revenuePerProject) distributed monthly,
    with totalPipelineDelayMonths applied to all cash receipts."

2. "Wire the operating cost model: if useHeadcountSalaryModel is true,
    calculate monthlyBurn from headcount × salary benchmarks + infrastructure.
    If false, use the flat expense inputs."

3. "Run the useMemo model for all 3 scenarios simultaneously and expose the
    results as allScenarioResults for the Compare page."

4. "Update the Monthly Table to show a 'Pricing Model' column and a 
    'Projects This Month' column when in per-acre mode."

5. "Verify the onboarding sessions fix: in month 4 with 3 clients becoming 4,
    only 1 new client's onboarding sessions should be counted."
```

### Git Commits

```bash
# After Phase 2 (bug fixes)
git add -A
git commit -m "fix: sales cycle delay, onboarding sessions (new clients only), remove dead variables"

# After Phase 3 (per-acre model)
git add -A
git commit -m "feat: add per-acre pricing model with document defaults (Scenario 1)"

# After Phase 4 (scenarios)
git add -A
git commit -m "feat: scenario management system (max 3, switch/add/rename)"

# After Phase 5 (compare page)
git add -A
git commit -m "feat: Compare page with side-by-side scenario analysis"

# After Phase 6 (UX)
git add -A
git commit -m "refactor: Inputs page — sidebar nav, progressive disclosure, live calc preview"

# After Phase 7 (opex)
git add -A
git commit -m "feat: operating cost model from market structure doc (headcount × salary benchmarks)"

# After Phase 8 (final wiring)
git add -A
git commit -m "feat: wire all models, fix all calc dependencies, final integration"

# Push feature branch
git push -u origin feature/dashboard-v3
```

---

## Full Change Summary (Ordered by Priority)

| # | Change | Type | Complexity |
|---|---|---|---|
| 1 | Sales cycle + payment lag combined delay | **Bug Fix** | Low |
| 2 | Onboarding sessions — new clients only | **Bug Fix** | Low |
| 3 | Remove dead `yoyGrowth` variable | **Cleanup** | Low |
| 4 | Remove `avgDealSize` from display (wire to per-acre) | **Cleanup** | Low |
| 5 | Wire `pipelineConversion` into hiring/capacity model | **Enhancement** | Medium |
| 6 | Per-acre pricing model (full new revenue engine) | **New Feature** | High |
| 7 | Pricing tier selector (Entry/Baseline/Enterprise/Premium) | **New Feature** | Low |
| 8 | Scenario state refactor (max 3, switcher in header) | **New Feature** | High |
| 9 | Pricing model selector per scenario | **New Feature** | Medium |
| 10 | Compare page — table + grouped charts | **New Feature** | High |
| 11 | Inputs page sidebar nav + progressive disclosure | **UX Refactor** | High |
| 12 | Inline live calculations next to inputs | **UX Enhancement** | Medium |
| 13 | Headcount-based salary model (from doc) | **New Feature** | Medium |
| 14 | New expense variables: cloud infra, CRM, specialist salaries | **New Feature** | Low |
| 15 | "Use benchmarks" toggle for salary auto-fill | **New Feature** | Low |

---

## Copilot CLI Quick Reference

Use these prompts directly in `gh copilot suggest` or in the Copilot chat:

```bash
# Stage a specific change suggestion
gh copilot suggest "Fix the sales cycle delay in the useMemo scheduleReceipt logic so it uses avgSalesCycle + avgPaymentLag combined"

# Ask Copilot to explain what a section does before editing
gh copilot explain "What does the receipts schedule pattern do in this useMemo block?"

# Use inline Copilot in VS Code terminal
# Just open App.jsx, navigate to the relevant section, and use Ctrl+I (or Cmd+I on Mac)
# to open inline Copilot with the prompts from this document
```

---

## Testing Checklist

Before pushing the branch, verify these scenarios manually:

- [ ] With `avgSalesCycle = 120, avgPaymentLag = 45`: Month 1–5 shows ₹0 revenue from initial 3 clients; revenue appears from Month 6
- [ ] Month where clients go from 3→4: only 1 client's worth of onboarding sessions counted that month
- [ ] Per-acre model: 35 acres × ₹10,000 = ₹3.5L per project; 25 projects in Y1 = ₹87.5L Y1 revenue
- [ ] Switching between scenarios in header updates all charts and tables
- [ ] Compare page shows correct Y1–Y5 revenue for each scenario
- [ ] Region % validation shows green ✓ when they sum to 100%
- [ ] SKU % validation shows green ✓ when they sum to 100%
- [ ] Adding a 4th scenario is blocked (button disappears at 3)
- [ ] Inputs page sections correctly show/hide based on selected pricing model

---

*End of implementation plan.*
