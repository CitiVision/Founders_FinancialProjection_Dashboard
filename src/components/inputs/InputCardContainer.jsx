import React, { useState } from 'react';
import { PRICE_TIERS } from '../../constants/perAcreDefaults.js';
import { Card, Sec, Field, C } from '../uiAtoms.jsx';

const Note = ({ children }) => (
  <div style={{ background: C.bg, borderRadius: '6px', padding: '9px', marginTop: '8px', border: `1px solid ${C.border}` }}>
    {children}
  </div>
);

const SummaryRow = ({ label, value, color = C.text, withDivider = false }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '16px', borderBottom: withDivider ? `1px solid ${C.border}` : 'none' }}>
    <span style={{ color: C.muted }}>{label}</span>
    <span style={{ color }}>{value}</span>
  </div>
);

const YearMixCard = ({ title, fields, inp, upd }) => (
  <Card>
    <Sec>{title}</Sec>
    {fields.map(field => (
      <Field key={field.id} label={field.label} id={field.id} value={inp[field.id]} onChange={upd} suffix="%" />
    ))}
  </Card>
);

const SkuYearCard = ({ year, inp, upd }) => {
  const items = [
    ['Developer', `skuDeveloperY${year}`, `skuDeveloperY${year}_month`, `skuDeveloperY${year}_yearPct`, `skuDeveloperY${year}_monthPct`],
    ['Designer', `skuDesignerY${year}`, `skuDesignerY${year}_month`, `skuDesignerY${year}_yearPct`, `skuDesignerY${year}_monthPct`],
    ['Trial', `skuTrialY${year}`, `skuTrialY${year}_month`, `skuTrialY${year}_yearPct`, `skuTrialY${year}_monthPct`],
    ['Consulting', `skuConsultingY${year}`, `skuConsultingY${year}_month`, `skuConsultingY${year}_yearPct`, `skuConsultingY${year}_monthPct`],
  ];

  return (
    <Card>
      <Sec>SKU Pricing (Y{year})</Sec>
      {items.map(([label, yearlyId, monthlyId, yearlyPctId, monthlyPctId]) => (
        <React.Fragment key={label}>
          <Field label={`${label} — Yearly Price`} id={yearlyId} value={inp[yearlyId]} onChange={upd} prefix="₹" suffix="/yr" />
          <Field label={`${label} — Monthly Price`} id={monthlyId} value={inp[monthlyId]} onChange={upd} prefix="₹" suffix="/mo" />
          <Field label={`${label} — Yearly %`} id={yearlyPctId} value={inp[yearlyPctId]} onChange={upd} suffix="%" />
          <Field label={`${label} — Monthly %`} id={monthlyPctId} value={inp[monthlyPctId]} onChange={upd} suffix="%" />
        </React.Fragment>
      ))}
    </Card>
  );
};

