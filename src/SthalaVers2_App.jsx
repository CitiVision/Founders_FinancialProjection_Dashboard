import { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart, ReferenceLine,
} from "recharts";

/* ─────────────────────────────────────── FORMATTERS */
const fmtINR  = (n) => { if(!n&&n!==0||isNaN(n))return"₹0"; const a=Math.abs(n),s=n<0?"-":""; if(a>=1e7)return`${s}₹${(a/1e7).toFixed(2)}Cr`; if(a>=1e5)return`${s}₹${(a/1e5).toFixed(2)}L`; if(a>=1e3)return`${s}₹${(a/1e3).toFixed(1)}K`; return`${s}₹${Math.round(a)}`; };
const fmtPct  = (n) => `${Number(n).toFixed(1)}%`;
const fmtNum  = (n) => isNaN(n)?"0":Math.round(n).toLocaleString("en-IN");
const fmtDays = (n) => `${Math.round(n)}d`;

/* ─────────────────────────────────────── THEME */
const C = { bg:"#F9FAFB",bgCard:"#FFFFFF",bgHov:"#F3F4F6",border:"#D1D5DB",accent:"#d4a843",green:"#38c96a",red:"#e84545",blue:"#4b9cf5",purple:"#9b6dff",teal:"#2dd4bf",orange:"#f97316",muted:"#374151",text:"#111827",dim:"#6B7280" };
const TT = { backgroundColor:"#fff", border:`1px solid ${C.border}`, borderRadius:"6px", color:C.text, fontSize:"12px" };

/* ─────────────────────────────────────── UI ATOMS */
const Field = ({ label, id, value, onChange, prefix, suffix, hint, readOnly, step, small }) => (
  <div style={{ marginBottom:small?"7px":"11px" }}>
    <label style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", color:C.dim, letterSpacing:"0.05em", textTransform:"uppercase", marginBottom:"3px" }}>
      <span>{label}</span>{hint&&<span style={{ color:C.accent,fontSize:"11px" }}>{hint}</span>}
    </label>
    <div style={{ display:"flex",alignItems:"center",background:"#fff",border:`1px solid ${C.border}`,borderRadius:"5px",overflow:"hidden" }}>
      {prefix&&<span style={{ padding:"4px 7px",color:C.accent,fontSize:"14px",borderRight:`1px solid ${C.border}`,background:C.bgHov,whiteSpace:"nowrap" }}>{prefix}</span>}
      <input type="number" value={value} step={step||"any"} onChange={e=>!readOnly&&onChange(id,e.target.value)} readOnly={readOnly}
        style={{ flex:1,background:readOnly?C.bgHov:"#fff",border:"none",outline:"none",color:C.text,padding:"4px 7px",fontSize:"14px",fontFamily:"monospace",minWidth:0 }} />
      {suffix&&<span style={{ padding:"4px 7px",color:C.dim,fontSize:"13px",borderLeft:`1px solid ${C.border}`,background:C.bgHov,whiteSpace:"nowrap" }}>{suffix}</span>}
    </div>
  </div>
);

const Card  = ({ children, style={}, variant }) => { const p=variant==="purple"; return <div style={{ background:p?"linear-gradient(135deg,#7C3AED,#A855F7)":C.bgCard, border:p?"none":`1px solid ${C.border}`, borderRadius:p?"14px":"10px", boxShadow:p?"0 8px 20px rgba(0,0,0,.1)":"none", padding:"16px", color:p?"#fff":C.text, ...style }}>{children}</div>; };
const Sec   = ({ children, color }) => <div style={{ fontSize:"12px",color:color||C.accent,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"monospace",marginBottom:"12px",borderBottom:`1px solid ${C.border}`,paddingBottom:"6px" }}>{children}</div>;
const KPI   = ({ label, value, sub, color=C.accent }) => <div style={{ background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:"9px",padding:"12px 15px",flex:1,minWidth:"130px" }}><div style={{ fontSize:"11px",color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:"5px" }}>{label}</div><div style={{ fontSize:"20px",fontWeight:700,color,fontFamily:"monospace",lineHeight:1 }}>{value}</div>{sub&&<div style={{ fontSize:"11px",color:C.dim,marginTop:"4px" }}>{sub}</div>}</div>;
const TabBtn= ({ active, onClick, children }) => <button onClick={onClick} style={{ background:active?C.bgHov:"transparent",border:active?`1px solid ${C.border}`:"1px solid transparent",color:active?C.accent:C.muted,padding:"5px 11px",borderRadius:"6px",cursor:"pointer",fontSize:"13px",fontFamily:"monospace",whiteSpace:"nowrap" }}>{children}</button>;

const ISRow = ({ label, values, bold, indent, color, separator, pct }) => (
  <tr style={{ background:bold?C.bgHov:"transparent", borderTop:separator?`2px solid ${C.border}`:"none" }}>
    <td style={{ padding:"5px 10px",fontSize:"13px",fontFamily:"monospace",color:color||C.text,fontWeight:bold?700:400,paddingLeft:indent?"28px":"10px",whiteSpace:"nowrap" }}>{label}</td>
    {values.map((v,i)=><td key={i} style={{ padding:"5px 12px",textAlign:"right",fontSize:"13px",fontFamily:"monospace",color:color||(typeof v==="number"&&v<0?C.red:C.text),fontWeight:bold?700:400,whiteSpace:"nowrap" }}>{pct?fmtPct(v):(typeof v==="number"?fmtINR(v):v)}</td>)}
  </tr>
);

const DataTable = ({ cols, rows }) => (
  <div style={{ overflowX:"auto",overflowY:"auto",maxHeight:"500px" }}>
    <table style={{ width:"100%",borderCollapse:"collapse",fontSize:"12px",fontFamily:"monospace" }}>
      <thead style={{ position:"sticky",top:0,zIndex:10 }}>
        <tr style={{ background:C.bgHov }}>{cols.map(c=><th key={c.key} style={{ padding:"6px 9px",textAlign:"right",color:C.muted,borderBottom:`1px solid ${C.border}`,fontSize:"11px",letterSpacing:"0.06em",textTransform:"uppercase",whiteSpace:"nowrap" }}>{c.label}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row,i)=><tr key={i} style={{ background:i%2===0?C.bg:C.bgCard }}>
          {cols.map(c=>{ const v=row[c.key]; const col=c.color?c.color(v,row):C.text; return <td key={c.key} style={{ padding:"4px 9px",textAlign:"right",color:col,whiteSpace:"nowrap" }}>{c.format?c.format(v,row):v}</td>; })}
        </tr>)}
      </tbody>
    </table>
  </div>
);

/* ─────────────────────────────────────── COST DEFAULTS (from document tables) */
// Fixed COGS ₹: Tables 17/18 — dataset + fixed cloud + semi-fixed + 3rd party (Y3+)
const D_FC  = [0, 898000, 1700000, 4795000, 7310000, 10440000];
// Variable COGS % revenue: Table 19
const D_VC  = [0, 1.9, 1.9, 2.8, 3.4, 4.2];
// Fixed Overhead sub-components ₹/year — Section 2.3 + Table 31
const D_SAL = [0, 3000000, 7000000, 15000000, 30000000, 42500000];
const D_OFF = [0,  300000,  600000,  1150000,  2250000,  3750000];
const D_SW  = [0,   60000,  110000,   200000,   300000,   400000];
const D_LEG = [0,  450000,  750000,  1500000,  2250000,  3000000];
const D_ACC = [0,  150000,  250000,   400000,   550000,   650000];
const D_INS = [0,   75000,  150000,   300000,   400000,   550000];
// Variable Overhead % revenue: Table 29
const D_VO  = [0, 8, 8, 10, 12, 15];
// D&A ₹: Table 32
const D_DNA = [0, 270000, 540000, 1410000, 2530000, 3430000];
// CapEx ₹: Table 30
const D_CAP = [0, 900000, 1350000, 2250000, 3150000, 4500000];
// Tax %
const D_TAX = [0, 0, 0, 15, 22, 25];

