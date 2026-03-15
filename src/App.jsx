import { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart, ReferenceLine,
  PieChart, Pie, Cell
} from "recharts";
import { PER_ACRE_DEFAULTS } from './constants/perAcreDefaults.js';
import ComparePage from './pages/ComparePage.jsx';
import InputsPage from './pages/InputsPage.jsx';

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
  bg: "#F9FAFB",
  bgCard: "#FFFFFF",
  bgHov: "#F3F4F6",
  border: "#D1D5DB",
  accent: "#d4a843",
  green: "#38c96a",
  red: "#e84545",
  blue: "#4b9cf5",
  purple: "#9b6dff",
  teal: "#2dd4bf",
  muted: "#374151",
  text: "#111827",
  dim: "#6B7280",
};

const TT = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #D1D5DB",
  borderRadius: "6px",
  color: "#111827",
  fontSize: "14px",
};

/* ────────────────────────────────────────────────
   UI ATOMS
──────────────────────────────────────────────── */
const Field = ({ label, id, value, onChange, prefix, suffix, hint }) => (
  <div style={{ marginBottom: "11px" }}>
    <label style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", color: C.muted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "4px" }}>
      <span>{label}</span>
      {hint && <span style={{ color: C.dim }}>{hint}</span>}
    </label>
    <div style={{ display: "flex", alignItems: "center", background: C.bg, border: `1px solid ${C.border}`, borderRadius: "5px", overflow: "hidden" }}>
      {prefix && <span style={{ padding: "5px 8px", color: C.accent, fontSize: "17px", borderRight: `1px solid ${C.border}`, background: C.bgHov, whiteSpace: "nowrap" }}>{prefix}</span>}
      <input
        type="number"
        value={value}
        onChange={e => onChange(id, e.target.value)}
        style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: C.text, padding: "5px 8px", fontSize: "17px", fontFamily: "monospace", minWidth: 0 }}
      />
      {suffix && <span style={{ padding: "5px 8px", color: C.muted, fontSize: "16px", borderLeft: `1px solid ${C.border}`, background: C.bgHov, whiteSpace: "nowrap" }}>{suffix}</span>}
    </div>
  </div>
);

const Card = ({ children, style = {}, variant }) => (
  <div style={{
    background: variant === "purple" ? "#F3F0FF" : C.bgCard,
    border: `1px solid ${C.border}`,
    borderRadius: "10px",
    padding: "18px",
    ...style
  }}>
    {children}
  </div>
);