export default function InputCardContainer({ inp, upd, updStr, kpi, fmtINR, selected }) {
  const [showAllRegionMixYears, setShowAllRegionMixYears] = useState(false);
  const [showAllSkuYears, setShowAllSkuYears] = useState(false);
  const regionOk = Math.round((inp.indiaPct || 0) + (inp.mePct || 0) + (inp.europePct || 0) + (inp.australiaPct || 0)) === 100;
  const skuOk = Math.round((inp.skuDevPct || 0) + (inp.skuDesPct || 0) + (inp.skuTrialPct || 0) + (inp.skuConsPct || 0)) === 100;

  if (!selected) {
    return <div style={{ minHeight: 420 }} />;
  }

  if (selected === 'Pricing Model') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 720px)', gap: 14 }}>
        <Card>
          <Sec>Pricing Model</Sec>
          {inp.pricingModel === 'perAcre' ? (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {Object.entries(PRICE_TIERS).map(([tier, price]) => (
                  <button
                    key={tier}
                    onClick={() => upd('pricePerAcre', price)}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 13,
                      border: `1px solid ${inp.pricePerAcre === price ? C.accent : C.border}`,
                      background: inp.pricePerAcre === price ? C.accent : C.bgCard,
                      color: inp.pricePerAcre === price ? '#081019' : C.text,
                    }}
                  >
                    {tier.charAt(0).toUpperCase() + tier.slice(1)}<br />₹{(price / 1000).toFixed(0)}K
                  </button>
                ))}
              </div>
              <Field label="Price per Acre" id="pricePerAcre" value={inp.pricePerAcre} onChange={upd} prefix="₹" suffix="/acre" />
              <Field label="Avg Project Size" id="avgProjectSizeAcres" value={inp.avgProjectSizeAcres} onChange={upd} suffix="acres" hint={`= ₹${(((inp.pricePerAcre || 0) * (inp.avgProjectSizeAcres || 0)) / 100000).toFixed(1)}L/project`} />
              <Field label="Total SAM" id="totalSAMacres" value={inp.totalSAMacres} onChange={upd} suffix="acres" />
              <Field label="Market Capture" id="marketCapturePct" value={inp.marketCapturePct} onChange={upd} suffix="%" />
              <Sec>Annual Project Targets</Sec>
              {[1, 2, 3, 4, 5].map(year => (
                <Field
                  key={year}
                  label={`Y${year} Projects`}
                  id={`perAcreProjectsY${year}`}
                  value={inp[`perAcreProjectsY${year}`]}
                  onChange={upd}
                  hint={`= ${fmtINR((inp[`perAcreProjectsY${year}`] || 0) * (inp.pricePerAcre || 0) * (inp.avgProjectSizeAcres || 0))}`}
                />
              ))}
            </>
          ) : (
            <>
              <div style={{ color: C.dim, marginBottom: 12 }}>Annual SaaS / SKU is active. Configure detailed SKU pricing and mix from the SKU cards in the side panel.</div>
              <Field label="Developer" id="skuDeveloper" value={inp.skuDeveloper} onChange={upd} prefix="₹" suffix="/yr" />
              <Field label="Designer" id="skuDesigner" value={inp.skuDesigner} onChange={upd} prefix="₹" suffix="/yr" />
              <Field label="Trial" id="skuTrial" value={inp.skuTrial} onChange={upd} prefix="₹" suffix="/yr" />
              <Field label="Consulting" id="skuConsulting" value={inp.skuConsulting} onChange={upd} prefix="₹" suffix="/yr" />
            </>
          )}
        </Card>
      </div>
    );
  }

  if (selected === 'PDF Baseline') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 720px)', gap: 14 }}>
        <Card>
          <Sec>PDF Baseline</Sec>
          <Field label="EBITDA" id="ebitdaPct" value={inp.ebitdaPct} onChange={upd} suffix="%" hint="20–40%" />
          <Field label="Valuation Now" id="valuationNow" value={inp.valuationNow} onChange={upd} prefix="₹" />
          <Field label="P/E Ratio" id="pe" value={inp.pe} onChange={upd} hint="20–30" />
          <Field label="5-Year Return" id="fiveYearReturn" value={inp.fiveYearReturn} onChange={upd} suffix="×" />
          <Field label="YoY Revenue Growth" id="yoyGrowth" value={inp.yoyGrowth} onChange={upd} suffix="%" />
          <Field label="Avg Deal Size" id="avgDealSize" value={inp.avgDealSize} onChange={upd} prefix="₹" />
          <Field label="Pipeline Conversion" id="pipelineConversion" value={inp.pipelineConversion} onChange={upd} suffix="%" hint="15–20%" />
          <Field label="Inflation" id="inflation" value={inp.inflation} onChange={upd} suffix="%" hint="Annual %" />
        </Card>
      </div>
    );
  }

  if (selected === 'Business Assumptions') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 720px)', gap: 14 }}>
        <Card>
          <Sec>Business Assumptions</Sec>
          <Field label="Initial Clients (Y1)" id="initialClients" value={inp.initialClients} onChange={upd} />
          <Field label="Rev/Client Y1 (annual)" id="revenuePerClientY1" value={inp.revenuePerClientY1} onChange={upd} prefix="₹" />
          <Field label="Client Growth / Quarter" id="clientGrowthQtr" value={inp.clientGrowthQtr} onChange={upd} suffix="%" />
          <Field label="Initial Capital" id="initialInvestment" value={inp.initialInvestment} onChange={upd} prefix="₹" />
          <Field label="Initial Employees" id="initialEmployees" value={inp.initialEmployees} onChange={upd} hint="Base team" />
        </Card>
      </div>
    );
  }

  if (selected === 'Platform Launch') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 720px)', gap: 14 }}>
        <Card>
          <Sec>Platform Launch</Sec>
          <Field label="Launch Month (in Year 2)" id="platformLaunchMonth" value={inp.platformLaunchMonth} onChange={upd} hint="1–12" />
          <Field label="Client Boost at Launch" id="launchBoostMultiplier" value={inp.launchBoostMultiplier} onChange={upd} suffix="×" hint="1.5 = +50%" />
          <Note>
            <div style={{ fontSize: '16px', lineHeight: 1.9 }}>
              <span style={{ color: C.accent }}>Y1 M1–M12:</span> Fixed ₹/client model<br />
              <span style={{ color: C.green }}>Y2 M{inp.platformLaunchMonth}+:</span> SKU pricing model<br />
              <span style={{ color: C.purple }}>Absolute month:</span> {kpi.launchAbsMonth}
            </div>
          </Note>
        </Card>
      </div>
    );
  }

  if (selected === 'Region Mix') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Sec>Region Mix (Y1)</Sec>
            <button onClick={() => setShowAllRegionMixYears(v => !v)} style={{ fontSize: 13, padding: '2px 10px', borderRadius: 4, border: `1px solid ${C.border}`, background: C.bgCard, color: C.text, cursor: 'pointer' }}>
              {showAllRegionMixYears ? 'Collapse All Years' : 'Expand All Years'}
            </button>
          </div>
          <Field label="India" id="indiaPct" value={inp.indiaPct} onChange={upd} suffix="% INR" />
          <Field label="Middle East" id="mePct" value={inp.mePct} onChange={upd} suffix="% AED" />
          <Field label="Europe" id="europePct" value={inp.europePct} onChange={upd} suffix="% EUR" />
          <Field label="Australia" id="australiaPct" value={inp.australiaPct} onChange={upd} suffix="% AUD" />
          <div style={{ marginTop: '6px', fontSize: '16px', color: regionOk ? C.green : C.red }}>
            Total: {(inp.indiaPct || 0) + (inp.mePct || 0) + (inp.europePct || 0) + (inp.australiaPct || 0)}% {regionOk ? '✓' : '⚠ must = 100%'}
          </div>
        </Card>
        {showAllRegionMixYears && (
          <>
            <YearMixCard title="Region Mix (Y2)" inp={inp} upd={upd} fields={[{ label: 'India', id: 'indiaPctY2' }, { label: 'Middle East', id: 'mePctY2' }, { label: 'Europe', id: 'europePctY2' }, { label: 'Australia', id: 'australiaPctY2' }]} />
            <YearMixCard title="Region Mix (Y3)" inp={inp} upd={upd} fields={[{ label: 'India', id: 'indiaPctY3' }, { label: 'Middle East', id: 'mePctY3' }, { label: 'Europe', id: 'europePctY3' }, { label: 'Australia', id: 'australiaPctY3' }]} />
            <YearMixCard title="Region Mix (Y4)" inp={inp} upd={upd} fields={[{ label: 'India', id: 'indiaPctY4' }, { label: 'Middle East', id: 'mePctY4' }, { label: 'Europe', id: 'europePctY4' }, { label: 'Australia', id: 'australiaPctY4' }]} />
            <YearMixCard title="Region Mix (Y5)" inp={inp} upd={upd} fields={[{ label: 'India', id: 'indiaPctY5' }, { label: 'Middle East', id: 'mePctY5' }, { label: 'Europe', id: 'europePctY5' }, { label: 'Australia', id: 'australiaPctY5' }]} />
          </>
        )}
      </div>
    );
  }

  if (selected === 'FX Rates') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 720px)', gap: 14 }}>
        <Card>
          <Sec>FX → INR Rates</Sec>
          <Field label="1 AED → INR" id="aedToInr" value={inp.aedToInr} onChange={upd} suffix="INR" hint="~22.5" />
          <Field label="1 EUR → INR" id="eurToInr" value={inp.eurToInr} onChange={upd} suffix="INR" hint="~90" />
          <Field label="1 AUD → INR" id="audToInr" value={inp.audToInr} onChange={upd} suffix="INR" hint="~55" />
          <Note>
            <SummaryRow label="1 AED" value={`₹${inp.aedToInr || 0}`} />
            <SummaryRow label="1 EUR" value={`₹${inp.eurToInr || 0}`} />
            <SummaryRow label="1 AUD" value={`₹${inp.audToInr || 0}`} />
          </Note>
        </Card>
      </div>
    );
  }

  if (selected === 'Manpower Model') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 720px)', gap: 14 }}>
        <Card>
          <Sec>Manpower Model</Sec>
          <Field label="Sessions / Client / Month" id="sessionsPerClientPerMonth" value={inp.sessionsPerClientPerMonth} onChange={upd} />
          <Field label="Onboarding Sessions / Client" id="onboardingSessionsPerClient" value={inp.onboardingSessionsPerClient} onChange={upd} hint="2 std" />
          <Field label="Session Capacity / Employee" id="sessionCapacityPerEmployee" value={inp.sessionCapacityPerEmployee} onChange={upd} hint="20 std" />
          <Field label="Salary / New Designer" id="salaryPerDesigner" value={inp.salaryPerDesigner} onChange={upd} prefix="₹" suffix="/mo" />
          <Field label="Office / New Designer" id="officePerDesigner" value={inp.officePerDesigner} onChange={upd} prefix="₹" suffix="/mo" />
          <Note>
            <div style={{ fontSize: '16px', lineHeight: 1.9 }}>
              Peak employees: <span style={{ color: C.purple }}>{kpi.maxEmp}</span><br />
              Total hires: <span style={{ color: C.red }}>{kpi.totalHires}</span>
            </div>
          </Note>
        </Card>
      </div>
    );
  }

  if (selected === 'Monthly Fixed Expenses') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 720px)', gap: 14 }}>
        <Card variant="purple">
          <Sec color={C.text}>Monthly Fixed Expenses</Sec>
          <Field label="Employee Salaries" id="salaries" value={inp.salaries} onChange={upd} prefix="₹" hint="Base team" />
          <Field label="Workstation / Rent" id="rent" value={inp.rent} onChange={upd} prefix="₹" />
          <Field label="Stack / Product Dev" id="stackCosts" value={inp.stackCosts} onChange={upd} prefix="₹" />
          <Field label="API Costs" id="apiCosts" value={inp.apiCosts} onChange={upd} prefix="₹" />
          <Note>
            <SummaryRow label="Base Monthly Burn" value={fmtINR(kpi.monthlyBurn)} color={C.red} />
            <SummaryRow label="Runway" value={`${kpi.runway} months`} color={C.red} />
          </Note>
        </Card>
      </div>
    );
  }

  if (selected === 'Headcount Model') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 720px)', gap: 14 }}>
        <Card variant="purple">
          <Sec color={C.text}>Headcount Cost Model</Sec>
          {!inp.useHeadcountSalaryModel && <div style={{ color: C.dim, marginBottom: 12 }}>Headcount model is off. Turn it on from the side panel to use role-based annual compensation.</div>}
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
        </Card>
      </div>
    );
  }

  if (selected === 'SKU Pricing') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Sec>SKU Pricing (Y1)</Sec>
            <button onClick={() => setShowAllSkuYears(v => !v)} style={{ fontSize: 13, padding: '2px 10px', borderRadius: 4, border: `1px solid ${C.border}`, background: C.bgCard, color: C.text, cursor: 'pointer' }}>
              {showAllSkuYears ? 'Collapse All Years' : 'Expand All Years'}
            </button>
          </div>
          <Field label="Developer" id="skuDeveloper" value={inp.skuDeveloper} onChange={upd} prefix="₹" suffix="/yr" />
          <Field label="Designer" id="skuDesigner" value={inp.skuDesigner} onChange={upd} prefix="₹" suffix="/yr" />
          <Field label="Trial" id="skuTrial" value={inp.skuTrial} onChange={upd} prefix="₹" suffix="/yr" />
          <Field label="Consulting" id="skuConsulting" value={inp.skuConsulting} onChange={upd} prefix="₹" suffix="/yr" />
        </Card>
        {showAllSkuYears && (
          <>
            <SkuYearCard year={2} inp={inp} upd={upd} />
            <SkuYearCard year={3} inp={inp} upd={upd} />
            <SkuYearCard year={4} inp={inp} upd={upd} />
            <SkuYearCard year={5} inp={inp} upd={upd} />
          </>
        )}
      </div>
    );
  }

  if (selected === 'SKU Revenue Mix') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 720px)', gap: 14 }}>
        <Card>
          <Sec>SKU Revenue Mix</Sec>
          <Field label="Developer" id="skuDevPct" value={inp.skuDevPct} onChange={upd} suffix="%" />
          <Field label="Designer" id="skuDesPct" value={inp.skuDesPct} onChange={upd} suffix="%" />
          <Field label="Trial" id="skuTrialPct" value={inp.skuTrialPct} onChange={upd} suffix="%" />
          <Field label="Consulting" id="skuConsPct" value={inp.skuConsPct} onChange={upd} suffix="%" />
          <div style={{ marginTop: '6px', fontSize: '16px', color: skuOk ? C.green : C.red }}>
            Total: {(inp.skuDevPct || 0) + (inp.skuDesPct || 0) + (inp.skuTrialPct || 0) + (inp.skuConsPct || 0)}% {skuOk ? '✓' : '⚠ must = 100%'}
          </div>
        </Card>
      </div>
    );
  }

  return <div style={{ minHeight: 420 }} />;
}
