import { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart, ReferenceLine,
  PieChart, Pie, Cell
} from "recharts";
import { PRICE_TIERS } from './constants/perAcreDefaults.js';
import ComparePage from './pages/ComparePage.jsx';

/* ────────────────────────────────────────────────
   FORMATTERS
──────────────────────────────────────────────── */
const fmtINR = (n) => {
  if (n === undefined || n === null || isNaN(n)) return "₹0";
  const abs = Math.abs(n); const sign = n < 0 ? "-" : "";
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(2)}L`;
  if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(1)}K`;
  return `${sign}₹${Math.round(abs)}`;
};
const fmtNum = (n) => isNaN(n) ? "0" : Math.round(n).toLocaleString("en-IN");
const fmtFX  = (n, sym) => `${sym}${Number(n).toFixed(0).toLocaleString()}`;

/* ────────────────────────────────────────────────
   THEME
──────────────────────────────────────────────── */
const C = {
  bg:     "#F9FAFB",
  bgCard: "#FFFFFF",
  bgHov:  "#F3F4F6",
  border: "#D1D5DB",
  accent: "#d4a843",
  green:  "#38c96a",
  red:    "#e84545",
  blue:   "#4b9cf5",
  purple: "#9b6dff",
  teal:   "#2dd4bf",
  muted:  "#374151",
  text:   "#111827",
  dim:    "#6B7280",
};

const TT = {
  backgroundColor: "#ffffff",
  border: "1px solid #D1D5DB",
  borderRadius: "6px",
  color: "#111827",
  fontSize: "14px",
};

/* ────────────────────────────────────────────────
   UI ATOMS
──────────────────────────────────────────────── */
const Field = ({ label, id, value, onChange, prefix, suffix, hint, readOnly, labelColor }) => {
  const computedLabelColor = labelColor || "inherit";
  return (
    <div style={{ marginBottom: "11px", color: computedLabelColor }}>
      <label style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", color: computedLabelColor, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "4px" }}>
        <span>{label}</span>
        {hint && <span style={{ color: 'inherit' }}>{hint}</span>}
      </label>
      <div style={{ display: "flex", alignItems: "center", background: "#FFFFFF", border: `1px solid ${C.border}`, borderRadius: "5px", overflow: "hidden" }}>
        {prefix && <span style={{ padding: "5px 8px", color: C.accent, fontSize: "17px", borderRight: `1px solid ${C.border}`, background: C.bgHov, whiteSpace: "nowrap" }}>{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={e => !readOnly && onChange(id, e.target.value)}
          readOnly={readOnly}
          style={{ flex: 1, background: "#ffffff", border: "none", outline: "none", color: C.text, padding: "5px 8px", fontSize: "17px", fontFamily: "monospace", minWidth: 0, borderRadius: "0" }}
        />
        {suffix && <span style={{ padding: "5px 8px", color: 'inherit', fontSize: "16px", borderLeft: `1px solid ${C.border}`, background: C.bgHov, whiteSpace: "nowrap" }}>{suffix}</span>}
      </div>
    </div>
  );
};

const Card = ({ children, style = {}, variant }) => {
  const isPurple = variant === "purple";
  return (
    <div style={{
      background: isPurple ? "linear-gradient(135deg, #7C3AED, #A855F7)" : C.bgCard,
      border: isPurple ? "none" : `1px solid ${C.border}`,
      borderRadius: isPurple ? "16px" : "10px",
      boxShadow: isPurple ? "0 8px 20px rgba(0,0,0,0.1)" : "none",
      padding: "18px",
      color: isPurple ? "#FFFFFF" : C.text,
      ...style
    }}>
      {children}
    </div>
  );
};

const Sec = ({ children, color }) => (
  <div style={{ fontSize: "15px", color: color || C.accent, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "monospace", marginBottom: "14px", borderBottom: `1px solid ${C.border}`, paddingBottom: "7px" }}>
    {children}
  </div>
);

const KPI = ({ label, value, sub, color = C.accent }) => (
  <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: "9px", padding: "13px 17px", flex: 1, minWidth: "145px" }}>
    <div style={{ fontSize: "15px", color: C.muted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "6px" }}>{label}</div>
    <div style={{ fontSize: "24px", fontWeight: 700, color, fontFamily: "monospace", lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: "15px", color: C.muted, marginTop: "5px" }}>{sub}</div>}
  </div>
);

const TabBtn = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{ background: active ? C.bgHov : "transparent", border: active ? `1px solid ${C.border}` : "1px solid transparent", color: active ? C.accent : C.muted, padding: "7px 13px", borderRadius: "6px", cursor: "pointer", fontSize: "17px", fontFamily: "monospace", whiteSpace: "nowrap" }}>
    {children}
  </button>
);

const Badge = ({ children, color = C.green }) => (
  <span style={{ background: `${color}22`, color, fontSize: "9px", padding: "2px 7px", borderRadius: "3px", fontFamily: "monospace", letterSpacing: "0.05em", fontWeight: 600 }}>
    {children}
  </span>
);