/* ═══════════════════════════════════════ MAIN COMPONENT */
export default function FounderDashboard() {

  const [inp, setInp] = useState({
    // ── Company ──
    startYear:2026, initialEquity:22500000, usdToInr:90,
    ebitdaPct:30, pe:20, fiveYearReturn:5,

    // ── Client counts: cumulative end-of-year targets (Table 8) ──
    nbfcY1:5,  nbfcY2:12, nbfcY3:40,  nbfcY4:80,  nbfcY5:120,
    bankY1:0,  bankY2:1,  bankY3:2,   bankY4:3,   bankY5:5,

    // ── API call rates per client type (per month) ──
    nbfcCalls:1500,   // NBFC: 1500 calls/month
    bankCalls:6000,   // Bank: 6000 calls/month

    // ── Pricing ──
    apiSalePrice:45,       // ₹ per API call
    dashSalePrice:193500,  // ₹ per client per year

    // ── Dashboard infra costs (₹/month, fixed) ──
    dashCostFrontEnd:15000, dashCostBackend:10000, dashCostDataQuery:15000,

    // ── API unit costs ₹/call (Table 33) ──
    apiCostSatellite:0.55, apiCostDataProc:0.56, apiCostCloudVar:3.05, apiCostThirdParty:1.39,

    // ── Other Income ──
    otherIncY1:0, otherIncY2:0, otherIncY3:0, otherIncY4:0, otherIncY5:0,

    // ── Fixed COGS ₹/year ──
    fixedCogsY1:D_FC[1],fixedCogsY2:D_FC[2],fixedCogsY3:D_FC[3],fixedCogsY4:D_FC[4],fixedCogsY5:D_FC[5],
    // ── Variable COGS % ──
    varCogsY1:D_VC[1],varCogsY2:D_VC[2],varCogsY3:D_VC[3],varCogsY4:D_VC[4],varCogsY5:D_VC[5],

    // ── Fixed Overhead sub-components ₹/year ──
    salY1:D_SAL[1],salY2:D_SAL[2],salY3:D_SAL[3],salY4:D_SAL[4],salY5:D_SAL[5],
    offY1:D_OFF[1],offY2:D_OFF[2],offY3:D_OFF[3],offY4:D_OFF[4],offY5:D_OFF[5],
    swY1: D_SW[1], swY2: D_SW[2], swY3: D_SW[3], swY4: D_SW[4], swY5: D_SW[5],
    legY1:D_LEG[1],legY2:D_LEG[2],legY3:D_LEG[3],legY4:D_LEG[4],legY5:D_LEG[5],
    accY1:D_ACC[1],accY2:D_ACC[2],accY3:D_ACC[3],accY4:D_ACC[4],accY5:D_ACC[5],
    insY1:D_INS[1],insY2:D_INS[2],insY3:D_INS[3],insY4:D_INS[4],insY5:D_INS[5],

    // ── Variable Overhead % ──
    varOvhY1:D_VO[1],varOvhY2:D_VO[2],varOvhY3:D_VO[3],varOvhY4:D_VO[4],varOvhY5:D_VO[5],

    // ── D&A, CapEx, Tax ──
    dnaY1:D_DNA[1],dnaY2:D_DNA[2],dnaY3:D_DNA[3],dnaY4:D_DNA[4],dnaY5:D_DNA[5],
    capexY1:D_CAP[1],capexY2:D_CAP[2],capexY3:D_CAP[3],capexY4:D_CAP[4],capexY5:D_CAP[5],
    taxY1:D_TAX[1],taxY2:D_TAX[2],taxY3:D_TAX[3],taxY4:D_TAX[4],taxY5:D_TAX[5],

    // ── Sales & Payment Pipeline ──
    salesCycleDays:120,   // contact → signed
    paymentLagDays:45,    // signed  → cash received
  });

  const upd = (k, v) => setInp(p => ({ ...p, [k]: parseFloat(v) || 0 }));
  const [tab, setTab] = useState("overview");

  /* ═══════════════════════════════════════ CORE MODEL */
  const model = useMemo(() => {
    const i = inp;

    /* ── Derived scalars ── */
    const apiUnitCost     = i.apiCostSatellite + i.apiCostDataProc + i.apiCostCloudVar + i.apiCostThirdParty;
    const dashFixedAnnual = (i.dashCostFrontEnd + i.dashCostBackend + i.dashCostDataQuery) * 12;
    const apiMarginPct    = i.apiSalePrice > 0 ? (i.apiSalePrice - apiUnitCost) / i.apiSalePrice * 100 : 0;
    const leadToCashDays  = i.salesCycleDays + i.paymentLagDays;
    // Round lead-to-cash to whole months (minimum 1)
    const lagMonths       = Math.max(1, Math.round(leadToCashDays / 30));

    /* ── Year-indexed accessors ── */
    const nbfcCum = [0, i.nbfcY1, i.nbfcY2, i.nbfcY3, i.nbfcY4, i.nbfcY5]; // cumulative
    const bankCum = [0, i.bankY1, i.bankY2, i.bankY3, i.bankY4, i.bankY5];
    const fCogs   = y => [0,i.fixedCogsY1,i.fixedCogsY2,i.fixedCogsY3,i.fixedCogsY4,i.fixedCogsY5][y];
    const vCogs   = y => [0,i.varCogsY1,i.varCogsY2,i.varCogsY3,i.varCogsY4,i.varCogsY5][y];
    const vOvh    = y => [0,i.varOvhY1,i.varOvhY2,i.varOvhY3,i.varOvhY4,i.varOvhY5][y];
    const dnaFn   = y => [0,i.dnaY1,i.dnaY2,i.dnaY3,i.dnaY4,i.dnaY5][y];
    const capex   = y => [0,i.capexY1,i.capexY2,i.capexY3,i.capexY4,i.capexY5][y];
    const taxR    = y => [0,i.taxY1,i.taxY2,i.taxY3,i.taxY4,i.taxY5][y];
    const otherI  = y => [0,i.otherIncY1,i.otherIncY2,i.otherIncY3,i.otherIncY4,i.otherIncY5][y];
    const fOvhC   = y => ({ sal:[0,i.salY1,i.salY2,i.salY3,i.salY4,i.salY5][y], off:[0,i.offY1,i.offY2,i.offY3,i.offY4,i.offY5][y], sw:[0,i.swY1,i.swY2,i.swY3,i.swY4,i.swY5][y], leg:[0,i.legY1,i.legY2,i.legY3,i.legY4,i.legY5][y], acc:[0,i.accY1,i.accY2,i.accY3,i.accY4,i.accY5][y], ins:[0,i.insY1,i.insY2,i.insY3,i.insY4,i.insY5][y] });
    const fOvh    = y => { const c=fOvhC(y); return c.sal+c.off+c.sw+c.leg+c.acc+c.ins; };

    /* ── Build client batch schedule ──────────────────────────────────
       Each year's incremental clients are split into 2 cohorts:
         Cohort 1: signs at year-start     → pays from month (yearStart + lagMonths)
         Cohort 2: signs when cohort 1 pays → pays from month (yearStart + 2 × lagMonths)
       Split: floor(delta/2) in cohort 1, remainder in cohort 2.
       This means NBFC=5 in Y1 → cohort1=2, cohort2=3  (matches user's example exactly).
    ─────────────────────────────────────────────────────────────────── */
    const batches = []; // { payMonth, nbfc, bank }
    for (let y = 1; y <= 5; y++) {
      const yearStart = (y - 1) * 12;   // 0-indexed: Y1 starts at month 0
      const dNBFC = Math.round(nbfcCum[y]) - Math.round(nbfcCum[y-1]);
      const dBank = Math.round(bankCum[y]) - Math.round(bankCum[y-1]);

      const c1NBFC = Math.floor(dNBFC / 2);
      const c2NBFC = dNBFC - c1NBFC;
      const c1Bank = Math.floor(dBank / 2);
      const c2Bank = dBank - c1Bank;

      // payMonth is 1-indexed (month 1 = first month of simulation)
      const pm1 = yearStart + lagMonths;       // first cohort starts paying
      const pm2 = yearStart + 2 * lagMonths;   // second cohort starts paying

      if ((c1NBFC + c1Bank) > 0 && pm1 <= 60) batches.push({ payMonth: pm1, nbfc: c1NBFC, bank: c1Bank });
      if ((c2NBFC + c2Bank) > 0 && pm2 <= 60) batches.push({ payMonth: pm2, nbfc: c2NBFC, bank: c2Bank });
    }

    /* ── 60-month simulation ── */
    let activeNBFC = 0, activeBank = 0, cumCapital = i.initialEquity;
    const monthRows = [];

    for (let abs = 1; abs <= 60; abs++) {
      const y   = Math.ceil(abs / 12);
      const miy = ((abs - 1) % 12) + 1;

      // Activate any cohorts whose payment clock has reached this month
      for (const b of batches) {
        if (b.payMonth === abs) { activeNBFC += b.nbfc; activeBank += b.bank; }
      }

      // Client counts — integers
      const dashClients  = activeNBFC + activeBank;           // integer
      const apiCallsMo   = activeNBFC * i.nbfcCalls + activeBank * i.bankCalls;  // integer

      // Revenue — only non-zero once batches start paying
      const mApiRev  = apiCallsMo * i.apiSalePrice;
      const mDashRev = dashClients * (i.dashSalePrice / 12);
      const mRev     = mApiRev + mDashRev + (otherI(y) / 12);

      // COGS
      const mVarCogs  = mRev * (vCogs(y) / 100);
      const mFixCogs  = fCogs(y) / 12;
      const mTotCogs  = mVarCogs + mFixCogs;
      const mGP       = mRev - mTotCogs;
      const mGPpct    = mRev > 0 ? (mGP / mRev) * 100 : 0;

      // Fixed Overhead — each sub-component ÷ 12
      const comp  = fOvhC(y);
      const mSal  = comp.sal / 12, mOff = comp.off / 12, mSw  = comp.sw  / 12;
      const mLeg  = comp.leg / 12, mAcc = comp.acc / 12, mIns = comp.ins / 12;
      const mFixOH= mSal + mOff + mSw + mLeg + mAcc + mIns;

      // Variable Overhead
      const mVarOH   = mRev * (vOvh(y) / 100);
      const mTotOH   = mFixOH + mVarOH;

      // EBITDA
      const mEbitda  = mGP - mTotOH;

      // Base burn = fixed costs only (what you spend even with zero revenue)
      const mBaseBurn = mFixCogs + mFixOH;
      const mTotCost  = mTotCogs + mTotOH;

      const mNetCF    = mEbitda - capex(y) / 12;
      cumCapital     += mNetCF;

      // Which cohort events fired this month (for annotation)
      const cohortEvents = batches.filter(b => b.payMonth === abs);

      monthRows.push({
        abs, year:y, miy, label:`Y${y}M${String(miy).padStart(2,"0")}`,
        activeNBFC, activeBank, dashClients, apiCallsMo,
        mRev, mApiRev, mDashRev,
        mVarCogs, mFixCogs, mTotCogs, mGP, mGPpct,
        mSal, mOff, mFixOH, mVarOH, mTotOH,
        mEbitda, mBaseBurn, mTotCost, mNetCF, cumCapital,
        cohortEvent: cohortEvents.length > 0,
        cohortLabel: cohortEvents.map(b=>`+${b.nbfc}N${b.bank>0?`+${b.bank}B`:""}`).join(" "),
      });
    }

    /* ── Annual Income Statement — aggregated from monthly rows ── */
    const is = [];
    for (let y = 1; y <= 5; y++) {
      const yr = monthRows.filter(r => r.year === y);
      const sum = (key) => yr.reduce((s, r) => s + (r[key] || 0), 0);

      const totalInc  = sum("mRev");
      const varCogs_  = sum("mVarCogs");
      const fixCogs_  = sum("mFixCogs");
      const totCogs   = varCogs_ + fixCogs_;
      const gp        = totalInc - totCogs;
      const gpPct     = totalInc > 0 ? (gp / totalInc) * 100 : 0;
      const varOH_    = sum("mVarOH");
      const fixOH_    = sum("mFixOH");
      const totOH     = varOH_ + fixOH_;
      const ebitda    = gp - totOH;
      const ebitdaMgn = totalInc > 0 ? (ebitda / totalInc) * 100 : 0;
      const dna       = dnaFn(y);
      const ebit      = ebitda - dna;
      const taxAmt    = ebitda > 0 ? ebitda * (taxR(y) / 100) : 0;
      const netIncome = ebit - taxAmt;
      const apiRev_   = sum("mApiRev");
      const dashRev_  = sum("mDashRev");
      const capexY    = capex(y);
      const comp      = fOvhC(y);

      // Per-client unit economics
      const maxClients = yr.length > 0 ? Math.max(...yr.map(r => r.dashClients)) : 0;
      const dashUnitCost = maxClients > 0 ? dashFixedAnnual / maxClients : 0;
      const dashMgnPct   = i.dashSalePrice > 0 ? ((i.dashSalePrice - dashUnitCost) / i.dashSalePrice) * 100 : 0;
      const maxApiCalls  = yr.length > 0 ? Math.max(...yr.map(r => r.apiCallsMo)) : 0;
      const apiTotCogs   = maxApiCalls * 12 * apiUnitCost;

      is.push({ year:y, label:`Y${y} (${i.startYear+y-1})`,
        apiRev:apiRev_, dashRev:dashRev_, totalInc, varCogs:varCogs_, fixCogs:fixCogs_, totCogs, gp, gpPct,
        varOH:varOH_, fixOH:fixOH_, totOH, ebitda, ebitdaMgn, dna, ebit, taxAmt, netIncome,
        capexY, fOvhComp:comp, dashUnitCost, dashMgnPct, apiTotCogs,
        maxClients,
      });
    }

    /* ── Cash Flow (from IS) ── */
    let cashBal = i.initialEquity;
    const cf = is.map(r => {
      const operatingCF = r.netIncome + r.dna;
      const investingCF = -r.capexY;
      const financingCF = r.year === 1 ? i.initialEquity : 0;
      const netCF = operatingCF + investingCF + financingCF;
      const beginCash = cashBal; cashBal += netCF;
      return { ...r, operatingCF, investingCF, financingCF, netCF, beginCash, endCash:cashBal };
    });

    /* ── Balance Sheet ── */
    let bfwdFA=0, eqAccum=i.initialEquity, curAssets=i.initialEquity*0.75;
    const bs = is.map(r => {
      const fa_nbv = bfwdFA + r.capexY - r.dna; bfwdFA = fa_nbv;
      eqAccum += r.netIncome; curAssets += Math.max(0, r.netIncome * 0.3);
      const totalAssets=curAssets+fa_nbv, totalLiab=totalAssets*0.12;
      return { year:r.year, label:r.label, curAssets, fa_nbv, totalAssets, totalLiab, equity:eqAccum, totalLiabEq:totalLiab+eqAccum };
    });

    /* ── KPIs ── */
    const yr1Rev     = is[0].totalInc;
    const yr5Rev     = is[4].totalInc;
    const yr5Ebitda  = is[4].ebitda;
    const yr5ValImp  = (yr5Ebitda / (i.ebitdaPct / 100)) * i.pe;
    const y1BaseBurn = (fCogs(1) + fOvh(1)) / 12;
    const runway     = y1BaseBurn > 0 ? Math.floor(i.initialEquity / y1BaseBurn) : 99;
    // First revenue month
    const firstRevMonth = batches.length > 0 ? Math.min(...batches.map(b=>b.payMonth)) : lagMonths;

    return { is, cf, bs, monthRows, batches, apiUnitCost, apiMarginPct, dashFixedAnnual, leadToCashDays, lagMonths, firstRevMonth,
      kpi:{ yr1Rev, yr5Rev, yr5Ebitda, yr5ValImp, y1BaseBurn, runway } };
  }, [inp]);

  const { is, cf, bs, monthRows, batches, apiUnitCost, apiMarginPct, dashFixedAnnual, leadToCashDays, lagMonths, firstRevMonth, kpi } = model;

  /* ═══════════════════════════════════════ RENDER */
  return (
    <div style={{ background:C.bg, minHeight:"100vh", fontFamily:"system-ui, sans-serif", color:C.text }}>

      {/* HEADER */}
      <div style={{ background:C.bgCard, borderBottom:`1px solid ${C.border}`, padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"8px" }}>
        <div>
          <div style={{ fontSize:"18px", fontWeight:700, letterSpacing:"0.05em", color:C.accent }}>◈ FOUNDER FINANCIAL DASHBOARD</div>
          <div style={{ fontSize:"11px", color:C.dim }}>Sthala · Geospatial Risk Intelligence · T+5 · Revenue starts Month {firstRevMonth} (Day {Math.round(firstRevMonth*30)})</div>
        </div>
        <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
          {[["overview","Overview"],["inputs","Inputs"],["pipeline","Client Pipeline"],["unitcosts","Unit Costs"],["income","Income Stmt"],["cashflow","Cash Flow"],["balsheet","Balance Sheet"],["monthly","Monthly"],["charts","Charts"]].map(([k,l])=>
            <TabBtn key={k} active={tab===k} onClick={()=>setTab(k)}>{l}</TabBtn>)}
        </div>
      </div>

      <div style={{ maxWidth:"1440px", margin:"0 auto", padding:"18px 20px" }}>

        {/* ══ OVERVIEW ══ */}
        {tab==="overview" && (<>
          <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", marginBottom:"16px" }}>
            <KPI label="Y1 Revenue"        value={fmtINR(kpi.yr1Rev)}      color={C.green} sub={`Starts Month ${firstRevMonth}`} />
            <KPI label="Y5 Revenue"        value={fmtINR(kpi.yr5Rev)}      color={C.blue} />
            <KPI label="Y5 EBITDA"         value={fmtINR(kpi.yr5Ebitda)}   color={C.teal} />
            <KPI label="Implied Y5 Val"    value={fmtINR(kpi.yr5ValImp)}   color={C.purple} sub={`${inp.pe}× EBITDA`} />
            <KPI label="Base Monthly Burn" value={fmtINR(kpi.y1BaseBurn)}  color={C.red} sub="Fixed COGS + OH ÷ 12" />
            <KPI label="Runway"            value={`${kpi.runway} mo`}      color={C.accent} sub="Equity ÷ base burn" />
            <KPI label="Lead → Cash"       value={fmtDays(leadToCashDays)} color={C.orange} sub={`${inp.salesCycleDays}d + ${inp.paymentLagDays}d`} />
            <KPI label="Rev Delay"         value={`${lagMonths} mo`}       color={C.red} sub="Months before first ₹" />
          </div>

          {/* Cohort timeline summary */}
          <Card style={{ marginBottom:"14px", background:`${C.orange}07`, border:`1px solid ${C.orange}40` }}>
            <Sec color={C.orange}>Client Cohort Onboarding Schedule (Lead-to-Cash = {leadToCashDays}d → {lagMonths} months delay)</Sec>
            <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
              {batches.map((b, idx) => (
                <div key={idx} style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:"7px", padding:"8px 12px", minWidth:"110px" }}>
                  <div style={{ fontSize:"11px", color:C.dim }}>Month {b.payMonth}</div>
                  <div style={{ fontSize:"14px", fontWeight:700, color:C.orange, fontFamily:"monospace" }}>+{b.nbfc} NBFC{b.bank>0?` +${b.bank} Bank`:""}</div>
                  <div style={{ fontSize:"11px", color:C.muted }}>{fmtNum((b.nbfc*inp.nbfcCalls+b.bank*inp.bankCalls))} calls/mo</div>
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ marginBottom:"14px" }}>
            <Sec>5-Year Revenue vs Profitability (Revenue delayed by {lagMonths} months)</Sec>
            <ResponsiveContainer width="100%" height={230}>
              <ComposedChart data={is}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="label" tick={{ fill:C.muted, fontSize:10 }} />
                <YAxis tickFormatter={fmtINR} tick={{ fill:C.muted, fontSize:9 }} />
                <Tooltip contentStyle={TT} formatter={(v,n)=>[fmtINR(v),n]} />
                <Legend wrapperStyle={{ fontSize:"11px" }} />
                <Bar dataKey="totalInc"   name="Revenue"      fill={C.green}  opacity={0.85} />
                <Bar dataKey="gp"         name="Gross Profit" fill={C.blue}   opacity={0.8} />
                <Bar dataKey="ebitda"     name="EBITDA"       fill={C.teal}   opacity={0.8} />
                <Line dataKey="netIncome" name="Net Income"   stroke={C.accent} strokeWidth={2} dot />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"14px" }}>
            <Card>
              <Sec>Gross Margin % — YoY (improves with scale)</Sec>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={is}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="label" tick={{ fill:C.muted, fontSize:9 }} />
                  <YAxis tickFormatter={v=>`${v.toFixed(0)}%`} domain={[0,100]} tick={{ fill:C.muted, fontSize:9 }} />
                  <Tooltip contentStyle={TT} formatter={v=>[`${v.toFixed(1)}%`,"Gross Margin"]} />
                  <Bar dataKey="gpPct" name="Gross Margin %" fill={C.green} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <Sec>Monthly Revenue vs Base Burn (60 mo)</Sec>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={monthRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="label" tick={{ fill:C.muted, fontSize:7 }} interval={7} />
                  <YAxis tickFormatter={fmtINR} tick={{ fill:C.muted, fontSize:8 }} />
                  <Tooltip contentStyle={TT} formatter={(v,n)=>[fmtINR(v),n]} />
                  <Legend wrapperStyle={{ fontSize:"10px" }} />
                  <Bar  dataKey="mBaseBurn"  name="Base Burn"    fill={C.red}    opacity={0.5} />
                  <Line dataKey="mRev"       name="Revenue"      stroke={C.green} strokeWidth={2} dot={false} />
                  <Line dataKey="cumCapital" name="Cum Capital"  stroke={C.accent} strokeWidth={1.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <Sec>Monthly Client Count — Step Function</Sec>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={monthRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="label" tick={{ fill:C.muted, fontSize:7 }} interval={7} />
                  <YAxis tick={{ fill:C.muted, fontSize:9 }} />
                  <Tooltip contentStyle={TT} formatter={(v,n)=>[fmtNum(v),n]} />
                  <Legend wrapperStyle={{ fontSize:"10px" }} />
                  <Area dataKey="activeNBFC" name="NBFCs" stroke={C.purple} fill={C.purple} fillOpacity={0.3} stackId="c" />
                  <Area dataKey="activeBank" name="Banks" stroke={C.blue}   fill={C.blue}   fillOpacity={0.3} stackId="c" />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </>)}

        {/* ══ INPUTS ══ */}
        {tab==="inputs" && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"14px" }}>

            {/* Sales & Payment Pipeline */}
            <Card style={{ gridColumn:"1/-1", background:`${C.orange}08`, border:`1px solid ${C.orange}55` }}>
              <Sec color={C.orange}>Sales & Payment Pipeline Metrics</Sec>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"14px", alignItems:"end" }}>
                <Field label="Sales Cycle Days" id="salesCycleDays" value={inp.salesCycleDays} onChange={upd} suffix="days" hint="Contact → Signed" />
                <Field label="Payment Lag Days" id="paymentLagDays" value={inp.paymentLagDays} onChange={upd} suffix="days" hint="Signed → Cash" />
                <div>
                  <div style={{ fontSize:"12px",color:C.dim,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:"3px" }}>Lead to Cash</div>
                  <div style={{ background:C.bgHov,border:`1px solid ${C.orange}`,borderRadius:"5px",padding:"5px 10px",fontFamily:"monospace",fontSize:"20px",color:C.orange,fontWeight:700 }}>{leadToCashDays} days</div>
                </div>
                <div>
                  <div style={{ fontSize:"12px",color:C.dim,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:"3px" }}>= Months Delayed</div>
                  <div style={{ background:C.bgHov,border:`1px solid ${C.red}55`,borderRadius:"5px",padding:"5px 10px",fontFamily:"monospace",fontSize:"20px",color:C.red,fontWeight:700 }}>{lagMonths} months</div>
                  <div style={{ fontSize:"11px",color:C.dim,marginTop:"3px" }}>First revenue: Month {firstRevMonth}</div>
                </div>
                <div>
                  <div style={{ fontSize:"12px",color:C.dim,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:"3px" }}>Zero-Rev Months</div>
                  <div style={{ background:C.bgHov,border:`1px solid ${C.red}55`,borderRadius:"5px",padding:"5px 10px",fontFamily:"monospace",fontSize:"20px",color:C.red,fontWeight:700 }}>{Math.max(0, firstRevMonth - 1)}</div>
                  <div style={{ fontSize:"11px",color:C.dim,marginTop:"3px" }}>Burn-only period</div>
                </div>
              </div>
            </Card>

            {/* Client targets */}
            <Card variant="purple">
              <Sec color="#fff">NBFC Clients — Table 8 (Cumulative)</Sec>
              {[1,2,3,4,5].map(y=><Field key={y} label={`Y${y} NBFCs`} id={`nbfcY${y}`} value={inp[`nbfcY${y}`]} onChange={upd} small />)}
              <div style={{ borderTop:"1px solid rgba(255,255,255,.2)",margin:"8px 0 6px",fontSize:"11px",color:"#ddd" }}>API CALLS / MONTH</div>
              <Field label="NBFC calls/mo" id="nbfcCalls" value={inp.nbfcCalls} onChange={upd} small />
            </Card>

            <Card variant="purple">
              <Sec color="#fff">Bank Clients — Table 8 (Cumulative)</Sec>
              {[1,2,3,4,5].map(y=><Field key={y} label={`Y${y} Banks`} id={`bankY${y}`} value={inp[`bankY${y}`]} onChange={upd} small />)}
              <div style={{ borderTop:"1px solid rgba(255,255,255,.2)",margin:"8px 0 6px",fontSize:"11px",color:"#ddd" }}>API CALLS / MONTH</div>
              <Field label="Bank calls/mo" id="bankCalls" value={inp.bankCalls} onChange={upd} small />
            </Card>

            {/* Pricing */}
            <Card>
              <Sec>Pricing</Sec>
              <Field label="API Sale Price / Call" id="apiSalePrice"   value={inp.apiSalePrice}   onChange={upd} prefix="₹" />
              <Field label="Dashboard / Client / Year" id="dashSalePrice" value={inp.dashSalePrice} onChange={upd} prefix="₹" />
              <Sec style={{ marginTop:"14px" }}>API Unit Cost (₹/call) — Table 33</Sec>
              <Field label="Satellite & StreetView"      id="apiCostSatellite"  value={inp.apiCostSatellite}  onChange={upd} prefix="₹" step="0.01" small />
              <Field label="Data Processing"             id="apiCostDataProc"   value={inp.apiCostDataProc}   onChange={upd} prefix="₹" step="0.01" small />
              <Field label="Cloud (Fixed+Semi ÷ calls)"  id="apiCostCloudVar"   value={inp.apiCostCloudVar}   onChange={upd} prefix="₹" step="0.01" small />
              <Field label="Third Party Data APIs"       id="apiCostThirdParty" value={inp.apiCostThirdParty} onChange={upd} prefix="₹" step="0.01" small />
              <div style={{ padding:"7px 10px",background:C.bgHov,borderRadius:"5px",marginTop:"4px" }}>
                <div style={{ fontSize:"11px",color:C.dim }}>Total COGS / Call</div>
                <div style={{ fontSize:"15px",fontWeight:700,color:C.red,fontFamily:"monospace" }}>₹{apiUnitCost.toFixed(2)}</div>
                <div style={{ fontSize:"11px",color:C.green }}>Margin: {apiMarginPct.toFixed(1)}%</div>
              </div>
            </Card>

            {/* COGS */}
            <Card>
              <Sec>COGS — Tables 17-19</Sec>
              <div style={{ fontSize:"11px",color:C.dim,marginBottom:"5px" }}>Variable COGS % Revenue</div>
              {[1,2,3,4,5].map(y=><Field key={y} label={`Y${y}`} id={`varCogsY${y}`} value={inp[`varCogsY${y}`]} onChange={upd} suffix="%" small />)}
              <div style={{ fontSize:"11px",color:C.dim,margin:"8px 0 5px" }}>Fixed COGS ₹/year (Dataset+Cloud)</div>
              {[1,2,3,4,5].map(y=><Field key={y} label={`Y${y}`} id={`fixedCogsY${y}`} value={inp[`fixedCogsY${y}`]} onChange={upd} prefix="₹" small />)}
            </Card>

            {/* Variable OH + Other Income */}
            <Card>
              <Sec>Variable Overhead % — Table 29</Sec>
              {[1,2,3,4,5].map(y=><Field key={y} label={`Y${y}`} id={`varOvhY${y}`} value={inp[`varOvhY${y}`]} onChange={upd} suffix="%" small />)}
              <Sec style={{ marginTop:"12px" }}>Other Income / Grants (₹)</Sec>
              {[1,2,3,4,5].map(y=><Field key={y} label={`Y${y}`} id={`otherIncY${y}`} value={inp[`otherIncY${y}`]} onChange={upd} prefix="₹" small />)}
            </Card>

            {/* Salaries + Office */}
            <Card>
              <Sec>Salaries (₹/yr) — Table 26</Sec>
              {[1,2,3,4,5].map(y=><Field key={y} label={`Y${y}`} id={`salY${y}`} value={inp[`salY${y}`]} onChange={upd} prefix="₹" small />)}
              <Sec style={{ marginTop:"12px" }}>Office / Co-working (₹/yr)</Sec>
              {[1,2,3,4,5].map(y=><Field key={y} label={`Y${y}`} id={`offY${y}`} value={inp[`offY${y}`]} onChange={upd} prefix="₹" small />)}
            </Card>

            {/* Software, Legal, Accounting, Insurance */}
            <Card>
              <Sec>Fixed OH — Other (₹/yr)</Sec>
              <div style={{ fontSize:"11px",color:C.dim,marginBottom:"4px" }}>Software / AI Tools</div>
              {[1,2,3,4,5].map(y=><Field key={y} label={`Y${y}`} id={`swY${y}`} value={inp[`swY${y}`]} onChange={upd} prefix="₹" small />)}
              <div style={{ fontSize:"11px",color:C.dim,margin:"6px 0 4px" }}>Legal & Compliance</div>
              {[1,2,3,4,5].map(y=><Field key={y} label={`Y${y}`} id={`legY${y}`} value={inp[`legY${y}`]} onChange={upd} prefix="₹" small />)}
              <div style={{ fontSize:"11px",color:C.dim,margin:"6px 0 4px" }}>Accounting & Tax</div>
              {[1,2,3,4,5].map(y=><Field key={y} label={`Y${y}`} id={`accY${y}`} value={inp[`accY${y}`]} onChange={upd} prefix="₹" small />)}
              <div style={{ fontSize:"11px",color:C.dim,margin:"6px 0 4px" }}>Insurance</div>
              {[1,2,3,4,5].map(y=><Field key={y} label={`Y${y}`} id={`insY${y}`} value={inp[`insY${y}`]} onChange={upd} prefix="₹" small />)}
            </Card>

            {/* CapEx + D&A + Tax + Company */}
            <Card>
              <Sec>CapEx (₹/yr) — Table 30</Sec>
              {[1,2,3,4,5].map(y=><Field key={y} label={`Y${y}`} id={`capexY${y}`} value={inp[`capexY${y}`]} onChange={upd} prefix="₹" small />)}
              <Sec style={{ marginTop:"12px" }}>D&A (₹/yr) — Table 32</Sec>
              {[1,2,3,4,5].map(y=><Field key={y} label={`Y${y}`} id={`dnaY${y}`} value={inp[`dnaY${y}`]} onChange={upd} prefix="₹" small />)}
              <Sec style={{ marginTop:"12px" }}>Tax Rate (%)</Sec>
              {[1,2,3,4,5].map(y=><Field key={y} label={`Y${y}`} id={`taxY${y}`} value={inp[`taxY${y}`]} onChange={upd} suffix="%" small />)}
            </Card>

            {/* Dashboard infra + Company */}
            <Card>
              <Sec>Dashboard Infra (₹/month)</Sec>
              <Field label="Front End Hosting"   id="dashCostFrontEnd"  value={inp.dashCostFrontEnd}  onChange={upd} prefix="₹" small />
              <Field label="Backend (Auth+APIs)" id="dashCostBackend"   value={inp.dashCostBackend}   onChange={upd} prefix="₹" small />
              <Field label="Data Query Load"     id="dashCostDataQuery" value={inp.dashCostDataQuery} onChange={upd} prefix="₹" small />
              <div style={{ padding:"6px 9px",background:C.bgHov,borderRadius:"5px",marginTop:"4px",marginBottom:"12px" }}>
                <div style={{ fontSize:"11px",color:C.dim }}>Fixed Infra / Month</div>
                <div style={{ fontSize:"15px",fontWeight:700,color:C.red,fontFamily:"monospace" }}>{fmtINR(dashFixedAnnual/12)}</div>
              </div>
              <Sec>Company & Valuation</Sec>
              <Field label="Initial Equity"  id="initialEquity"  value={inp.initialEquity}  onChange={upd} prefix="₹" small />
              <Field label="USD → INR"       id="usdToInr"        value={inp.usdToInr}        onChange={upd} suffix="₹" small />
              <Field label="EBITDA Target %" id="ebitdaPct"       value={inp.ebitdaPct}        onChange={upd} suffix="%" small />
              <Field label="P/E Multiple"    id="pe"              value={inp.pe}               onChange={upd} small />
            </Card>

          </div>
        )}

        {/* ══ CLIENT PIPELINE ══ */}
        {tab==="pipeline" && (<>
          <Card style={{ marginBottom:"14px" }}>
            <Sec>Client Cohort Onboarding Schedule — Lead-to-Cash = {leadToCashDays} days ({lagMonths} months delay)</Sec>
            <div style={{ fontSize:"12px", color:C.dim, marginBottom:"12px" }}>
              Each year's incremental clients split into 2 cohorts: Cohort 1 pays at <strong>yearStart + {lagMonths}mo</strong>, Cohort 2 pays at <strong>yearStart + {lagMonths*2}mo</strong>. No revenue before Month {firstRevMonth}.
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"monospace", fontSize:"13px" }}>
              <thead><tr style={{ background:C.bgHov }}>
                {["Month","Day (Approx)","New NBFCs","New Banks","Total NBFCs","Total Banks","API Calls/Mo","Monthly Rev Impact"].map(h=><th key={h} style={{ padding:"7px 10px",textAlign:"right",color:C.muted,borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap" }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {batches.map((b, idx) => {
                  const cumNBFC = batches.slice(0,idx+1).reduce((s,x)=>s+x.nbfc,0);
                  const cumBank = batches.slice(0,idx+1).reduce((s,x)=>s+x.bank,0);
                  const calls   = cumNBFC*inp.nbfcCalls + cumBank*inp.bankCalls;
                  const revImpact = (b.nbfc*inp.nbfcCalls+b.bank*inp.bankCalls)*inp.apiSalePrice + (b.nbfc+b.bank)*(inp.dashSalePrice/12);
                  return (
                    <tr key={idx} style={{ background:idx%2===0?C.bg:C.bgCard, borderLeft:`3px solid ${C.orange}` }}>
                      <td style={{ padding:"6px 10px",textAlign:"right",fontWeight:700,color:C.orange }}>Month {b.payMonth}</td>
                      <td style={{ padding:"6px 10px",textAlign:"right",color:C.dim }}>~Day {b.payMonth*30}</td>
                      <td style={{ padding:"6px 10px",textAlign:"right",color:C.purple }}>{b.nbfc > 0 ? `+${b.nbfc}` : "—"}</td>
                      <td style={{ padding:"6px 10px",textAlign:"right",color:C.blue }}>{b.bank > 0 ? `+${b.bank}` : "—"}</td>
                      <td style={{ padding:"6px 10px",textAlign:"right",color:C.purple,fontWeight:700 }}>{cumNBFC}</td>
                      <td style={{ padding:"6px 10px",textAlign:"right",color:C.blue,fontWeight:700 }}>{cumBank}</td>
                      <td style={{ padding:"6px 10px",textAlign:"right" }}>{fmtNum(calls)}</td>
                      <td style={{ padding:"6px 10px",textAlign:"right",color:C.green }}>{fmtINR(revImpact)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
            <Card>
              <Sec>Client Step-Function — NBFC & Banks (60 mo)</Sec>
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={monthRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="label" tick={{ fill:C.muted, fontSize:7 }} interval={5} />
                  <YAxis tick={{ fill:C.muted, fontSize:9 }} />
                  <Tooltip contentStyle={TT} formatter={(v,n)=>[fmtNum(v),n]} />
                  <Legend wrapperStyle={{ fontSize:"11px" }} />
                  <Area dataKey="activeNBFC" name="NBFCs"       stroke={C.purple} fill={C.purple} fillOpacity={0.3} stackId="c" />
                  <Area dataKey="activeBank" name="Banks"       stroke={C.blue}   fill={C.blue}   fillOpacity={0.3} stackId="c" />
                  <Line dataKey="dashClients" name="Total Clients" stroke={C.accent} strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <Sec>Monthly API Calls — Step Spikes on Client Onboarding</Sec>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={monthRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="label" tick={{ fill:C.muted, fontSize:7 }} interval={5} />
                  <YAxis tickFormatter={fmtNum} tick={{ fill:C.muted, fontSize:9 }} />
                  <Tooltip contentStyle={TT} formatter={(v,n)=>[fmtNum(v),n]} />
                  <Area dataKey="apiCallsMo" name="API Calls/Month" stroke={C.teal} fill={C.teal} fillOpacity={0.25} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </>)}

        {/* ══ UNIT COSTS ══ */}
        {tab==="unitcosts" && (<>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
            <Card>
              <Sec>SKU 1 — InSite API · Cost per Call (Table 33)</Sec>
              <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"monospace", fontSize:"13px" }}>
                <thead><tr style={{ background:C.bgHov }}>{["Component","₹/Call","% Sale"].map(h=><th key={h} style={{ padding:"7px 10px",textAlign:h==="Component"?"left":"right",color:C.muted,borderBottom:`1px solid ${C.border}` }}>{h}</th>)}</tr></thead>
                <tbody>
                  {[["Satellite & StreetView",inp.apiCostSatellite],["Data Processing",inp.apiCostDataProc],["Cloud (Fixed+Semi÷calls)",inp.apiCostCloudVar],["Third Party Data APIs",inp.apiCostThirdParty]].map(([l,c])=>(
                    <tr key={l} style={{ borderBottom:`1px solid ${C.border}` }}>
                      <td style={{ padding:"6px 10px" }}>{l}</td>
                      <td style={{ padding:"6px 10px",textAlign:"right",color:C.red }}>₹{Number(c).toFixed(2)}</td>
                      <td style={{ padding:"6px 10px",textAlign:"right",color:C.dim }}>{inp.apiSalePrice>0?fmtPct(Number(c)/inp.apiSalePrice*100):"–"}</td>
                    </tr>))}
                  <tr style={{ background:C.bgHov,fontWeight:700 }}>
                    <td style={{ padding:"7px 10px" }}>Total COGS / Call</td>
                    <td style={{ padding:"7px 10px",textAlign:"right",color:C.red }}>₹{apiUnitCost.toFixed(2)}</td>
                    <td style={{ padding:"7px 10px",textAlign:"right" }}>{fmtPct(apiUnitCost/inp.apiSalePrice*100)}</td>
                  </tr>
                  <tr style={{ background:`${C.green}15`,fontWeight:700 }}>
                    <td style={{ padding:"7px 10px",color:C.green }}>Sale Price / Call</td>
                    <td style={{ padding:"7px 10px",textAlign:"right",color:C.green }}>₹{inp.apiSalePrice}</td>
                    <td style={{ padding:"7px 10px",textAlign:"right",color:C.green }}>100%</td>
                  </tr>
                  <tr style={{ background:`${C.green}08`,fontWeight:700 }}>
                    <td style={{ padding:"7px 10px",color:C.green }}>Gross Margin / Call</td>
                    <td style={{ padding:"7px 10px",textAlign:"right",color:C.green }}>₹{(inp.apiSalePrice-apiUnitCost).toFixed(2)}</td>
                    <td style={{ padding:"7px 10px",textAlign:"right",color:C.green }}>{fmtPct(apiMarginPct)}</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop:"16px" }}>
                <Sec>API Volume & Margin by Year</Sec>
                <table style={{ width:"100%",borderCollapse:"collapse",fontFamily:"monospace",fontSize:"12px" }}>
                  <thead><tr style={{ background:C.bgHov }}>{["Year","Max Calls/Mo","Revenue","GP","Margin"].map(h=><th key={h} style={{ padding:"5px 9px",textAlign:"right",color:C.muted,borderBottom:`1px solid ${C.border}` }}>{h}</th>)}</tr></thead>
                  <tbody>{is.map(r=>{ const gp=r.apiRev-r.apiTotCogs; const m=r.apiRev>0?gp/r.apiRev*100:0; return (
                    <tr key={r.year} style={{ borderBottom:`1px solid ${C.border}` }}>
                      <td style={{ padding:"4px 9px",textAlign:"right",color:C.accent }}>{r.label}</td>
                      <td style={{ padding:"4px 9px",textAlign:"right" }}>{fmtNum(r.maxClients>0?r.maxClients*(inp.nbfcCalls+inp.bankCalls)/2:0)}</td>
                      <td style={{ padding:"4px 9px",textAlign:"right",color:C.green }}>{fmtINR(r.apiRev)}</td>
                      <td style={{ padding:"4px 9px",textAlign:"right",color:C.blue }}>{fmtINR(gp)}</td>
                      <td style={{ padding:"4px 9px",textAlign:"right",color:m>0?C.green:C.red }}>{fmtPct(m)}</td>
                    </tr>);})}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <Sec>SKU 2 — Dashboard · Scale Economics</Sec>
              <table style={{ width:"100%",borderCollapse:"collapse",fontFamily:"monospace",fontSize:"13px" }}>
                <thead><tr style={{ background:C.bgHov }}>{["Year","Max Clients","Revenue","Infra Cost","Unit Cost","Margin"].map(h=><th key={h} style={{ padding:"5px 9px",textAlign:"right",color:C.muted,borderBottom:`1px solid ${C.border}` }}>{h}</th>)}</tr></thead>
                <tbody>{is.map(r=>(
                  <tr key={r.year} style={{ borderBottom:`1px solid ${C.border}` }}>
                    <td style={{ padding:"4px 9px",textAlign:"right",color:C.accent }}>{r.label}</td>
                    <td style={{ padding:"4px 9px",textAlign:"right" }}>{r.maxClients}</td>
                    <td style={{ padding:"4px 9px",textAlign:"right",color:C.green }}>{fmtINR(r.dashRev)}</td>
                    <td style={{ padding:"4px 9px",textAlign:"right",color:C.red }}>{fmtINR(dashFixedAnnual)}</td>
                    <td style={{ padding:"4px 9px",textAlign:"right",color:C.orange }}>{fmtINR(r.dashUnitCost)}</td>
                    <td style={{ padding:"4px 9px",textAlign:"right",color:r.dashMgnPct>0?C.green:C.red }}>{fmtPct(r.dashMgnPct)}</td>
                  </tr>))}
                </tbody>
              </table>
            </Card>
          </div>
        </>)}

        {/* ══ INCOME STATEMENT ══ */}
        {tab==="income" && (<>
          <Card style={{ marginBottom:"14px" }}>
            <Sec>Income Statement — 5-Year (₹) · Aggregated from monthly actuals · Revenue delayed {lagMonths} months</Sec>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%",borderCollapse:"collapse",fontFamily:"monospace",fontSize:"13px" }}>
                <thead><tr style={{ background:C.bgHov }}>
                  <th style={{ padding:"7px 10px",textAlign:"left",color:C.muted,borderBottom:`2px solid ${C.border}`,width:"230px" }}>Line Item</th>
                  {is.map(r=><th key={r.year} style={{ padding:"7px 14px",textAlign:"right",color:C.accent,borderBottom:`2px solid ${C.border}`,whiteSpace:"nowrap" }}>{r.label}</th>)}
                </tr></thead>
                <tbody>
                  <ISRow label="InSite API Revenue"         values={is.map(r=>r.apiRev)}     indent color={C.purple} />
                  <ISRow label="Dashboard Revenue"          values={is.map(r=>r.dashRev)}    indent color={C.teal} />
                  <ISRow label="Total Income"               values={is.map(r=>r.totalInc)}   bold color={C.green} separator />
                  <ISRow label="Variable COGS (Tbl 19)"    values={is.map(r=>-r.varCogs)}   indent color={C.red} />
                  <ISRow label="Fixed COGS (Tbl 17/18)"    values={is.map(r=>-r.fixCogs)}   indent color={C.orange} />
                  <ISRow label="Total COGS"                 values={is.map(r=>-r.totCogs)}   bold color={C.red} />
                  <ISRow label="Gross Profit"               values={is.map(r=>r.gp)}         bold color={C.green} separator />
                  <ISRow label="Gross Margin %"             values={is.map(r=>r.gpPct)}      pct color={C.green} />
                  <ISRow label="Variable Overhead (Tbl 29)" values={is.map(r=>-r.varOH)}     indent color={C.red} separator />
                  <ISRow label="Fixed Overhead (Tbl 31)"   values={is.map(r=>-r.fixOH)}     indent color={C.red} />
                  <ISRow label="  Salaries (Tbl 26)"       values={is.map(r=>-r.fOvhComp.sal)} indent color={C.dim} />
                  <ISRow label="  Office"                   values={is.map(r=>-r.fOvhComp.off)} indent color={C.dim} />
                  <ISRow label="  Software"                 values={is.map(r=>-r.fOvhComp.sw)}  indent color={C.dim} />
                  <ISRow label="  Legal"                    values={is.map(r=>-r.fOvhComp.leg)} indent color={C.dim} />
                  <ISRow label="  Accounting"               values={is.map(r=>-r.fOvhComp.acc)} indent color={C.dim} />
                  <ISRow label="  Insurance"                values={is.map(r=>-r.fOvhComp.ins)} indent color={C.dim} />
                  <ISRow label="Total Overhead"             values={is.map(r=>-r.totOH)}     bold color={C.red} />
                  <ISRow label="EBITDA"                     values={is.map(r=>r.ebitda)}     bold color={C.blue} separator />
                  <ISRow label="EBITDA Margin %"            values={is.map(r=>r.ebitdaMgn)}  pct color={C.blue} />
                  <ISRow label="D&A (Tbl 32)"              values={is.map(r=>-r.dna)}       indent color={C.dim} separator />
                  <ISRow label="EBIT"                       values={is.map(r=>r.ebit)}       bold separator />
                  <ISRow label="Tax"                        values={is.map(r=>-r.taxAmt)}    indent color={C.red} separator />
                  <ISRow label="Net Income"                 values={is.map(r=>r.netIncome)}  bold color={C.accent} separator />
                </tbody>
              </table>
            </div>
          </Card>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
            <Card>
              <Sec>Revenue → Net Income Waterfall</Sec>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={is}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="label" tick={{ fill:C.muted,fontSize:9 }} />
                  <YAxis tickFormatter={fmtINR} tick={{ fill:C.muted,fontSize:9 }} />
                  <Tooltip contentStyle={TT} formatter={(v,n)=>[fmtINR(v),n]} />
                  <Legend wrapperStyle={{ fontSize:"11px" }} />
                  <Bar dataKey="totalInc"  name="Revenue"      fill={C.green}  opacity={0.9} />
                  <Bar dataKey="gp"        name="Gross Profit" fill={C.blue}   opacity={0.8} />
                  <Bar dataKey="ebitda"    name="EBITDA"       fill={C.teal}   opacity={0.8} />
                  <Bar dataKey="netIncome" name="Net Income"   fill={C.accent} opacity={0.9} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <Sec>Gross Margin % vs EBITDA Margin % (YoY)</Sec>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={is}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="label" tick={{ fill:C.muted,fontSize:9 }} />
                  <YAxis tickFormatter={v=>`${v.toFixed(0)}%`} tick={{ fill:C.muted,fontSize:9 }} />
                  <Tooltip contentStyle={TT} formatter={v=>[`${v.toFixed(1)}%`]} />
                  <Legend wrapperStyle={{ fontSize:"11px" }} />
                  <Bar dataKey="gpPct"     name="Gross Margin %" fill={C.green} opacity={0.85} />
                  <Bar dataKey="ebitdaMgn" name="EBITDA Margin %" fill={C.teal} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </>)}

        {/* ══ CASH FLOW ══ */}
        {tab==="cashflow" && (<>
          <Card style={{ marginBottom:"14px" }}>
            <Sec>Cash Flow Statement — 5-Year (₹)</Sec>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%",borderCollapse:"collapse",fontFamily:"monospace",fontSize:"13px" }}>
                <thead><tr style={{ background:C.bgHov }}>
                  <th style={{ padding:"7px 10px",textAlign:"left",color:C.muted,borderBottom:`2px solid ${C.border}`,width:"240px" }}>Line Item</th>
                  {cf.map(r=><th key={r.year} style={{ padding:"7px 14px",textAlign:"right",color:C.accent,borderBottom:`2px solid ${C.border}`,whiteSpace:"nowrap" }}>{r.label}</th>)}
                </tr></thead>
                <tbody>
                  <tr style={{ background:C.bgHov }}><td colSpan={6} style={{ padding:"6px 10px",fontSize:"11px",color:C.blue,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em" }}>Operating Activities</td></tr>
                  <ISRow label="Net Income"          values={cf.map(r=>r.netIncome)}   indent />
                  <ISRow label="Add: D&A"            values={cf.map(r=>r.dna)}         indent color={C.dim} />
                  <ISRow label="Cash from Operations" values={cf.map(r=>r.operatingCF)} bold color={C.blue} />
                  <tr style={{ background:C.bgHov }}><td colSpan={6} style={{ padding:"6px 10px",fontSize:"11px",color:C.orange,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em" }}>Investing Activities</td></tr>
                  <ISRow label="Capital Expenditures" values={cf.map(r=>r.investingCF)} indent color={C.red} />
                  <ISRow label="Cash from Investing"  values={cf.map(r=>r.investingCF)} bold color={C.orange} />
                  <tr style={{ background:C.bgHov }}><td colSpan={6} style={{ padding:"6px 10px",fontSize:"11px",color:C.purple,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em" }}>Financing Activities</td></tr>
                  <ISRow label="Net Equity Proceeds"  values={cf.map(r=>r.financingCF)} indent color={C.purple} />
                  <ISRow label="Cash from Financing"  values={cf.map(r=>r.financingCF)} bold color={C.purple} />
                  <ISRow label="Beginning Cash"       values={cf.map(r=>r.beginCash)}   color={C.dim} separator />
                  <ISRow label="Net Cash Flow"        values={cf.map(r=>r.netCF)}       bold separator />
                  <ISRow label="Ending Cash Balance"  values={cf.map(r=>r.endCash)}     bold color={C.accent} separator />
                </tbody>
              </table>
            </div>
          </Card>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
            <Card><Sec>CF by Category</Sec><ResponsiveContainer width="100%" height={220}><BarChart data={cf}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="label" tick={{ fill:C.muted,fontSize:9 }} /><YAxis tickFormatter={fmtINR} tick={{ fill:C.muted,fontSize:9 }} /><Tooltip contentStyle={TT} formatter={(v,n)=>[fmtINR(v),n]} /><Legend wrapperStyle={{ fontSize:"11px" }} /><Bar dataKey="operatingCF" name="Operating" fill={C.blue} /><Bar dataKey="investingCF" name="Investing" fill={C.red} /><Bar dataKey="financingCF" name="Financing" fill={C.purple} /></BarChart></ResponsiveContainer></Card>
            <Card><Sec>Ending Cash Balance</Sec><ResponsiveContainer width="100%" height={220}><AreaChart data={cf}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="label" tick={{ fill:C.muted,fontSize:9 }} /><YAxis tickFormatter={fmtINR} tick={{ fill:C.muted,fontSize:9 }} /><Tooltip contentStyle={TT} formatter={(v,n)=>[fmtINR(v),n]} /><Area dataKey="endCash" name="Ending Cash" stroke={C.accent} fill={C.accent} fillOpacity={0.15} strokeWidth={2} /></AreaChart></ResponsiveContainer></Card>
          </div>
        </>)}

        {/* ══ BALANCE SHEET ══ */}
        {tab==="balsheet" && (
          <Card>
            <Sec>Balance Sheet — 5-Year Snapshot (₹)</Sec>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%",borderCollapse:"collapse",fontFamily:"monospace",fontSize:"13px" }}>
                <thead><tr style={{ background:C.bgHov }}>
                  <th style={{ padding:"7px 10px",textAlign:"left",color:C.muted,borderBottom:`2px solid ${C.border}`,width:"200px" }}>Line Item</th>
                  {bs.map(r=><th key={r.year} style={{ padding:"7px 14px",textAlign:"right",color:C.accent,borderBottom:`2px solid ${C.border}`,whiteSpace:"nowrap" }}>{r.label}</th>)}
                </tr></thead>
                <tbody>
                  <tr style={{ background:C.bgHov }}><td colSpan={6} style={{ padding:"6px 10px",fontSize:"11px",color:C.green,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em" }}>Assets</td></tr>
                  <ISRow label="Current Assets"     values={bs.map(r=>r.curAssets)}   indent />
                  <ISRow label="Fixed Assets (NBV)" values={bs.map(r=>r.fa_nbv)}      indent />
                  <ISRow label="Total Assets"       values={bs.map(r=>r.totalAssets)} bold color={C.green} separator />
                  <tr style={{ background:C.bgHov }}><td colSpan={6} style={{ padding:"6px 10px",fontSize:"11px",color:C.red,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em" }}>Liabilities & Equity</td></tr>
                  <ISRow label="Total Liabilities"       values={bs.map(r=>r.totalLiab)}   bold color={C.red} separator />
                  <ISRow label="Shareholders' Equity"    values={bs.map(r=>r.equity)}      bold color={C.purple} separator />
                  <ISRow label="Total Liabilities & Eq." values={bs.map(r=>r.totalLiabEq)} bold color={C.accent} separator />
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ══ MONTHLY ══ */}
        {tab==="monthly" && (<>
          <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", marginBottom:"14px" }}>
            <KPI label="Base Burn (Y1)"   value={fmtINR(kpi.y1BaseBurn)} color={C.red}    sub="Fixed COGS + OH ÷ 12" />
            <KPI label="Runway"           value={`${kpi.runway} mo`}     color={C.accent} sub="Equity ÷ base burn" />
            <KPI label="First Revenue"    value={`Month ${firstRevMonth}`} color={C.green} sub={`Day ~${firstRevMonth*30}`} />
            <KPI label="Lead → Cash"      value={fmtDays(leadToCashDays)} color={C.orange} sub={`${inp.salesCycleDays}d + ${inp.paymentLagDays}d`} />
          </div>
          <Card>
            <Sec>Monthly Operating Detail — 60 Months (▲ = cohort onboarding event, variable costs spike with clients)</Sec>
            <DataTable
              cols={[
                { key:"label",       label:"Period" },
                { key:"cohortLabel", label:"Cohort Event", format:(v,r)=>r.cohortEvent?<span style={{ color:C.orange,fontWeight:700 }}>▲ {v}</span>:"—" },
                { key:"activeNBFC",  label:"NBFCs",        format:fmtNum, color:()=>C.purple },
                { key:"activeBank",  label:"Banks",        format:fmtNum, color:()=>C.blue },
                { key:"dashClients", label:"Total Clients", format:fmtNum, color:()=>C.accent },
                { key:"apiCallsMo",  label:"API Calls/Mo",  format:fmtNum },
                { key:"mRev",        label:"Revenue",       format:fmtINR, color:v=>v>0?C.green:C.dim },
                { key:"mVarCogs",    label:"Var COGS",      format:fmtINR, color:()=>C.red },
                { key:"mFixCogs",    label:"Fix COGS",      format:fmtINR, color:()=>C.orange },
                { key:"mGP",         label:"Gross Profit",  format:fmtINR, color:v=>v>=0?C.green:C.red },
                { key:"mGPpct",      label:"GM %",          format:v=>`${v.toFixed(1)}%`, color:v=>v>0?C.green:C.red },
                { key:"mFixOH",      label:"Fixed OH",      format:fmtINR, color:()=>C.red },
                { key:"mVarOH",      label:"Var OH",        format:fmtINR, color:()=>C.orange },
                { key:"mEbitda",     label:"EBITDA",        format:fmtINR, color:v=>v>=0?C.teal:C.red },
                { key:"mBaseBurn",   label:"Base Burn",     format:fmtINR, color:()=>C.red },
                { key:"mNetCF",      label:"Net CF",        format:fmtINR, color:v=>v>=0?C.green:C.red },
                { key:"cumCapital",  label:"Cum Capital",   format:fmtINR, color:v=>v>=0?C.accent:C.red },
              ]}
              rows={monthRows}
            />
          </Card>
        </>)}

        {/* ══ CHARTS ══ */}
        {tab==="charts" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
            <Card style={{ gridColumn:"1/-1" }}>
              <Sec>1. Monthly Revenue vs Base Burn (Revenue starts Month {firstRevMonth})</Sec>
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={monthRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="label" tick={{ fill:C.muted,fontSize:7 }} interval={5} />
                  <YAxis tickFormatter={fmtINR} tick={{ fill:C.muted,fontSize:9 }} />
                  <Tooltip contentStyle={TT} formatter={(v,n)=>[fmtINR(v),n]} />
                  <Legend wrapperStyle={{ fontSize:"11px" }} />
                  {batches.map(b=><ReferenceLine key={b.payMonth} x={`Y${Math.ceil(b.payMonth/12)}M${String(((b.payMonth-1)%12)+1).padStart(2,"0")}`} stroke={C.orange} strokeDasharray="3 2" />)}
                  <Area dataKey="mApiRev"   name="API Rev"    stroke={C.purple} fill={C.purple} fillOpacity={0.25} stackId="r" />
                  <Area dataKey="mDashRev"  name="Dash Rev"   stroke={C.teal}   fill={C.teal}   fillOpacity={0.25} stackId="r" />
                  <Line dataKey="mBaseBurn" name="Base Burn"  stroke={C.red}    strokeWidth={2} dot={false} strokeDasharray="4 2" />
                  <Line dataKey="mTotCost"  name="Total Cost" stroke={C.orange} strokeWidth={1.5} dot={false} strokeDasharray="2 2" />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <Sec>2. Monthly Gross Margin % (Steps up with each cohort)</Sec>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="label" tick={{ fill:C.muted,fontSize:7 }} interval={5} />
                  <YAxis tickFormatter={v=>`${v.toFixed(0)}%`} tick={{ fill:C.muted,fontSize:9 }} />
                  <Tooltip contentStyle={TT} formatter={v=>[`${v.toFixed(1)}%`,"GM%"]} />
                  <ReferenceLine y={0} stroke={C.red} strokeDasharray="3 2" />
                  <Line dataKey="mGPpct" name="Gross Margin %" stroke={C.green} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <Sec>3. Monthly EBITDA + Cumulative Capital</Sec>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={monthRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="label" tick={{ fill:C.muted,fontSize:7 }} interval={5} />
                  <YAxis tickFormatter={fmtINR} tick={{ fill:C.muted,fontSize:9 }} />
                  <Tooltip contentStyle={TT} formatter={(v,n)=>[fmtINR(v),n]} />
                  <ReferenceLine y={0} stroke={C.red} strokeDasharray="3 2" />
                  <Bar  dataKey="mEbitda"    name="EBITDA"      fill={C.teal} opacity={0.8} />
                  <Line dataKey="cumCapital" name="Cum Capital" stroke={C.accent} strokeWidth={1.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <Sec>4. API Calls + Variable Costs (Spike on Cohort Events)</Sec>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={monthRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="label" tick={{ fill:C.muted,fontSize:7 }} interval={5} />
                  <YAxis yAxisId="l" tickFormatter={fmtINR} tick={{ fill:C.muted,fontSize:9 }} />
                  <YAxis yAxisId="r" orientation="right" tickFormatter={fmtNum} tick={{ fill:C.muted,fontSize:9 }} />
                  <Tooltip contentStyle={TT} />
                  <Legend wrapperStyle={{ fontSize:"11px" }} />
                  <Bar  yAxisId="l" dataKey="mVarCogs"   name="Var COGS (₹)"  fill={C.red}  opacity={0.7} />
                  <Line yAxisId="r" dataKey="apiCallsMo" name="API Calls/Mo"  stroke={C.teal} strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <Sec>5. Annual Margin Trends</Sec>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={is}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="label" tick={{ fill:C.muted,fontSize:9 }} />
                  <YAxis tickFormatter={v=>`${v.toFixed(0)}%`} tick={{ fill:C.muted,fontSize:9 }} />
                  <Tooltip contentStyle={TT} formatter={v=>[`${v.toFixed(1)}%`]} />
                  <Legend wrapperStyle={{ fontSize:"11px" }} />
                  <Bar dataKey="gpPct"     name="Gross Margin %" fill={C.green} opacity={0.85} />
                  <Bar dataKey="ebitdaMgn" name="EBITDA Margin %" fill={C.teal} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <Sec>6. Cumulative Capital Position</Sec>
              <ResponsiveContainer width="100%" height={210}>
                <ComposedChart data={monthRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="label" tick={{ fill:C.muted,fontSize:7 }} interval={5} />
                  <YAxis tickFormatter={fmtINR} tick={{ fill:C.muted,fontSize:9 }} />
                  <Tooltip contentStyle={TT} formatter={(v,n)=>[fmtINR(v),n]} />
                  <ReferenceLine y={0} stroke={C.red} strokeDasharray="4 2" />
                  <Bar  dataKey="mNetCF"    name="Monthly Net CF" fill={C.blue}   opacity={0.6} />
                  <Line dataKey="cumCapital" name="Cumulative"    stroke={C.accent} strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}