const Sec = ({ children, color = C.accent }) => (
  <div style={{ fontSize: "15px", color, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "monospace", marginBottom: "14px", borderBottom: `1px solid ${C.border}`, paddingBottom: "7px" }}>
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

const DEFAULT_INP = {
  ...PER_ACRE_DEFAULTS,
  pricingModel: "annualSaas",
  useHeadcountSalaryModel: false,
  numBDPersonnel: 2,
  salaryBD: 600000,
  numPlanningSpecialists: 2,
  salaryPlanningSpecialist: 900000,
  numOperationsStaff: 1,
  salaryOperations: 500000,
  numFounders: 2,
  salaryFounder: 1200000,
  cloudInfraAnnual: 300000,
  softwareCRMAnnual: 180000,
  ebitdaPct: 30,
  valuationNow: 100000000,
  pe: 20,
  fiveYearReturn: 5,
  yoyGrowth: 60,
  avgDealSize: 5000000,
  pipelineConversion: 15,
  initialClients: 3,
  revenuePerClientY1: 5000000,
  clientGrowthQtr: 25,
  initialInvestment: 1200000,
  initialEmployees: 3,
  platformLaunchMonth: 1,
  launchBoostMultiplier: 1.5,
  indiaPct: 40,
  mePct: 25,
  europePct: 20,
  australiaPct: 15,
  indiaPctY2: 40,
  mePctY2: 25,
  europePctY2: 20,
  australiaPctY2: 15,
  indiaPctY3: 40,
  mePctY3: 25,
  europePctY3: 20,
  australiaPctY3: 15,
  indiaPctY4: 40,
  mePctY4: 25,
  europePctY4: 20,
  australiaPctY4: 15,
  indiaPctY5: 40,
  mePctY5: 25,
  europePctY5: 20,
  australiaPctY5: 15,
  aedToInr: 22.5,
  eurToInr: 90,
  audToInr: 55,
  sessionsPerClientPerMonth: 4,
  sessionCapacityPerEmployee: 20,
  onboardingSessionsPerClient: 2,
  salaryPerDesigner: 50000,
  officePerDesigner: 5000,
  salaries: 200000,
  rent: 30000,
  stackCosts: 50000,
  apiCosts: 20000,
  skuDeveloper: 1000000,
  skuDesigner: 800000,
  skuTrial: 200000,
  skuConsulting: 1500000,
  skuDeveloperY1: 1000000,
  skuDesignerY1: 800000,
  skuTrialY1: 200000,
  skuConsultingY1: 1500000,
  skuDeveloperY2: 1000000,
  skuDesignerY2: 800000,
  skuTrialY2: 200000,
  skuConsultingY2: 1500000,
  skuDeveloperY3: 1000000,
  skuDesignerY3: 800000,
  skuTrialY3: 200000,
  skuConsultingY3: 1500000,
  skuDeveloperY4: 1000000,
  skuDesignerY4: 800000,
  skuTrialY4: 200000,
  skuConsultingY4: 1500000,
  skuDeveloperY5: 1000000,
  skuDesignerY5: 800000,
  skuTrialY5: 200000,
  skuConsultingY5: 1500000,
  skuDeveloperY2_month: 0,
  skuDesignerY2_month: 0,
  skuTrialY2_month: 0,
  skuConsultingY2_month: 0,
  skuDeveloperY3_month: 0,
  skuDesignerY3_month: 0,
  skuTrialY3_month: 0,
  skuConsultingY3_month: 0,
  skuDeveloperY4_month: 0,
  skuDesignerY4_month: 0,
  skuTrialY4_month: 0,
  skuConsultingY4_month: 0,
  skuDeveloperY5_month: 0,
  skuDesignerY5_month: 0,
  skuTrialY5_month: 0,
  skuConsultingY5_month: 0,
  skuDeveloperY2_yearPct: 100, skuDeveloperY2_monthPct: 0,
  skuDesignerY2_yearPct: 100, skuDesignerY2_monthPct: 0,
  skuTrialY2_yearPct: 100, skuTrialY2_monthPct: 0,
  skuConsultingY2_yearPct: 100, skuConsultingY2_monthPct: 0,
  skuDeveloperY3_yearPct: 100, skuDeveloperY3_monthPct: 0,
  skuDesignerY3_yearPct: 100, skuDesignerY3_monthPct: 0,
  skuTrialY3_yearPct: 100, skuTrialY3_monthPct: 0,
  skuConsultingY3_yearPct: 100, skuConsultingY3_monthPct: 0,
  skuDeveloperY4_yearPct: 100, skuDeveloperY4_monthPct: 0,
  skuDesignerY4_yearPct: 100, skuDesignerY4_monthPct: 0,
  skuTrialY4_yearPct: 100, skuTrialY4_monthPct: 0,
  skuConsultingY4_yearPct: 100, skuConsultingY4_monthPct: 0,
  skuDeveloperY5_yearPct: 100, skuDeveloperY5_monthPct: 0,
  skuDesignerY5_yearPct: 100, skuDesignerY5_monthPct: 0,
  skuTrialY5_yearPct: 100, skuTrialY5_monthPct: 0,
  skuConsultingY5_yearPct: 100, skuConsultingY5_monthPct: 0,
  skuDevPct: 30,
  skuDesPct: 25,
  skuTrialPct: 20,
  skuConsPct: 25,
  inflation: 5,
};

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
    pipelineConversion, ebitdaPct, pe, valuationNow, fiveYearReturn, inflation,
  } = inp;

  const launchAbsMonth = 12 + Math.max(1, Math.min(12, Math.round(platformLaunchMonth)));

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
    const pipeline = Math.round(clients / Math.max(0.01, pipelineConversion / 100));

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

    let totalRevenueAnnual = 0;
    const skuRevenueBreakdown = { developer: 0, designer: 0, trial: 0, consulting: 0 };
    if (isPostLaunch) {
      const skus = [
        { id: "developer", pct: skuDevPct, yearlyPrice: skuPrices[year].developer, monthlyPrice: inp[`skuDeveloperY${year}_month`] },
        { id: "designer", pct: skuDesPct, yearlyPrice: skuPrices[year].designer, monthlyPrice: inp[`skuDesignerY${year}_month`] },
        { id: "trial", pct: skuTrialPct, yearlyPrice: skuPrices[year].trial, monthlyPrice: inp[`skuTrialY${year}_month`] },
        { id: "consulting", pct: skuConsPct, yearlyPrice: skuPrices[year].consulting, monthlyPrice: inp[`skuConsultingY${year}_month`] },
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
        const monthlyPrice = s.monthlyPrice > 0 ? s.monthlyPrice : (yearlyPrice / 12 || 0);
        const skuRev = (yearlyClients * yearlyPrice) + (monthlyClients * monthlyPrice * 12);
        skuRevenueBreakdown[s.id] = skuRev;
        totalRevenueAnnual += skuRev;
      }
    } else {
      totalRevenueAnnual = revenuePerClientY1 * clients;
    }

    const revenue = totalRevenueAnnual;
    const mrr = totalRevenueAnnual / 12;
    const indiaINR = clients > 0 ? revenue * (indiaC / Math.max(1, clients)) : 0;
    const meINR = clients > 0 ? revenue * (meC / Math.max(1, clients)) : 0;
    const europeINR = clients > 0 ? revenue * (europeC / Math.max(1, clients)) : 0;
    const ausINR = clients > 0 ? revenue * (ausC / Math.max(1, clients)) : 0;
    const meAED = aedToInr > 0 ? meINR / aedToInr : 0;
    const europeEUR = eurToInr > 0 ? europeINR / eurToInr : 0;
    const ausAUD = audToInr > 0 ? ausINR / audToInr : 0;

    const totalSessions = clients * (sessionsPerClientPerMonth + onboardingSessionsPerClient);
    const reqEmp = Math.ceil(totalSessions / Math.max(1, sessionCapacityPerEmployee));
    const newHires = Math.max(0, reqEmp - totalEmp);
    totalEmp = Math.max(totalEmp, reqEmp);
    const empCapacity = totalEmp * sessionCapacityPerEmployee;
    const extraEmp = Math.max(0, totalEmp - initialEmployees);

    let salaryExp;
    let officeExp;
    let totalExp;
    if (inp.useHeadcountSalaryModel) {
      salaryExp = (
        ((inp.numBDPersonnel || 0) * (inp.salaryBD || 0)) +
        ((inp.numPlanningSpecialists || 0) * (inp.salaryPlanningSpecialist || 0)) +
        ((inp.numOperationsStaff || 0) * (inp.salaryOperations || 0)) +
        ((inp.numFounders || 0) * (inp.salaryFounder || 0))
      ) / 12;
      officeExp = rent;
      totalExp = salaryExp + officeExp + ((inp.cloudInfraAnnual || 0) / 12) + ((inp.softwareCRMAnnual || 0) / 12);
    } else {
      salaryExp = salaries + extraEmp * salaryPerDesigner;
      officeExp = rent + extraEmp * officePerDesigner;
      totalExp = salaryExp + officeExp + stackCosts + apiCosts;
    }

    const net = revenue - totalExp;
    capital += net;

    rows.push({
      abs, year, miy,
      label: `Y${year}M${String(miy).padStart(2, "0")}`,
      isPostLaunch, _launch: isLaunch,
      pricingModel: inp.pricingModel,
      clients, pipeline,
      indiaC, meC, europeC, ausC,
      sessionsPerClient: sessionsPerClientPerMonth + onboardingSessionsPerClient,
      totalSessions, empCapacity, reqEmp, totalEmp, newHires,
      salaryExp, officeExp, totalExp,
      indiaINR, meINR, europeINR, ausINR,
      meAED, europeEUR, ausAUD,
      revenue, mrr: mrr ?? revenue, net, capital,
      devRev: isPostLaunch ? skuRevenueBreakdown.developer : 0,
      desRev: isPostLaunch ? skuRevenueBreakdown.designer : 0,
      trialRev: isPostLaunch ? skuRevenueBreakdown.trial : 0,
      consRev: isPostLaunch ? skuRevenueBreakdown.consulting : 0,
    });
  }

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

  return {
    rows,
    kpi: { yr5Val, yr5EBITDA, yr5Rev, yr1Total, yr5Total, lastRow, maxEmp, totalHires, monthlyBurn, runway, launchAbsMonth, avgSessionsPerClient }
  };
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
    setActiveScenarioIdx(prev => Math.max(0, Math.min(prev, scenarios.length - 2)));
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
        Australia: inp.australiaPctY2,
        'Rest of World': inp.indiaPctY2
      },
      Y3: {
        Europe: inp.europePctY3,
        USA: inp.mePctY3,
        Australia: inp.australiaPctY3,
        'Rest of World': inp.indiaPctY3
      },
      Y4: {
        Europe: inp.europePctY4,
        USA: inp.mePctY4,
        Australia: inp.australiaPctY4,
        'Rest of World': inp.indiaPctY4
      },
      Y5: {
        Europe: inp.europePctY5,
        USA: inp.mePctY5,
        Australia: inp.australiaPctY5,
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
        ::-webkit-scrollbar-track { background: #F3F4F6; }
        ::-webkit-scrollbar-thumb { background: #9CA3AF; border-radius: 3px; }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.3; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      {/* HEADER */}
      <div style={{ background: C.bgCard, borderBottom: `1px solid ${C.border}`, padding: "11px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 200 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
          <div style={{ width: "33px", height: "33px", background: `linear-gradient(135deg,${C.accent},#f07820)`, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 800, color: C.bg }}>S</div>
          <div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>Sentient Grid</div>
            <div style={{ fontSize: "14px", color: C.muted, letterSpacing: "0.07em" }}>FINANCE CENTRAL</div>
          </div>
          <div style={{ marginLeft: "14px", display: "flex", gap: "5px", flexWrap: "wrap" }}>
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
                <Bar  dataKey="revenue"  name="Monthly Revenue" fill={C.green} opacity={0.65} />
                <Line dataKey="mrr"      name="MRR"             stroke={C.blue} dot={false} strokeWidth={2} />
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
                  <Area dataKey="clients"  name="Clients"  stroke={C.green} fill={C.green} fillOpacity={0.14} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Sec>Region Mix
                  <span style={{ fontWeight: 400, fontSize: 13, color: C.muted, marginLeft: 8 }}>
                    <select value={regionMixYear} onChange={e => setRegionMixYear(e.target.value)} style={{ fontSize: 13, padding: '2px 8px', borderRadius: 4, border: `1px solid ${C.border}`, background: C.bgCard, color: C.text, marginLeft: 8 }}>
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
        {tab === "inputs" && <InputsPage inp={inp} upd={upd} updStr={updStr} kpi={kpi} fmtINR={fmtINR} />}

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