/* ────────────────────────────────────────────────
   SCROLLABLE TABLE
──────────────────────────────────────────────── */
const DataTable = ({ cols, rows }) => (
  <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "500px" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "16px", fontFamily: "monospace" }}>
      <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
        <tr style={{ background: C.bgHov }}>
          {cols.map(c => (
            <th key={c.key} style={{ padding: "8px 11px", textAlign: "right", color: C.muted, borderBottom: `1px solid ${C.border}`, fontSize: "15px", letterSpacing: "0.07em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} style={{ background: row._launch ? `${C.accent}10` : i % 2 === 0 ? C.bg : C.bgCard, borderLeft: row._launch ? `3px solid ${C.accent}` : "3px solid transparent" }}>
            {cols.map(c => {
              const val = row[c.key];
              const col = c.color ? c.color(val, row) : C.text;
              return (
                <td key={c.key} style={{ padding: "5px 11px", textAlign: "right", color: col, whiteSpace: "nowrap" }}>
                  {c.format ? c.format(val, row) : val}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ════════════════════════════════════════════════
   DEFAULT INPUTS
════════════════════════════════════════════════ */
const DEFAULT_INP = {
  ebitdaPct:          30,
  valuationNow:       100000000,
  pe:                 20,
  fiveYearReturn:     5,
  avgDealSize:        5000000,
  conversionRate: 15,
  avgSalesCycle: 120,
  avgPaymentLag: 45,
  initialClients:     3,
  revenuePerClientY1: 5000000,
  clientGrowthQtr:    25,
  initialInvestment:  1200000,
  initialEmployees:   3,
  platformLaunchMonth:   1,
  launchBoostMultiplier: 1.5,
  indiaPct:       40,
  mePct:          25,
  europePct:      20,
  australiaPct:   15,
  indiaPctY2:     40,
  mePctY2:        25,
  europePctY2:    20,
  australiaPctY2: 15,
  indiaPctY3:     40,
  mePctY3:        25,
  europePctY3:    20,
  australiaPctY3: 15,
  indiaPctY4:     40,
  mePctY4:        25,
  europePctY4:    20,
  australiaPctY4: 15,
  indiaPctY5:     40,
  mePctY5:        25,
  europePctY5:    20,
  australiaPctY5: 15,
  aedToInr: 22.5,
  eurToInr: 90.0,
  audToInr: 55.0,
  sessionsPerClientPerMonth:   4,
  sessionCapacityPerEmployee:  20,
  onboardingSessionsPerClient: 2,
  salaryPerDesigner:           50000,
  officePerDesigner:            5000,
  salaries:   200000,
  rent:        30000,
  stackCosts:  50000,
  apiCosts:    20000,
  skuDeveloper:    1000000,
  skuDesigner:      800000,
  skuTrial:         200000,
  skuConsulting:   1500000,
  skuDeveloperY1:  1000000,
  skuDesignerY1:    800000,
  skuTrialY1:       200000,
  skuConsultingY1: 1500000,
  skuDeveloperY2:  1000000,
  skuDesignerY2:    800000,
  skuTrialY2:       200000,
  skuConsultingY2: 1500000,
  skuDeveloperY3:  1000000,
  skuDesignerY3:    800000,
  skuTrialY3:       200000,
  skuConsultingY3: 1500000,
  skuDeveloperY4:  1000000,
  skuDesignerY4:    800000,
  skuTrialY4:       200000,
  skuConsultingY4: 1500000,
  skuDeveloperY5:  1000000,
  skuDesignerY5:    800000,
  skuTrialY5:       200000,
  skuConsultingY5: 1500000,
  skuDeveloperY2_month: 0,
  skuDesignerY2_month:  0,
  skuTrialY2_month:     0,
  skuConsultingY2_month:0,
  skuDeveloperY3_month: 0,
  skuDesignerY3_month:  0,
  skuTrialY3_month:     0,
  skuConsultingY3_month:0,
  skuDeveloperY4_month: 0,
  skuDesignerY4_month:  0,
  skuTrialY4_month:     0,
  skuConsultingY4_month:0,
  skuDeveloperY5_month: 0,
  skuDesignerY5_month:  0,
  skuTrialY5_month:     0,
  skuConsultingY5_month:0,
  skuDeveloperY2_yearPct: 100, skuDeveloperY2_monthPct: 0,
  skuDesignerY2_yearPct:  100, skuDesignerY2_monthPct:  0,
  skuTrialY2_yearPct:     100, skuTrialY2_monthPct:     0,
  skuConsultingY2_yearPct:100, skuConsultingY2_monthPct: 0,
  skuDeveloperY3_yearPct: 100, skuDeveloperY3_monthPct: 0,
  skuDesignerY3_yearPct:  100, skuDesignerY3_monthPct:  0,
  skuTrialY3_yearPct:     100, skuTrialY3_monthPct:     0,
  skuConsultingY3_yearPct:100, skuConsultingY3_monthPct: 0,
  skuDeveloperY4_yearPct: 100, skuDeveloperY4_monthPct: 0,
  skuDesignerY4_yearPct:  100, skuDesignerY4_monthPct:  0,
  skuTrialY4_yearPct:     100, skuTrialY4_monthPct:     0,
  skuConsultingY4_yearPct:100, skuConsultingY4_monthPct: 0,
  skuDeveloperY5_yearPct: 100, skuDeveloperY5_monthPct: 0,
  skuDesignerY5_yearPct:  100, skuDesignerY5_monthPct:  0,
  skuTrialY5_yearPct:     100, skuTrialY5_monthPct:     0,
  skuConsultingY5_yearPct:100, skuConsultingY5_monthPct: 0,
  skuDevPct:   30,
  skuDesPct:   25,
  skuTrialPct: 20,
  skuConsPct:  25,
  inflation: 5,
  // Per-acre pricing model
  pricingModel: 'annualSaas',
  pricePerAcre: 10000,
  avgProjectSizeAcres: 35,
  totalSAMacres: 350000,
  marketCapturePct: 1,
  perAcreProjectsY1: 25,
  perAcreProjectsY2: 60,
  perAcreProjectsY3: 120,
  perAcreProjectsY4: 200,
  perAcreProjectsY5: 350,
  activePricingTier: 'baseline',
  // Operating cost variables
  numBDPersonnel: 6,
  numPlanningSpecialists: 1,
  numOperationsStaff: 2,
  numFounders: 2,
  salaryBD: 2500000,
  salaryPlanningSpecialist: 3500000,
  salaryOperations: 1800000,
  salaryFounder: 5000000,
  cloudInfraAnnual: 4000000,
  softwareCRMAnnual: 3000000,
  useHeadcountSalaryModel: false,
};

/* ════════════════════════════════════════════════
   CORE MODEL FUNCTION
════════════════════════════════════════════════ */
function runModel(inp) {
  const {
    initialClients, revenuePerClientY1, clientGrowthQtr,
    initialInvestment, initialEmployees,
    platformLaunchMonth, launchBoostMultiplier,
    indiaPct, mePct, europePct, australiaPct,
    indiaPctY2, mePctY2, europePctY2, australiaPctY2,
    indiaPctY3, mePctY3, europePctY3, australiaPctY3,
    indiaPctY4, mePctY4, europePctY4, australiaPctY4,
    indiaPctY5, mePctY5, europePctY5, australiaPctY5,
    aedToInr, eurToInr, audToInr,
    sessionsPerClientPerMonth, sessionCapacityPerEmployee, onboardingSessionsPerClient,
    salaryPerDesigner, officePerDesigner,
    salaries, rent, stackCosts, apiCosts,
    skuDevPct, skuDesPct, skuTrialPct, skuConsPct,
    skuDeveloper, skuDesigner, skuTrial, skuConsulting,
    skuDeveloperY2, skuDesignerY2, skuTrialY2, skuConsultingY2,
    skuDeveloperY3, skuDesignerY3, skuTrialY3, skuConsultingY3,
    skuDeveloperY4, skuDesignerY4, skuTrialY4, skuConsultingY4,
    skuDeveloperY5, skuDesignerY5, skuTrialY5, skuConsultingY5,
    conversionRate, avgSalesCycle, avgPaymentLag, ebitdaPct, pe, valuationNow, fiveYearReturn, inflation,
    pricingModel, pricePerAcre, avgProjectSizeAcres,
    perAcreProjectsY1, perAcreProjectsY2, perAcreProjectsY3, perAcreProjectsY4, perAcreProjectsY5,
    numBDPersonnel, numPlanningSpecialists, numOperationsStaff, numFounders,
    salaryBD, salaryPlanningSpecialist, salaryOperations, salaryFounder,
    cloudInfraAnnual, softwareCRMAnnual, useHeadcountSalaryModel,
  } = inp;

  const launchAbsMonth = 12 + Math.max(1, Math.min(12, Math.round(platformLaunchMonth)));

  // SKU prices with inflation
  const skuPrices = {};
  for (let y = 1; y <= 5; y++) {
    const base = y === 1 ? 1 : (1 + inflation / 100) ** (y - 1);
    skuPrices[y] = {
      developer: skuDeveloper * base,
      designer: skuDesigner * base,
      trial: skuTrial * base,
      consulting: skuConsulting * base,
    };
    if (y >= 2) {
      skuPrices[y].developer = skuDeveloperY2 || skuPrices[y].developer;
      skuPrices[y].designer = skuDesignerY2 || skuPrices[y].designer;
      skuPrices[y].trial = skuTrialY2 || skuPrices[y].trial;
      skuPrices[y].consulting = skuConsultingY2 || skuPrices[y].consulting;
      if (y >= 3) {
        skuPrices[y].developer = skuDeveloperY3 || skuPrices[y].developer;
        skuPrices[y].designer = skuDesignerY3 || skuPrices[y].designer;
        skuPrices[y].trial = skuTrialY3 || skuPrices[y].trial;
        skuPrices[y].consulting = skuConsultingY3 || skuPrices[y].consulting;
      }
      if (y >= 4) {
        skuPrices[y].developer = skuDeveloperY4 || skuPrices[y].developer;
        skuPrices[y].designer = skuDesignerY4 || skuPrices[y].designer;
        skuPrices[y].trial = skuTrialY4 || skuPrices[y].trial;
        skuPrices[y].consulting = skuConsultingY4 || skuPrices[y].consulting;
      }
      if (y >= 5) {
        skuPrices[y].developer = skuDeveloperY5 || skuPrices[y].developer;
        skuPrices[y].designer = skuDesignerY5 || skuPrices[y].designer;
        skuPrices[y].trial = skuTrialY5 || skuPrices[y].trial;
        skuPrices[y].consulting = skuConsultingY5 || skuPrices[y].consulting;
      }
    }
  }

  let clients = initialClients;
  let capital = initialInvestment;
  let totalEmp = initialEmployees;
  let launchApplied = false;

  const receipts = {};
  const scheduleReceipt = (m, amt) => {
    if (m < 1 || m > 60) return;
    receipts[m] = (receipts[m] || 0) + amt;
  };

  // Fix 1: Include both sales cycle and payment lag in initial scheduling delay
  const totalPipelineDelayMonths = Math.round(((avgSalesCycle || 0) + (avgPaymentLag || 0)) / 30);
  if (initialClients > 0) {
    const monthlyInit = (revenuePerClientY1 || 0) / 12 * initialClients;
    for (let m = 1 + totalPipelineDelayMonths; m <= 60; m++) scheduleReceipt(m, monthlyInit);
  }
  let prevClients = 0;

  const rows = [];

  for (let abs = 1; abs <= 60; abs++) {
    const year = Math.ceil(abs / 12);
    const miy = ((abs - 1) % 12) + 1;
    const isLaunch = abs === launchAbsMonth;

    if (abs > 1 && (abs - 1) % 3 === 0) {
      clients = Math.round(clients * (1 + clientGrowthQtr / 100));
    }
    if (isLaunch && !launchApplied) {
      clients = Math.round(clients * launchBoostMultiplier);
      launchApplied = true;
    }

    const isPostLaunch = abs >= launchAbsMonth;
    const pipeline = Math.round(clients / (conversionRate / 100));

    let indiaPctVal, mePctVal, europePctVal, australiaPctVal;
    if (year === 1) {
      indiaPctVal = indiaPct; mePctVal = mePct; europePctVal = europePct; australiaPctVal = australiaPct;
    } else if (year === 2) {
      indiaPctVal = indiaPctY2; mePctVal = mePctY2; europePctVal = europePctY2; australiaPctVal = australiaPctY2;
    } else if (year === 3) {
      indiaPctVal = indiaPctY3; mePctVal = mePctY3; europePctVal = europePctY3; australiaPctVal = australiaPctY3;
    } else if (year === 4) {
      indiaPctVal = indiaPctY4; mePctVal = mePctY4; europePctVal = europePctY4; australiaPctVal = australiaPctY4;
    } else {
      indiaPctVal = indiaPctY5; mePctVal = mePctY5; europePctVal = europePctY5; australiaPctVal = australiaPctY5;
    }

    const indiaC = Math.round(clients * indiaPctVal / 100);
    const meC = Math.round(clients * mePctVal / 100);
    const europeC = Math.round(clients * europePctVal / 100);
    const ausC = clients - indiaC - meC - europeC;

    // Compute total annual revenue using SKU mixes and billing mixes
    let totalRevenueAnnual = 0;
    let skuRevenueBreakdown = { developer: 0, designer: 0, trial: 0, consulting: 0 };
    if (isPostLaunch) {
      const skus = [
        { id: 'developer', pct: skuDevPct, yearlyPrice: skuPrices[year].developer, monthlyPrice: inp[`skuDeveloperY${year}_month`] },
        { id: 'designer',  pct: skuDesPct,  yearlyPrice: skuPrices[year].designer,  monthlyPrice: inp[`skuDesignerY${year}_month`]  },
        { id: 'trial',     pct: skuTrialPct, yearlyPrice: skuPrices[year].trial,     monthlyPrice: inp[`skuTrialY${year}_month`]     },
        { id: 'consulting',pct: skuConsPct,  yearlyPrice: skuPrices[year].consulting,monthlyPrice: inp[`skuConsultingY${year}_month`]  },
      ];

      for (const s of skus) {
        const skuClients = clients * (s.pct / 100);
        const yearPctKey = `sku${s.id.charAt(0).toUpperCase() + s.id.slice(1)}Y${year}_yearPct`;
        const monthPctKey = `sku${s.id.charAt(0).toUpperCase() + s.id.slice(1)}Y${year}_monthPct`;
        const yearlyMix = Number(inp[yearPctKey] ?? 100);
        const monthlyMix = Number(inp[monthPctKey] ?? (100 - yearlyMix));
        const yearlyClients = skuClients * (yearlyMix / 100);
        const monthlyClients = skuClients * (monthlyMix / 100);
        const yearlyPrice = s.yearlyPrice || 0;
        const monthlyPrice = (s.monthlyPrice && s.monthlyPrice > 0) ? s.monthlyPrice : (yearlyPrice / 12 || 0);
        const yearlyRev = yearlyClients * yearlyPrice;
        const monthlyRev = monthlyClients * monthlyPrice * 12;
        const skuRev = yearlyRev + monthlyRev;
        skuRevenueBreakdown[s.id] = skuRev;
        totalRevenueAnnual += skuRev;
      }
    } else {
      totalRevenueAnnual = revenuePerClientY1 * clients;
    }

    // Phase 3: Per-acre pricing model
    let revenue, mrr;
    if (pricingModel === 'perAcre') {
      const revenuePerProject = (pricePerAcre || 0) * (avgProjectSizeAcres || 0);
      const projectTargets = [0, perAcreProjectsY1, perAcreProjectsY2, perAcreProjectsY3, perAcreProjectsY4, perAcreProjectsY5];
      const projectsThisYear = projectTargets[year] || 0;
      const annualRevenue = projectsThisYear * revenuePerProject;
      revenue = annualRevenue;
      mrr = annualRevenue / 12;
    } else {
      revenue = totalRevenueAnnual;
      mrr = totalRevenueAnnual / 12;
    }

    // Fix 1: Include both sales cycle and payment lag for delta client scheduling
    const totalLagMonths = Math.round(((avgSalesCycle || 0) + (avgPaymentLag || 0)) / 30);
    const deltaSigned = Math.max(0, clients - prevClients);
    if (deltaSigned > 0) {
      const skusNew = [
        { id: 'developer', pct: skuDevPct, yearlyPrice: skuPrices[year].developer, monthlyPrice: inp[`skuDeveloperY${year}_month`] },
        { id: 'designer',  pct: skuDesPct,  yearlyPrice: skuPrices[year].designer,  monthlyPrice: inp[`skuDesignerY${year}_month`]  },
        { id: 'trial',     pct: skuTrialPct, yearlyPrice: skuPrices[year].trial,     monthlyPrice: inp[`skuTrialY${year}_month`]     },
        { id: 'consulting',pct: skuConsPct,  yearlyPrice: skuPrices[year].consulting,monthlyPrice: inp[`skuConsultingY${year}_month`]  },
      ];
      for (const s of skusNew) {
        const skuNewCount = deltaSigned * (s.pct / 100);
        const yearPctKey = `sku${s.id.charAt(0).toUpperCase() + s.id.slice(1)}Y${year}_yearPct`;
        const monthPctKey = `sku${s.id.charAt(0).toUpperCase() + s.id.slice(1)}Y${year}_monthPct`;
        const yearlyMix = Number(inp[yearPctKey] ?? 100);
        const monthlyMix = Number(inp[monthPctKey] ?? (100 - yearlyMix));
        const yearlyClients = skuNewCount * (yearlyMix / 100);
        const monthlyClients = skuNewCount * (monthlyMix / 100);
        const yearlyPrice = s.yearlyPrice || 0;
        const monthlyPrice = (s.monthlyPrice && s.monthlyPrice > 0) ? s.monthlyPrice : (yearlyPrice / 12 || 0);
        const yearlyReceiptMonth = abs + totalLagMonths;
        scheduleReceipt(yearlyReceiptMonth, yearlyClients * yearlyPrice);
        const monthlyStart = abs + totalLagMonths;
        for (let m = monthlyStart; m <= 60; m++) scheduleReceipt(m, monthlyClients * monthlyPrice);
      }
    }

    const cashReceived = receipts[abs] || 0;

    const indiaINR = clients > 0 ? revenue * (indiaC / Math.max(1, clients)) : 0;
    const meINR = clients > 0 ? revenue * (meC / Math.max(1, clients)) : 0;
    const europeINR = clients > 0 ? revenue * (europeC / Math.max(1, clients)) : 0;
    const ausINR = clients > 0 ? revenue * (ausC / Math.max(1, clients)) : 0;
    const meAED = aedToInr > 0 ? meINR / aedToInr : 0;
    const europeEUR = eurToInr > 0 ? europeINR / eurToInr : 0;
    const ausAUD = audToInr > 0 ? ausINR / audToInr : 0;

    // Fix 2: Onboarding sessions only for new clients
    const newClientsThisMonth = Math.max(0, clients - prevClients);
    const totalSessions =
      (clients * sessionsPerClientPerMonth) +
      (newClientsThisMonth * onboardingSessionsPerClient);

    const reqEmp = Math.ceil(totalSessions / Math.max(1, sessionCapacityPerEmployee));
    const newHires = Math.max(0, reqEmp - totalEmp);
    totalEmp = Math.max(totalEmp, reqEmp);
    const empCapacity = totalEmp * sessionCapacityPerEmployee;
    const extraEmp = Math.max(0, totalEmp - initialEmployees);

    // Phase 7: Operating cost variables
    let salaryExp, officeExp, totalExp;
    if (useHeadcountSalaryModel) {
      const annualSalaries =
        ((numBDPersonnel || 0) * (salaryBD || 0)) +
        ((numPlanningSpecialists || 0) * (salaryPlanningSpecialist || 0)) +
        ((numOperationsStaff || 0) * (salaryOperations || 0)) +
        ((numFounders || 0) * (salaryFounder || 0));
      const monthlyBurnBase = (annualSalaries / 12) + ((cloudInfraAnnual || 0) / 12) + ((softwareCRMAnnual || 0) / 12) + (rent || 0);
      salaryExp = monthlyBurnBase;
      officeExp = 0;
      totalExp = monthlyBurnBase;
    } else {
      salaryExp = salaries + extraEmp * salaryPerDesigner;
      officeExp = rent + extraEmp * officePerDesigner;
      totalExp = salaryExp + officeExp + stackCosts + apiCosts;
    }

    const net = (cashReceived || 0) - totalExp;
    capital += net;

    rows.push({
      abs, year, miy,
      label: `Y${year}M${String(miy).padStart(2, "0")}`,
      isPostLaunch, _launch: isLaunch,
      clients, pipeline,
      indiaC, meC, europeC, ausC,
      sessionsPerClient: sessionsPerClientPerMonth + onboardingSessionsPerClient,
      totalSessions, empCapacity, reqEmp, totalEmp, newHires,
      salaryExp, officeExp, totalExp,
      indiaINR, meINR, europeINR, ausINR,
      meAED, europeEUR, ausAUD,
      revenue, mrr: mrr ?? revenue, net, capital,
      pricingModel,
      devRev: isPostLaunch ? skuRevenueBreakdown.developer : 0,
      desRev: isPostLaunch ? skuRevenueBreakdown.designer : 0,
      trialRev: isPostLaunch ? skuRevenueBreakdown.trial : 0,
      consRev: isPostLaunch ? skuRevenueBreakdown.consulting : 0,
    });
    prevClients = clients;
  }

  // Top-level KPIs
  const yr5Val = valuationNow * fiveYearReturn;
  const yr5EBITDA = yr5Val / pe;
  const yr5Rev = yr5EBITDA / (ebitdaPct / 100);
  const yr1Total = rows.filter(r => r.year === 1).reduce((s, r) => s + r.revenue, 0);
  const yr5Total = rows.filter(r => r.year === 5).reduce((s, r) => s + r.revenue, 0);
  const lastRow = rows[59];
  const maxEmp = Math.max(...rows.map(r => r.totalEmp));
  const totalHires = rows.reduce((s, r) => s + r.newHires, 0);
  const monthlyBurn = inp.useHeadcountSalaryModel
    ? (((inp.numBDPersonnel || 0) * (inp.salaryBD || 0) + (inp.numPlanningSpecialists || 0) * (inp.salaryPlanningSpecialist || 0) + (inp.numOperationsStaff || 0) * (inp.salaryOperations || 0) + (inp.numFounders || 0) * (inp.salaryFounder || 0)) / 12) + ((inp.cloudInfraAnnual || 0) / 12) + ((inp.softwareCRMAnnual || 0) / 12) + (inp.rent || 0)
    : inp.salaries + inp.rent + inp.stackCosts + inp.apiCosts;
  const runway = monthlyBurn > 0 ? Math.floor(inp.initialInvestment / monthlyBurn) : 99;

  const postLaunchRows = rows.filter(r => r.isPostLaunch);
  const avgSessionsPerClient = postLaunchRows.length > 0
    ? postLaunchRows.reduce((s, r) => s + r.sessionsPerClient, 0) / postLaunchRows.length
    : 0;

  return { rows, kpi: { yr5Val, yr5EBITDA, yr5Rev, yr1Total, yr5Total, lastRow, maxEmp, totalHires, monthlyBurn, runway, launchAbsMonth, avgSessionsPerClient } };
}

/* ════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════ */
export default function SentientGrid() {

  const [scenarios, setScenarios] = useState([{ name: 'Scenario A', inputs: { ...DEFAULT_INP } }]);
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);
  const inp = scenarios[activeScenarioIdx].inputs;

  const upd = (k, v) => {
    const val = parseFloat(v) || 0;
    setScenarios(prev => prev.map((s, i) => {
      if (i !== activeScenarioIdx) return s;
      const next = { ...s.inputs, [k]: val };
      try {
        if (k.endsWith('yearPct')) {
          const other = k.replace('yearPct', 'monthPct');
          next[other] = Math.max(0, 100 - val);
        } else if (k.endsWith('monthPct')) {
          const other = k.replace('monthPct', 'yearPct');
          next[other] = Math.max(0, 100 - val);
        }
      } catch (e) {}
      return { ...s, inputs: next };
    }));
  };

  const updStr = (k, v) => {
    setScenarios(prev => prev.map((s, i) => {
      if (i !== activeScenarioIdx) return s;
      return { ...s, inputs: { ...s.inputs, [k]: v } };
    }));
  };

  const addScenario = () => {
    if (scenarios.length >= 3) return;
    const newScenario = {
      name: `Scenario ${['A', 'B', 'C'][scenarios.length]}`,
      inputs: { ...DEFAULT_INP },
    };
    setScenarios(prev => [...prev, newScenario]);
    setActiveScenarioIdx(scenarios.length);
  };

  const removeScenario = (idx) => {
    if (scenarios.length <= 1) return;
    setScenarios(prev => prev.filter((_, i) => i !== idx));
    setActiveScenarioIdx(prev => Math.min(prev, scenarios.length - 2));
  };

  const renameScenario = (idx, newName) => {
    setScenarios(prev => prev.map((s, i) => i === idx ? { ...s, name: newName } : s));
  };

  const [tab, setTab]        = useState("overview");
  const [tableFilter, setTF] = useState("all");
  const [timeframe, setTimeframe] = useState("1-5");

  /* ════════════ CORE MODEL ════════════ */
  const { rows, kpi } = useMemo(() => runModel(inp), [inp]);

  const allScenarioResults = useMemo(() => scenarios.map(s => runModel(s.inputs)), [scenarios]);

  /* ── Filtered rows ── */
  const tableRows = useMemo(() =>
    tableFilter === "all" ? rows : rows.filter(r => r.year === Number(tableFilter)),
    [rows, tableFilter]);

  /* ── Timeframe filtered rows ── */
  const timeframeRows = useMemo(() => {
    const [start, end] = timeframe.includes('-') ? timeframe.split('-').map(Number) : [Number(timeframe), Number(timeframe)];
    return rows.filter(r => r.year >= start && r.year <= end);
  }, [rows, timeframe]);

  /* ── Chart data ── */
  const chartData = useMemo(() => timeframeRows.map(r => ({
    period:    r.label,
    revenue:   r.revenue,
    mrr:       r.mrr,
    clients:   r.clients,
    pipeline:  r.pipeline,
    net:       r.net,
    capital:   r.capital,
    sessions:  r.totalSessions,
    empCap:    r.empCapacity,
    employees: r.totalEmp,
    indiaRev:  r.indiaINR,
    meRev:     r.meINR,
    europeRev: r.europeINR,
    ausRev:    r.ausINR,
    expenses:  r.totalExp,
    salaryExp: r.salaryExp,
    officeExp: r.officeExp,
  })), [timeframeRows]);

  const yoyYearData = useMemo(() => {
    const years = [1,2,3,4,5];
    const revByYear = years.map(y => rows.filter(r => r.year === y).reduce((sum, r) => sum + r.revenue, 0));
    return years.map((y, idx) => ({
      year: `Y${y}`,
      revenue: revByYear[idx],
      yoy: idx === 0 ? 0 : revByYear[idx - 1] > 0 ? ((revByYear[idx] - revByYear[idx - 1]) / revByYear[idx - 1]) * 100 : 0
    }));
  }, [rows]);

  const [regionMixYear, setRegionMixYear] = useState('Y1');
  const regionMixPieData = useMemo(() => {
    const yearMap = {
      Y1: {
        Europe: inp.europePct,
        USA: inp.mePct,
        Australia: inp.australiaPct,
        'Rest of World': inp.indiaPct
      },
      Y2: {
        Europe: inp.europePctY2,
        USA: inp.mePctY2,
        Australia: inp.ausPctY2,
        'Rest of World': inp.indiaPctY2
      },
      Y3: {
        Europe: inp.europePctY3,
        USA: inp.mePctY3,
        Australia: inp.ausPctY3,
        'Rest of World': inp.indiaPctY3
      },
      Y4: {
        Europe: inp.europePctY4,
        USA: inp.mePctY4,
        Australia: inp.ausPctY4,
        'Rest of World': inp.indiaPctY4
      },
      Y5: {
        Europe: inp.europePctY5,
        USA: inp.mePctY5,
        Australia: inp.ausPctY5,
        'Rest of World': inp.indiaPctY5
      }
    };
    const mix = yearMap[regionMixYear];
    return Object.entries(mix).map(([name, value]) => ({ name, value: Number(value) || 0 }));
  }, [regionMixYear, inp]);

  const [showAllRegionMixYears, setShowAllRegionMixYears] = useState(false);
  const [showAllSkuYears, setShowAllSkuYears] = useState(false);

  const launchLabel = `Y2M${String(inp.platformLaunchMonth).padStart(2,"0")}`;

  const tableCols = [
    { key: "label",       label: "Period",      format: v=>v,                               color: (_,r) => r._launch ? C.accent : C.muted },
    { key: "pricingModel",label: "Model",       format: (v, r) => v === 'perAcre' ? 'Per Acre' : (r.isPostLaunch ? 'SKU' : 'Fixed'), color: (v, r) => v === 'perAcre' ? '#d4a843' : (r.isPostLaunch ? C.green : C.accent) },
    { key: "clients",     label: "Clients",      format: fmtNum,                             color: () => C.text },
    { key: "indiaC",      label: "🇮🇳 IN",       format: fmtNum,                             color: () => C.green },
    { key: "meC",         label: "🇦🇪 ME",       format: fmtNum,                             color: () => C.accent },
    { key: "europeC",     label: "🇪🇺 EU",       format: fmtNum,                             color: () => C.blue },
    { key: "ausC",        label: "🇦🇺 AU",       format: fmtNum,                             color: () => C.teal },
    { key: "sessionsPerClient", label: "Sess/Cl", format: fmtNum },
    { key: "totalSessions",  label: "Total Sess", format: fmtNum,                            color: () => C.purple },
    { key: "empCapacity",    label: "Emp Cap",    format: fmtNum },
    { key: "reqEmp",      label: "Req Emp",       format: fmtNum,                             color: (v,r) => v > r.totalEmp - r.newHires ? C.red : C.muted },
    { key: "totalEmp",    label: "Total Emp",     format: fmtNum,                             color: () => C.text },
    { key: "newHires",    label: "New Hires",     format: v => v > 0 ? `+${v}` : "—",        color: v => v > 0 ? C.red : C.dim },
    { key: "salaryExp",   label: "Salary ₹",      format: fmtINR,                             color: () => C.red },
    { key: "officeExp",   label: "Office ₹",      format: fmtINR,                             color: () => "#e87a45" },
    { key: "totalExp",    label: "Total Exp ₹",   format: fmtINR,                             color: () => C.red },
    { key: "indiaINR",    label: "IN Rev ₹",      format: fmtINR,                             color: () => C.green },
    { key: "meINR",       label: "ME Rev ₹",      format: fmtINR,                             color: () => "#b8842a" },
    { key: "europeINR",   label: "EU Rev ₹",      format: fmtINR,                             color: () => "#3a7cc0" },
    { key: "ausINR",      label: "AU Rev ₹",      format: fmtINR,                             color: () => "#1fa89a" },
    { key: "revenue",     label: "Total Rev ₹",   format: fmtINR,                             color: () => C.green },
    { key: "mrr",         label: "MRR ₹",         format: fmtINR,                             color: () => C.blue },
    { key: "net",         label: "Net CF ₹",      format: fmtINR,                             color: v => v >= 0 ? C.green : C.red },
    { key: "capital",     label: "Capital ₹",     format: fmtINR,                             color: v => v >= 0 ? C.green : C.red },
    { key: "pipeline",    label: "Pipeline",      format: fmtNum },
  ];

  const regionOk = Math.round(inp.indiaPct+inp.mePct+inp.europePct+inp.australiaPct) === 100;
  const skuOk    = Math.round(inp.skuDevPct+inp.skuDesPct+inp.skuTrialPct+inp.skuConsPct) === 100;

  /* ════════════ RENDER ════════════ */
  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'Segoe UI', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #080c12; }
        ::-webkit-scrollbar-thumb { background: #3a5068; border-radius: 3px; }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.3; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      {/* HEADER */}
      <div style={{ background: C.bgCard, borderBottom: `1px solid ${C.border}`, padding: "11px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 200 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
          <div style={{ width: "33px", height: "33px", background: `linear-gradient(135deg,${C.accent},#f07820)`, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 800, color: C.bg }}>S</div>
          <div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>Sentient Grid</div>
            <div style={{ fontSize: "14px", color: C.muted, letterSpacing: "0.07em" }}>FINANCIAL PLANNING · 5-YEAR · MULTI-REGION · MANPOWER MODEL</div>
          </div>
          <div style={{ marginLeft: "14px", display: "flex", gap: "5px", flexWrap: "wrap" }}>
            <Badge color={C.accent}>Launch Y2M{inp.platformLaunchMonth}</Badge>
            <Badge color={C.purple}>{kpi.maxEmp} Peak Emp</Badge>
            {!regionOk && <Badge color={C.red}>Region ≠100%</Badge>}
            {!skuOk    && <Badge color={C.red}>SKU ≠100%</Badge>}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Scenario switcher */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {scenarios.map((s, i) => (
              <button
                key={i}
                onClick={() => setActiveScenarioIdx(i)}
                onDoubleClick={() => {
                  const newName = prompt('Rename scenario:', s.name);
                  if (newName) renameScenario(i, newName);
                }}
                style={{
                  background: activeScenarioIdx === i ? C.accent : 'transparent',
                  color: activeScenarioIdx === i ? '#fff' : C.muted,
                  border: `1px solid ${activeScenarioIdx === i ? C.accent : C.border}`,
                  padding: '5px 11px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px',
                  fontFamily: 'monospace'
                }}
              >{s.name}</button>
            ))}
            {scenarios.length < 3 && (
              <button
                onClick={addScenario}
                title="Add scenario"
                style={{ background: 'transparent', border: `1px dashed ${C.border}`, color: C.muted, padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '18px' }}
              >＋</button>
            )}
          </div>
          {/* Tab buttons */}
          {["overview","inputs","monthly","charts","compare"].map(t => (
            <TabBtn key={t} active={tab===t} onClick={()=>setTab(t)}>
              {t==="overview"?"Overview":t==="inputs"?"Inputs":t==="monthly"?"Monthly Table":t==="charts"?"Charts":"Compare"}
            </TabBtn>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px 22px", maxWidth: "1600px", margin: "0 auto" }}>

        {/* ══════ OVERVIEW ══════ */}
        {tab === "overview" && (<>
          <div style={{ fontSize: "15px", color: C.accent, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" }}>Valuation Targets</div>
          <div style={{ display: "flex", gap: "9px", flexWrap: "wrap", marginBottom: "18px" }}>
            <KPI label="Current Valuation"    value={fmtINR(inp.valuationNow)}  sub="Sentient baseline"        color={C.accent} />
            <KPI label="Year 5 Valuation"     value={fmtINR(kpi.yr5Val)}        sub={`${inp.fiveYearReturn}× return`} color={C.accent} />
            <KPI label="Year 5 EBITDA Target" value={fmtINR(kpi.yr5EBITDA)}     sub={`P/E = ${inp.pe}`}       color={C.blue} />
            <KPI label="Year 5 Rev Needed"    value={fmtINR(kpi.yr5Rev)}        sub={`EBITDA ${inp.ebitdaPct}%`} color={C.blue} />
            <KPI label="Year 1 Revenue"       value={fmtINR(kpi.yr1Total)}      sub="12-month total"          color={C.green} />
            <KPI label="Year 5 Revenue"       value={fmtINR(kpi.yr5Total)}      sub="12-month total"          color={C.green} />
          </div>

          <div style={{ fontSize: "15px", color: C.accent, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" }}>Operations</div>
          <div style={{ display: "flex", gap: "9px", flexWrap: "wrap", marginBottom: "22px" }}>
            <KPI label="Monthly Burn (base)" value={fmtINR(kpi.monthlyBurn)}   sub="Fixed expenses"          color={C.red} />
            <KPI label="Runway"              value={`${kpi.runway} mo`}         sub="On initial capital"      color={C.red} />
            <KPI label="Platform Launch"     value={`Y2 M${inp.platformLaunchMonth}`} sub="Revenue model switch" color={C.accent} />
            <KPI label="Launch Boost"        value={`${inp.launchBoostMultiplier}×`}  sub="Client multiplier"  color={C.accent} />
            <KPI label="Peak Employees"      value={kpi.maxEmp}                sub="Across 60 months"        color={C.purple} />
            <KPI label="Total New Hires"     value={kpi.totalHires}            sub="Computational designers"  color={C.purple} />
            <KPI label="Avg Sessions/Client (Post-Launch)" value={fmtNum(kpi.avgSessionsPerClient)} sub="Post-launch only" color={C.teal} />
            <KPI label="End Capital (Y5)"    value={fmtINR(kpi.lastRow?.capital)} sub="Cumulative"           color={kpi.lastRow?.capital >= 0 ? C.green : C.red} />
          </div>

          <Card style={{ marginBottom: "14px" }}>
            <Sec>Revenue Evolution — 60 Months (Fixed → SKU at Launch)</Sec>
            <ResponsiveContainer width="100%" height={255}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="period" tick={{ fill: C.muted, fontSize: 9 }} interval={5} />
                <YAxis tickFormatter={fmtINR} tick={{ fill: C.muted, fontSize: 10 }} />
                <Tooltip contentStyle={TT} formatter={(v,n)=>[fmtINR(v),n]} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <ReferenceLine x={launchLabel} stroke={C.accent} strokeDasharray="4 2" label={{ value:"LAUNCH", fill:C.accent, fontSize:9 }} />
                <Bar  dataKey="revenue"  name="Monthly Revenue" fill={C.green}  opacity={0.65} />
                <Line dataKey="mrr"      name="MRR"             stroke={C.blue}  dot={false} strokeWidth={2} />
                <Line dataKey="capital"  name="Capital"         stroke={C.accent} dot={false} strokeWidth={1.5} strokeDasharray="4 2" />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "13px" }}>
            <Card>
              <Sec>Client Growth (60 mo)</Sec>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="period" tick={{ fill: C.muted, fontSize: 9 }} interval={9} />
                  <YAxis tick={{ fill: C.muted, fontSize: 10 }} />
                  <Tooltip contentStyle={TT} />
                  <ReferenceLine x={launchLabel} stroke={C.accent} strokeDasharray="4 2" />
                  <Area dataKey="pipeline" name="Pipeline" stroke={C.purple} fill={C.purple} fillOpacity={0.07} strokeWidth={1.5} strokeDasharray="4 2" />
                  <Area dataKey="clients"  name="Clients"  stroke={C.green}  fill={C.green}  fillOpacity={0.14} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Sec>Region Mix
                  <span style={{ fontWeight: 400, fontSize: 13, color: C.muted, marginLeft: 8 }}>
                    <select value={regionMixYear} onChange={e => setRegionMixYear(e.target.value)} style={{ fontSize: 13, padding: '2px 8px', borderRadius: 4, border: `1px solid ${C.border}`, background: C.bgCard, color: 'inherit', marginLeft: 8 }}>
                      {['Y1','Y2','Y3','Y4','Y5'].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </span>
                </Sec>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={regionMixPieData} cx="50%" cy="50%" outerRadius={50} fill="#8884d8" dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {regionMixPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={[C.green, C.accent, C.blue, C.teal][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card>
            <Sec>Employees Over Time</Sec>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="period" tick={{ fill: C.muted, fontSize: 9 }} interval={9} />
                <YAxis tick={{ fill: C.muted, fontSize: 10 }} />
                <Tooltip contentStyle={TT} />
                <Area dataKey="employees" name="Employees" stroke={C.purple} fill={C.purple} fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </>)}

        {/* ══════ INPUTS ══════ */}
        {tab === "inputs" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(265px, 1fr))", gap: "14px" }}>

            {/* Pricing Model Selector */}
            <Card>
              <Sec>🏷️ Pricing Model</Sec>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                {[
                  { id: 'annualSaas', label: '📦 Annual SaaS / SKU', desc: 'Per-seat annual contracts' },
                  { id: 'perAcre', label: '🌾 Per Acre', desc: 'Revenue per project acre' },
                ].map(model => (
                  <div
                    key={model.id}
                    onClick={() => updStr('pricingModel', model.id)}
                    style={{
                      flex: 1, padding: '12px 16px', borderRadius: 8, cursor: 'pointer',
                      border: `2px solid ${inp.pricingModel === model.id ? C.accent : C.border}`,
                      background: inp.pricingModel === model.id ? `${C.accent}15` : C.bgCard,
                    }}
                  >
                    <div style={{ fontSize: 15, fontWeight: 600, color: inp.pricingModel === model.id ? C.accent : C.text }}>{model.label}</div>
                    <div style={{ fontSize: 13, color: C.dim, marginTop: 4 }}>{model.desc}</div>
                  </div>
                ))}
              </div>
              {inp.pricingModel === 'perAcre' && (
                <>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    {Object.entries(PRICE_TIERS).map(([tier, price]) => (
                      <button
                        key={tier}
                        onClick={() => upd('pricePerAcre', price)}
                        style={{
                          flex: 1, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
                          border: `1px solid ${inp.pricePerAcre === price ? C.accent : C.border}`,
                          background: inp.pricePerAcre === price ? C.accent : C.bgCard,
                          color: inp.pricePerAcre === price ? '#fff' : C.text,
                        }}
                      >
                        {tier.charAt(0).toUpperCase() + tier.slice(1)}<br/>₹{(price/1000).toFixed(0)}K
                      </button>
                    ))}
                  </div>
                  <Field label="Price per Acre (₹)" id="pricePerAcre" value={inp.pricePerAcre} onChange={upd} prefix="₹" suffix="/acre" />
                  <Field label="Avg Project Size (acres)" id="avgProjectSizeAcres" value={inp.avgProjectSizeAcres} onChange={upd} suffix="acres"
                    hint={`= ₹${((inp.pricePerAcre || 10000) * (inp.avgProjectSizeAcres || 35) / 100000).toFixed(1)}L/project`} />
                  <Field label="Total SAM (acres)" id="totalSAMacres" value={inp.totalSAMacres} onChange={upd} suffix="acres" />
                  <Field label="Market Capture %" id="marketCapturePct" value={inp.marketCapturePct} onChange={upd} suffix="%" />
                  <Sec>📅 Annual Project Targets</Sec>
                  {[1,2,3,4,5].map(y => (
                    <Field key={y} label={`Y${y} Projects`} id={`perAcreProjectsY${y}`} value={inp[`perAcreProjectsY${y}`]} onChange={upd}
                      hint={`= ${fmtINR((inp[`perAcreProjectsY${y}`] || 0) * (inp.pricePerAcre || 10000) * (inp.avgProjectSizeAcres || 35))}`} />
                  ))}
                </>
              )}
            </Card>

            <Card variant="purple">
              <Sec color="#fff">📄 PDF Baseline</Sec>
              <Field label="EBITDA %" id="ebitdaPct" value={inp.ebitdaPct} onChange={upd} suffix="%" hint="20–40%" />
              <Field label="Valuation Now" id="valuationNow" value={inp.valuationNow} onChange={upd} prefix="₹" />
              <Field label="P/E Ratio" id="pe" value={inp.pe} onChange={upd} hint="20–30" />
              <Field label="5-Year Return" id="fiveYearReturn" value={inp.fiveYearReturn} onChange={upd} suffix="×" />
              <Field label="Avg Deal Size" id="avgDealSize" value={inp.avgDealSize} onChange={upd} prefix="₹" />
              <Field label="Inflation" id="inflation" value={inp.inflation} onChange={upd} suffix="%" hint="Annual %" />
            </Card>

            <Card variant="purple">
              <Sec color="#fff">Sales & Payment Pipeline Metrics</Sec>
              <Field label="Avg Sales Cycle (days)" id="avgSalesCycle" value={inp.avgSalesCycle} onChange={upd} suffix="days" />
              <Field label="Avg Payment Lag (days)" id="avgPaymentLag" value={inp.avgPaymentLag} onChange={upd} suffix="days" />
              <Field label="Conversion Rate" id="conversionRate" value={inp.conversionRate} onChange={upd} suffix="%" hint="Leads → Signed" />
              <Field label="Total Lead to Cash (days)" id="totalLeadToCash" value={(inp.avgSalesCycle||0)+(inp.avgPaymentLag||0)} readOnly={true} suffix="days" />
            </Card>
              <div style={{ background:C.bg, color: C.text, borderRadius:"6px", padding:"9px", marginTop:"8px", border:`1px solid ${C.border}` }}>
                {[["Yr5 Valuation",fmtINR(kpi.yr5Val)],["Yr5 EBITDA",fmtINR(kpi.yr5EBITDA)],["Yr5 Rev Needed",fmtINR(kpi.yr5Rev)]].map(([l,v])=>(
                  <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"3px 0", fontSize:"16px", borderBottom:`1px solid ${C.border}` }}>
                    <span style={{color:'inherit'}}>{l}</span><span style={{color:C.accent}}>{v}</span>
                  </div>
                ))}
              </div>

            <Card variant="purple">
              <Sec color="#fff">🏢 Business Assumptions</Sec>
              <Field label="Initial Clients (Y1)" id="initialClients" value={inp.initialClients} onChange={upd} />
              <Field label="Rev/Client Y1 (annual)" id="revenuePerClientY1" value={inp.revenuePerClientY1} onChange={upd} prefix="₹" />
              <Field label="Client Growth / Quarter" id="clientGrowthQtr" value={inp.clientGrowthQtr} onChange={upd} suffix="%" />
              <Field label="Initial Capital" id="initialInvestment" value={inp.initialInvestment} onChange={upd} prefix="₹" />
              <Field label="Initial Employees" id="initialEmployees" value={inp.initialEmployees} onChange={upd} hint="Base team" />
            </Card>

            <Card variant="purple">
              <Sec color="#fff">🚀 Platform Launch</Sec>
              <Field label="Launch Month (in Year 2)" id="platformLaunchMonth" value={inp.platformLaunchMonth} onChange={upd} hint="1–12" />
              <Field label="Client Boost at Launch" id="launchBoostMultiplier" value={inp.launchBoostMultiplier} onChange={upd} suffix="×" hint="1.5 = +50%" />
              <div style={{ background:C.bg, color: C.text, borderRadius:"6px", padding:"10px", marginTop:"10px", border:`1px solid ${C.border}`, fontSize:"16px", lineHeight:1.9 }}>
                <span style={{color:C.accent}}>Y1 M1–M12:</span> Fixed ₹/client model<br/>
                <span style={{color:C.green}}>Y2 M{inp.platformLaunchMonth}+:</span> SKU pricing model<br/>
                <span style={{color:C.purple}}>Absolute month:</span> {kpi.launchAbsMonth}
              </div>
            </Card>

            <Card variant="purple">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Sec color="#fff">🌍 Region Mix (Y1)</Sec>
                <button onClick={() => setShowAllRegionMixYears(v => !v)} style={{ fontSize: 13, padding: '2px 10px', borderRadius: 4, border: `1px solid ${C.border}`, background: C.bgCard, color: 'inherit', cursor: 'pointer' }}>
                  {showAllRegionMixYears ? 'Collapse All Years' : 'Expand All Years'}
                </button>
              </div>
              <Field label="India %" id="indiaPct" value={inp.indiaPct} onChange={upd} suffix="% INR" />
              <Field label="Middle East %" id="mePct" value={inp.mePct} onChange={upd} suffix="% AED" />
              <Field label="Europe %" id="europePct" value={inp.europePct} onChange={upd} suffix="% EUR" />
              <Field label="Australia %" id="australiaPct" value={inp.australiaPct} onChange={upd} suffix="% AUD" />
              <div style={{ marginTop:"6px", fontSize:"16px", color: regionOk ? C.green : C.red }}>
                Total: {inp.indiaPct+inp.mePct+inp.europePct+inp.australiaPct}% {regionOk?"✓":"⚠ must = 100%"}
              </div>
            </Card>
            {showAllRegionMixYears && <>
              <Card variant="purple">
                <Sec color="#fff">Region Mix (Y2)</Sec>
                <Field label="India %" id="indiaPctY2" value={inp.indiaPctY2} onChange={upd} suffix="%" />
                <Field label="Middle East %" id="mePctY2" value={inp.mePctY2} onChange={upd} suffix="%" />
                <Field label="Europe %" id="europePctY2" value={inp.europePctY2} onChange={upd} suffix="%" />
                <Field label="Australia %" id="ausPctY2" value={inp.ausPctY2} onChange={upd} suffix="%" />
              </Card>
              <Card variant="purple">
                <Sec color="#fff">Region Mix (Y3)</Sec>
                <Field label="India %" id="indiaPctY3" value={inp.indiaPctY3} onChange={upd} suffix="%" />
                <Field label="Middle East %" id="mePctY3" value={inp.mePctY3} onChange={upd} suffix="%" />
                <Field label="Europe %" id="europePctY3" value={inp.europePctY3} onChange={upd} suffix="%" />
                <Field label="Australia %" id="ausPctY3" value={inp.ausPctY3} onChange={upd} suffix="%" />
              </Card>
              <Card variant="purple">
                <Sec color="#fff">Region Mix (Y4)</Sec>
                <Field label="India %" id="indiaPctY4" value={inp.indiaPctY4} onChange={upd} suffix="%" />
                <Field label="Middle East %" id="mePctY4" value={inp.mePctY4} onChange={upd} suffix="%" />
                <Field label="Europe %" id="europePctY4" value={inp.europePctY4} onChange={upd} suffix="%" />
                <Field label="Australia %" id="ausPctY4" value={inp.ausPctY4} onChange={upd} suffix="%" />
              </Card>
              <Card variant="purple">
                <Sec color="#fff">Region Mix (Y5)</Sec>
                <Field label="India %" id="indiaPctY5" value={inp.indiaPctY5} onChange={upd} suffix="%" />
                <Field label="Middle East %" id="mePctY5" value={inp.mePctY5} onChange={upd} suffix="%" />
                <Field label="Europe %" id="europePctY5" value={inp.europePctY5} onChange={upd} suffix="%" />
                <Field label="Australia %" id="ausPctY5" value={inp.ausPctY5} onChange={upd} suffix="%" />
              </Card>
            </>}

            <Card variant="purple">
              <Sec color="#fff">💱 FX → INR Rates</Sec>
              <Field label="1 AED → INR" id="aedToInr" value={inp.aedToInr} onChange={upd} suffix="INR" hint="~22.5" />
              <Field label="1 EUR → INR" id="eurToInr" value={inp.eurToInr} onChange={upd} suffix="INR" hint="~90" />
              <Field label="1 AUD → INR" id="audToInr" value={inp.audToInr} onChange={upd} suffix="INR" hint="~55" />
              <div style={{ background:C.bg, color: C.text, borderRadius:"6px", padding:"9px", marginTop:"10px", border:`1px solid ${C.border}` }}>
                {[["1 AED",`₹${inp.aedToInr}`],["1 EUR",`₹${inp.eurToInr}`],["1 AUD",`₹${inp.audToInr}`]].map(([l,v])=>(
                  <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"3px 0", fontSize:"16px" }}>
                    <span style={{color:'inherit'}}>{l}</span><span style={{color:C.text}}>{v}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card variant="purple">
              <Sec color="#fff">👥 Manpower Model</Sec>
              <Field label="Sessions / Client / Month" id="sessionsPerClientPerMonth" value={inp.sessionsPerClientPerMonth} onChange={upd} />
              <Field label="Onboarding Sessions / Client" id="onboardingSessionsPerClient" value={inp.onboardingSessionsPerClient} onChange={upd} hint="2 std" />
              <Field label="Session Capacity / Employee" id="sessionCapacityPerEmployee" value={inp.sessionCapacityPerEmployee} onChange={upd} hint="20 std" />
              <Field label="Salary / New Designer" id="salaryPerDesigner" value={inp.salaryPerDesigner} onChange={upd} prefix="₹" suffix="/mo" />
              <Field label="Office / New Designer" id="officePerDesigner" value={inp.officePerDesigner} onChange={upd} prefix="₹" suffix="/mo" />
              <div style={{ background:C.bg, color: C.text, borderRadius:"6px", padding:"9px", marginTop:"8px", border:`1px solid ${C.border}`, fontSize:"16px", lineHeight:1.9 }}>
                Peak employees: <span style={{color:C.purple}}>{kpi.maxEmp}</span><br/>
                Total hires: <span style={{color:C.red}}>{kpi.totalHires}</span>
              </div>
            </Card>

            <Card variant="purple">
              <Sec color="#fff">💸 Monthly Fixed Expenses</Sec>
              <Field label="Employee Salaries" id="salaries" value={inp.salaries} onChange={upd} prefix="₹" hint="Base team" />
              <Field label="Workstation / Rent" id="rent" value={inp.rent} onChange={upd} prefix="₹" />
              <Field label="Stack / Product Dev" id="stackCosts" value={inp.stackCosts} onChange={upd} prefix="₹" />
              <Field label="API Costs" id="apiCosts" value={inp.apiCosts} onChange={upd} prefix="₹" />
              <div style={{ background:C.bg, color: C.text, borderRadius:"6px", padding:"9px", marginTop:"8px", border:`1px solid ${C.border}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:"17px", fontWeight:600 }}>
                  <span style={{color:'inherit'}}>Base Monthly Burn</span>
                  <span style={{color:C.red}}>{fmtINR(kpi.monthlyBurn)}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:"16px", marginTop:"4px" }}>
                  <span style={{color:'inherit'}}>Runway</span>
                  <span style={{color:C.red}}>{kpi.runway} months</span>
                </div>
              </div>
            </Card>

            <Card variant="purple">
              <Sec color="#fff">🏗️ Headcount Cost Model</Sec>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[{ id: false, label: 'Simple Burn' }, { id: true, label: 'Headcount Model' }].map(opt => (
                    <div
                      key={String(opt.id)}
                      onClick={() => updStr('useHeadcountSalaryModel', opt.id)}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: 6, cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 600,
                        border: `2px solid ${inp.useHeadcountSalaryModel === opt.id ? C.accent : C.border}`,
                        background: inp.useHeadcountSalaryModel === opt.id ? `${C.accent}22` : 'transparent',
                        color: inp.useHeadcountSalaryModel === opt.id ? C.accent : '#fff' }}
                    >{opt.label}</div>
                  ))}
                </div>
              </div>
              {inp.useHeadcountSalaryModel && <>
                <Field label="BD Personnel" id="numBDPersonnel" value={inp.numBDPersonnel} onChange={upd} suffix="ppl" />
                <Field label="Salary BD (annual)" id="salaryBD" value={inp.salaryBD} onChange={upd} prefix="₹" />
                <Field label="Planning Specialists" id="numPlanningSpecialists" value={inp.numPlanningSpecialists} onChange={upd} suffix="ppl" />
                <Field label="Salary Specialist (annual)" id="salaryPlanningSpecialist" value={inp.salaryPlanningSpecialist} onChange={upd} prefix="₹" />
                <Field label="Operations Staff" id="numOperationsStaff" value={inp.numOperationsStaff} onChange={upd} suffix="ppl" />
                <Field label="Salary Operations (annual)" id="salaryOperations" value={inp.salaryOperations} onChange={upd} prefix="₹" />
                <Field label="Founders" id="numFounders" value={inp.numFounders} onChange={upd} suffix="ppl" />
                <Field label="Salary Founder (annual)" id="salaryFounder" value={inp.salaryFounder} onChange={upd} prefix="₹" />
                <Field label="Cloud Infra (annual)" id="cloudInfraAnnual" value={inp.cloudInfraAnnual} onChange={upd} prefix="₹" />
                <Field label="Software / CRM (annual)" id="softwareCRMAnnual" value={inp.softwareCRMAnnual} onChange={upd} prefix="₹" />
              </>}
            </Card>

            <Card variant="purple">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Sec>🧩 SKU Pricing (Y1)</Sec>
                <button onClick={() => setShowAllSkuYears(v => !v)} style={{ fontSize: 13, padding: '2px 10px', borderRadius: 4, border: `1px solid ${C.border}`, background: C.bgCard, color: 'inherit', cursor: 'pointer' }}>
                  {showAllSkuYears ? 'Collapse All Years' : 'Expand All Years'}
                </button>
              </div>
              <Field label="Developer" id="skuDeveloper" value={inp.skuDeveloper} onChange={upd} prefix="₹" suffix="/yr" />
              <Field label="Designer" id="skuDesigner" value={inp.skuDesigner} onChange={upd} prefix="₹" suffix="/yr" />
              <Field label="Trial" id="skuTrial" value={inp.skuTrial} onChange={upd} prefix="₹" suffix="/yr" />
              <Field label="Consulting" id="skuConsulting" value={inp.skuConsulting} onChange={upd} prefix="₹" suffix="/yr" />
            </Card>
            {showAllSkuYears && <>
              <Card variant="purple">
                <Sec>SKU Pricing (Y2)</Sec>
                <Field label="Developer — Yearly Price" id="skuDeveloperY2" value={inp.skuDeveloperY2} onChange={upd} prefix="₹" suffix="/yr" />
                <Field label="Developer — Monthly Price" id="skuDeveloperY2_month" value={inp.skuDeveloperY2_month} onChange={upd} prefix="₹" suffix="/mo" />
                <Field label="Developer — Yearly %" id="skuDeveloperY2_yearPct" value={inp.skuDeveloperY2_yearPct} onChange={upd} suffix="%" />
                <Field label="Developer — Monthly %" id="skuDeveloperY2_monthPct" value={inp.skuDeveloperY2_monthPct} onChange={upd} suffix="%" />

                <Field label="Designer — Yearly Price" id="skuDesignerY2" value={inp.skuDesignerY2} onChange={upd} prefix="₹" suffix="/yr" />
                <Field label="Designer — Monthly Price" id="skuDesignerY2_month" value={inp.skuDesignerY2_month} onChange={upd} prefix="₹" suffix="/mo" />
                <Field label="Designer — Yearly %" id="skuDesignerY2_yearPct" value={inp.skuDesignerY2_yearPct} onChange={upd} suffix="%" />
                <Field label="Designer — Monthly %" id="skuDesignerY2_monthPct" value={inp.skuDesignerY2_monthPct} onChange={upd} suffix="%" />

                <Field label="Trial — Yearly Price" id="skuTrialY2" value={inp.skuTrialY2} onChange={upd} prefix="₹" suffix="/yr" />
                <Field label="Trial — Monthly Price" id="skuTrialY2_month" value={inp.skuTrialY2_month} onChange={upd} prefix="₹" suffix="/mo" />
                <Field label="Trial — Yearly %" id="skuTrialY2_yearPct" value={inp.skuTrialY2_yearPct} onChange={upd} suffix="%" />
                <Field label="Trial — Monthly %" id="skuTrialY2_monthPct" value={inp.skuTrialY2_monthPct} onChange={upd} suffix="%" />

                <Field label="Consulting — Yearly Price" id="skuConsultingY2" value={inp.skuConsultingY2} onChange={upd} prefix="₹" suffix="/yr" />
                <Field label="Consulting — Monthly Price" id="skuConsultingY2_month" value={inp.skuConsultingY2_month} onChange={upd} prefix="₹" suffix="/mo" />
                <Field label="Consulting — Yearly %" id="skuConsultingY2_yearPct" value={inp.skuConsultingY2_yearPct} onChange={upd} suffix="%" />
                <Field label="Consulting — Monthly %" id="skuConsultingY2_monthPct" value={inp.skuConsultingY2_monthPct} onChange={upd} suffix="%" />
              </Card>
              <Card variant="purple">
                <Sec>SKU Pricing (Y3)</Sec>
                <Field label="Developer — Yearly Price" id="skuDeveloperY3" value={inp.skuDeveloperY3} onChange={upd} prefix="₹" suffix="/yr" />
                <Field label="Developer — Monthly Price" id="skuDeveloperY3_month" value={inp.skuDeveloperY3_month} onChange={upd} prefix="₹" suffix="/mo" />
                <Field label="Developer — Yearly %" id="skuDeveloperY3_yearPct" value={inp.skuDeveloperY3_yearPct} onChange={upd} suffix="%" />
                <Field label="Developer — Monthly %" id="skuDeveloperY3_monthPct" value={inp.skuDeveloperY3_monthPct} onChange={upd} suffix="%" />

                <Field label="Designer — Yearly Price" id="skuDesignerY3" value={inp.skuDesignerY3} onChange={upd} prefix="₹" suffix="/yr" />
                <Field label="Designer — Monthly Price" id="skuDesignerY3_month" value={inp.skuDesignerY3_month} onChange={upd} prefix="₹" suffix="/mo" />
                <Field label="Designer — Yearly %" id="skuDesignerY3_yearPct" value={inp.skuDesignerY3_yearPct} onChange={upd} suffix="%" />
                <Field label="Designer — Monthly %" id="skuDesignerY3_monthPct" value={inp.skuDesignerY3_monthPct} onChange={upd} suffix="%" />

                <Field label="Trial — Yearly Price" id="skuTrialY3" value={inp.skuTrialY3} onChange={upd} prefix="₹" suffix="/yr" />
                <Field label="Trial — Monthly Price" id="skuTrialY3_month" value={inp.skuTrialY3_month} onChange={upd} prefix="₹" suffix="/mo" />
                <Field label="Trial — Yearly %" id="skuTrialY3_yearPct" value={inp.skuTrialY3_yearPct} onChange={upd} suffix="%" />
                <Field label="Trial — Monthly %" id="skuTrialY3_monthPct" value={inp.skuTrialY3_monthPct} onChange={upd} suffix="%" />

                <Field label="Consulting — Yearly Price" id="skuConsultingY3" value={inp.skuConsultingY3} onChange={upd} prefix="₹" suffix="/yr" />
                <Field label="Consulting — Monthly Price" id="skuConsultingY3_month" value={inp.skuConsultingY3_month} onChange={upd} prefix="₹" suffix="/mo" />
                <Field label="Consulting — Yearly %" id="skuConsultingY3_yearPct" value={inp.skuConsultingY3_yearPct} onChange={upd} suffix="%" />
                <Field label="Consulting — Monthly %" id="skuConsultingY3_monthPct" value={inp.skuConsultingY3_monthPct} onChange={upd} suffix="%" />
              </Card>
              <Card variant="purple">
                <Sec>SKU Pricing (Y4)</Sec>
                <Field label="Developer — Yearly Price" id="skuDeveloperY4" value={inp.skuDeveloperY4} onChange={upd} prefix="₹" suffix="/yr" />
                <Field label="Developer — Monthly Price" id="skuDeveloperY4_month" value={inp.skuDeveloperY4_month} onChange={upd} prefix="₹" suffix="/mo" />
                <Field label="Developer — Yearly %" id="skuDeveloperY4_yearPct" value={inp.skuDeveloperY4_yearPct} onChange={upd} suffix="%" />
                <Field label="Developer — Monthly %" id="skuDeveloperY4_monthPct" value={inp.skuDeveloperY4_monthPct} onChange={upd} suffix="%" />

                <Field label="Designer — Yearly Price" id="skuDesignerY4" value={inp.skuDesignerY4} onChange={upd} prefix="₹" suffix="/yr" />
                <Field label="Designer — Monthly Price" id="skuDesignerY4_month" value={inp.skuDesignerY4_month} onChange={upd} prefix="₹" suffix="/mo" />
                <Field label="Designer — Yearly %" id="skuDesignerY4_yearPct" value={inp.skuDesignerY4_yearPct} onChange={upd} suffix="%" />
                <Field label="Designer — Monthly %" id="skuDesignerY4_monthPct" value={inp.skuDesignerY4_monthPct} onChange={upd} suffix="%" />

                <Field label="Trial — Yearly Price" id="skuTrialY4" value={inp.skuTrialY4} onChange={upd} prefix="₹" suffix="/yr" />
                <Field label="Trial — Monthly Price" id="skuTrialY4_month" value={inp.skuTrialY4_month} onChange={upd} prefix="₹" suffix="/mo" />
                <Field label="Trial — Yearly %" id="skuTrialY4_yearPct" value={inp.skuTrialY4_yearPct} onChange={upd} suffix="%" />
                <Field label="Trial — Monthly %" id="skuTrialY4_monthPct" value={inp.skuTrialY4_monthPct} onChange={upd} suffix="%" />

                <Field label="Consulting — Yearly Price" id="skuConsultingY4" value={inp.skuConsultingY4} onChange={upd} prefix="₹" suffix="/yr" />
                <Field label="Consulting — Monthly Price" id="skuConsultingY4_month" value={inp.skuConsultingY4_month} onChange={upd} prefix="₹" suffix="/mo" />
                <Field label="Consulting — Yearly %" id="skuConsultingY4_yearPct" value={inp.skuConsultingY4_yearPct} onChange={upd} suffix="%" />
                <Field label="Consulting — Monthly %" id="skuConsultingY4_monthPct" value={inp.skuConsultingY4_monthPct} onChange={upd} suffix="%" />
              </Card>
              <Card variant="purple">
                <Sec>SKU Pricing (Y5)</Sec>
                <Field label="Developer — Yearly Price" id="skuDeveloperY5" value={inp.skuDeveloperY5} onChange={upd} prefix="₹" suffix="/yr" />
                <Field label="Developer — Monthly Price" id="skuDeveloperY5_month" value={inp.skuDeveloperY5_month} onChange={upd} prefix="₹" suffix="/mo" />
                <Field label="Developer — Yearly %" id="skuDeveloperY5_yearPct" value={inp.skuDeveloperY5_yearPct} onChange={upd} suffix="%" />
                <Field label="Developer — Monthly %" id="skuDeveloperY5_monthPct" value={inp.skuDeveloperY5_monthPct} onChange={upd} suffix="%" />

                <Field label="Designer — Yearly Price" id="skuDesignerY5" value={inp.skuDesignerY5} onChange={upd} prefix="₹" suffix="/yr" />
                <Field label="Designer — Monthly Price" id="skuDesignerY5_month" value={inp.skuDesignerY5_month} onChange={upd} prefix="₹" suffix="/mo" />
                <Field label="Designer — Yearly %" id="skuDesignerY5_yearPct" value={inp.skuDesignerY5_yearPct} onChange={upd} suffix="%" />
                <Field label="Designer — Monthly %" id="skuDesignerY5_monthPct" value={inp.skuDesignerY5_monthPct} onChange={upd} suffix="%" />

                <Field label="Trial — Yearly Price" id="skuTrialY5" value={inp.skuTrialY5} onChange={upd} prefix="₹" suffix="/yr" />
                <Field label="Trial — Monthly Price" id="skuTrialY5_month" value={inp.skuTrialY5_month} onChange={upd} prefix="₹" suffix="/mo" />
                <Field label="Trial — Yearly %" id="skuTrialY5_yearPct" value={inp.skuTrialY5_yearPct} onChange={upd} suffix="%" />
                <Field label="Trial — Monthly %" id="skuTrialY5_monthPct" value={inp.skuTrialY5_monthPct} onChange={upd} suffix="%" />

                <Field label="Consulting — Yearly Price" id="skuConsultingY5" value={inp.skuConsultingY5} onChange={upd} prefix="₹" suffix="/yr" />
                <Field label="Consulting — Monthly Price" id="skuConsultingY5_month" value={inp.skuConsultingY5_month} onChange={upd} prefix="₹" suffix="/mo" />
                <Field label="Consulting — Yearly %" id="skuConsultingY5_yearPct" value={inp.skuConsultingY5_yearPct} onChange={upd} suffix="%" />
                <Field label="Consulting — Monthly %" id="skuConsultingY5_monthPct" value={inp.skuConsultingY5_monthPct} onChange={upd} suffix="%" />
              </Card>
            </>}

            <Card variant="purple">
              <Sec>🎛 SKU Revenue Mix</Sec>
              <Field label="Developer %" id="skuDevPct" value={inp.skuDevPct} onChange={upd} suffix="%" />
              <Field label="Designer %" id="skuDesPct" value={inp.skuDesPct} onChange={upd} suffix="%" />
              <Field label="Trial %" id="skuTrialPct" value={inp.skuTrialPct} onChange={upd} suffix="%" />
              <Field label="Consulting %" id="skuConsPct" value={inp.skuConsPct} onChange={upd} suffix="%" />
              <div style={{ marginTop:"6px", fontSize:"16px", color: skuOk ? C.green : C.red }}>
                Total: {inp.skuDevPct+inp.skuDesPct+inp.skuTrialPct+inp.skuConsPct}% {skuOk?"✓":"⚠ must = 100%"}
              </div>
            </Card>
          </div>
        )}

        {/* ══════ MONTHLY TABLE ══════ */}
        {tab === "monthly" && (<>
          <div style={{ display:"flex", gap:"5px", marginBottom:"12px", alignItems:"center", flexWrap:"wrap" }}>
            <span style={{ fontSize: "15px", color:C.muted, marginRight:"4px" }}>YEAR:</span>
            {["all","1","2","3","4","5"].map(y => (
              <TabBtn key={y} active={tableFilter===y} onClick={()=>setTF(y)}>
                {y==="all"?"All Years":`Year ${y}`}
              </TabBtn>
            ))}
            <span style={{ fontSize: "15px", color:C.muted, marginLeft:"auto" }}>
              {tableRows.length} rows · Amber highlight = Platform Launch month
            </span>
          </div>

          <div style={{ display:"flex", gap:"9px", flexWrap:"wrap", marginBottom:"12px" }}>
            <KPI label="Total Revenue"  value={fmtINR(tableRows.reduce((s,r)=>s+r.revenue,0))} color={C.green} />
            <KPI label="Total Expenses" value={fmtINR(tableRows.reduce((s,r)=>s+r.totalExp,0))} color={C.red} />
            <KPI label="Net Cash Flow"  value={fmtINR(tableRows.reduce((s,r)=>s+r.net,0))} color={tableRows.reduce((s,r)=>s+r.net,0)>=0?C.green:C.red} />
            <KPI label="New Hires"      value={tableRows.reduce((s,r)=>s+r.newHires,0)} color={C.purple} />
            <KPI label="End Capital"    value={fmtINR(tableRows[tableRows.length-1]?.capital??0)} color={C.accent} />
          </div>

          <Card style={{ padding:0, overflow:"hidden" }}>
            <DataTable cols={tableCols} rows={tableRows} />
          </Card>

          <Card style={{ marginTop: "20px" }}>
            <Sec>Custom Combi Chart</Sec>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={tableRows}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="label" tick={{ fill: C.muted, fontSize: 9 }} />
                <YAxis yAxisId="left" tickFormatter={fmtINR} tick={{ fill: C.muted, fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={fmtINR} tick={{ fill: C.muted, fontSize: 10 }} />
                <Tooltip contentStyle={TT} formatter={(v,n)=>[fmtINR(v),n]} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke={C.green} name="Revenue" />
                <Line yAxisId="left" type="monotone" dataKey="totalExp" stroke={C.red} name="Expenses" />
                <Bar yAxisId="right" dataKey="net" fill={C.blue} name="Net Cash Flow" />
                <Bar yAxisId="right" dataKey="capital" fill={C.accent} name="Capital" />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </>)}

        {/* ══════ CHARTS ══════ */}
        {tab === "charts" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>

            <Card style={{ gridColumn:"1/-1" }}>
              <Sec>1. Revenue Growth — 60 Months</Sec>
              <ResponsiveContainer width="100%" height={245}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="period" tick={{ fill:C.muted, fontSize:9 }} interval={5} />
                  <YAxis tickFormatter={fmtINR} tick={{ fill:C.muted, fontSize:10 }} />
                  <Tooltip contentStyle={TT} formatter={(v,n)=>[fmtINR(v),n]} />
                  <Legend wrapperStyle={{ fontSize:"11px" }} />
                  <ReferenceLine x={launchLabel} stroke={C.accent} strokeDasharray="4 2" label={{ value:"LAUNCH", fill:C.accent, fontSize:9 }} />
                  <Bar  dataKey="revenue"  name="Revenue"   fill={C.green}  opacity={0.65} />
                  <Line dataKey="mrr"      name="MRR"       stroke={C.blue}  dot={false} strokeWidth={2} />
                  <Line dataKey="expenses" name="Expenses"  stroke={C.red}   dot={false} strokeWidth={1.5} strokeDasharray="3 2" />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>

            <Card style={{ gridColumn:"1/-1" }}>
              <Sec>2. YoY Revenue Growth (%)</Sec>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={yoyYearData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="year" tick={{ fill:C.muted, fontSize:9 }} />
                  <YAxis tickFormatter={v => `${v.toFixed(1)}%`} tick={{ fill:C.muted, fontSize:10 }} />
                  <Tooltip contentStyle={TT} formatter={v => [`${v.toFixed(2)}%`, 'YoY growth']} />
                  <Bar dataKey="yoy" name="YoY Growth" fill={C.blue} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card style={{ gridColumn:"1/-1" }}>
              <Sec>2. Regional Revenue Breakdown (INR Equivalent)</Sec>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="period" tick={{ fill:C.muted, fontSize:9 }} interval={5} />
                  <YAxis tickFormatter={fmtINR} tick={{ fill:C.muted, fontSize:10 }} />
                  <Tooltip contentStyle={TT} formatter={(v,n)=>[fmtINR(v),n]} />
                  <Legend wrapperStyle={{ fontSize:"11px" }} />
                  <ReferenceLine x={launchLabel} stroke={C.accent} strokeDasharray="4 2" />
                  <Bar dataKey="indiaRev"  name="India ₹"        stackId="r" fill={C.green}  opacity={0.9} />
                  <Bar dataKey="meRev"     name="Middle East ₹"  stackId="r" fill={C.accent} opacity={0.9} />
                  <Bar dataKey="europeRev" name="Europe ₹"       stackId="r" fill={C.blue}   opacity={0.9} />
                  <Bar dataKey="ausRev"    name="Australia ₹"    stackId="r" fill={C.teal}   opacity={0.9} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <Sec>3. Sessions vs Employee Capacity</Sec>
              <ResponsiveContainer width="100%" height={215}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="period" tick={{ fill:C.muted, fontSize:9 }} interval={7} />
                  <YAxis tick={{ fill:C.muted, fontSize:10 }} />
                  <Tooltip contentStyle={TT} />
                  <Legend wrapperStyle={{ fontSize:"11px" }} />
                  <Area dataKey="sessions" name="Sessions Required" stroke={C.red}   fill={C.red}   fillOpacity={0.1} strokeWidth={2} />
                  <Line dataKey="empCap"   name="Employee Capacity"  stroke={C.green} dot={false} strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <Sec>4. Number of Employees Over Time</Sec>
              <ResponsiveContainer width="100%" height={215}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="period" tick={{ fill:C.muted, fontSize:9 }} interval={7} />
                  <YAxis tick={{ fill:C.muted, fontSize:10 }} />
                  <Tooltip contentStyle={TT} />
                  <Area dataKey="employees" name="Total Employees" stroke={C.purple} fill={C.purple} fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <Sec>5. Client & Pipeline Growth</Sec>
              <ResponsiveContainer width="100%" height={215}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="period" tick={{ fill:C.muted, fontSize:9 }} interval={7} />
                  <YAxis tick={{ fill:C.muted, fontSize:10 }} />
                  <Tooltip contentStyle={TT} />
                  <Legend wrapperStyle={{ fontSize:"11px" }} />
                  <ReferenceLine x={launchLabel} stroke={C.accent} strokeDasharray="4 2" />
                  <Area dataKey="pipeline" name="Pipeline" stroke={C.purple} fill={C.purple} fillOpacity={0.07} strokeWidth={1.5} strokeDasharray="4 2" />
                  <Area dataKey="clients"  name="Clients"  stroke={C.green}  fill={C.green}  fillOpacity={0.14} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <Sec>6. Cash Flow Evolution</Sec>
              <ResponsiveContainer width="100%" height={215}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="period" tick={{ fill:C.muted, fontSize:9 }} interval={7} />
                  <YAxis tickFormatter={fmtINR} tick={{ fill:C.muted, fontSize:10 }} />
                  <Tooltip contentStyle={TT} formatter={(v,n)=>[fmtINR(v),n]} />
                  <Legend wrapperStyle={{ fontSize:"11px" }} />
                  <Bar  dataKey="revenue"  name="Inflow"       fill={C.green} opacity={0.7} />
                  <Bar  dataKey="expenses" name="Outflow"      fill={C.red}   opacity={0.7} />
                  <Line dataKey="capital"  name="Rem. Capital" stroke={C.accent} dot={false} strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>

            <Card style={{ gridColumn:"1/-1" }}>
              <Sec>7. Expense Composition — Salary Growth from Hiring</Sec>
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="period" tick={{ fill:C.muted, fontSize:9 }} interval={5} />
                  <YAxis tickFormatter={fmtINR} tick={{ fill:C.muted, fontSize:10 }} />
                  <Tooltip contentStyle={TT} formatter={(v,n)=>[fmtINR(v),n]} />
                  <Legend wrapperStyle={{ fontSize:"11px" }} />
                  <ReferenceLine x={launchLabel} stroke={C.accent} strokeDasharray="4 2" />
                  <Area dataKey="salaryExp" name="Salary (incl. new hires)" stackId="e" stroke={C.red}    fill={C.red}    fillOpacity={0.45} strokeWidth={0} />
                  <Area dataKey="officeExp" name="Office (incl. new hires)" stackId="e" stroke={C.accent} fill={C.accent} fillOpacity={0.35} strokeWidth={0} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

          </div>
        )}

        {/* ══════ COMPARE ══════ */}
        {tab === "compare" && (
          <ComparePage allScenarioResults={allScenarioResults} scenarios={scenarios} />
        )}
      </div>
    </div>
  );
}
