import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const fmtINR = (n) => {
  if (n === undefined || n === null || isNaN(n)) return "₹0";
  const abs = Math.abs(n); const sign = n < 0 ? "-" : "";
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(2)}L`;
  if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(1)}K`;
  return `${sign}₹${Math.round(abs)}`;
};

const COLORS = ['#d4a843', '#4b9cf5', '#38c96a'];

export default function ComparePage({ allScenarioResults, scenarios }) {
  if (!allScenarioResults || allScenarioResults.length === 0) {
    return <div style={{ padding: 40, color: '#6B7280', textAlign: 'center' }}>No scenario data available.</div>;
  }

  const years = [1, 2, 3, 4, 5];
  const barData = years.map(y => {
    const entry = { year: `Y${y}` };
    allScenarioResults.forEach((res, i) => {
      const yearRows = (res.rows || []).filter(r => r.year === y);
      const yearRev = yearRows.reduce((sum, r) => sum + (r.revenue || 0), 0);
      entry[`s${i}`] = yearRev;
    });
    return entry;
  });

  const y5Revs = allScenarioResults.map((res) => {
    const yearRows = (res.rows || []).filter(r => r.year === 5);
    return yearRows.reduce((sum, r) => sum + (r.revenue || 0), 0);
  });
  const winnerIdx = y5Revs.indexOf(Math.max(...y5Revs));

  const summaryRows = allScenarioResults.map((res, i) => {
    const yr1Rows = (res.rows || []).filter(r => r.year === 1);
    const yr5Rows = (res.rows || []).filter(r => r.year === 5);
    const yr1Rev = yr1Rows.reduce((s, r) => s + (r.revenue || 0), 0);
    const yr5Rev = yr5Rows.reduce((s, r) => s + (r.revenue || 0), 0);
    const cumRev = (res.rows || []).reduce((s, r) => s + (r.revenue || 0), 0);
    const allRows = res.rows || [];
    const lastRow = allRows[allRows.length - 1] || {};
    const peakEmp = Math.max(...(res.rows || []).map(r => r.totalEmp || 0), 0);
    return {
      name: (scenarios[i] || {}).name || `Scenario ${i + 1}`,
      isWinner: i === winnerIdx,
      yr1Rev, yr5Rev, cumRev,
      endCapital: lastRow.capital || 0,
      peakEmp,
      pricingModel: (scenarios[i] || {}).inputs?.pricingModel || 'annualSaas',
    };
  });

  const lineData = Array.from({ length: 60 }, (_, i) => {
    const entry = { month: `M${i + 1}` };
    allScenarioResults.forEach((res, si) => {
      const row = (res.rows || [])[i] || {};
      entry[`capital_s${si}`] = row.capital || 0;
      entry[`clients_s${si}`] = row.clients || 0;
    });
    return entry;
  });

  const C = {
    bg: '#F9FAFB', bgCard: '#FFFFFF', border: '#D1D5DB',
    accent: '#d4a843', text: '#111827', muted: '#374151', dim: '#6B7280',
    green: '#38c96a',
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: C.text }}>📊 Scenario Comparison</div>

      {/* Summary Table */}
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15, fontFamily: 'monospace' }}>
          <thead>
            <tr style={{ background: C.bg }}>
              {['Scenario', 'Model', 'Y1 Revenue', 'Y5 Revenue', 'Cumulative (5Y)', 'Peak Employees', 'End Capital'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'right', color: C.muted, borderBottom: `1px solid ${C.border}`, fontSize: 13, letterSpacing: '0.07em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summaryRows.map((r, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? C.bg : C.bgCard }}>
                <td style={{ padding: '8px 14px', color: COLORS[i], fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {r.isWinner ? '👑 ' : ''}{r.name}
                </td>
                <td style={{ padding: '8px 14px', textAlign: 'right', color: C.dim, fontSize: 13 }}>
                  {r.pricingModel === 'perAcre' ? 'Per Acre' : 'Annual SaaS'}
                </td>
                <td style={{ padding: '8px 14px', textAlign: 'right', color: COLORS[i] }}>{fmtINR(r.yr1Rev)}</td>
                <td style={{ padding: '8px 14px', textAlign: 'right', color: COLORS[i], fontWeight: 700 }}>{fmtINR(r.yr5Rev)}</td>
                <td style={{ padding: '8px 14px', textAlign: 'right', color: C.text }}>{fmtINR(r.cumRev)}</td>
                <td style={{ padding: '8px 14px', textAlign: 'right', color: C.text }}>{r.peakEmp}</td>
                <td style={{ padding: '8px 14px', textAlign: 'right', color: r.endCapital >= 0 ? '#38c96a' : '#e84545' }}>{fmtINR(r.endCapital)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Y1-Y5 Bar Chart */}
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 16 }}>Annual Revenue by Scenario</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="year" tick={{ fill: C.muted, fontSize: 13 }} />
            <YAxis tickFormatter={v => fmtINR(v)} tick={{ fill: C.muted, fontSize: 12 }} width={80} />
            <Tooltip formatter={(v) => fmtINR(v)} contentStyle={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 6 }} />
            <Legend />
            {allScenarioResults.map((_, i) => (
              <Bar key={i} dataKey={`s${i}`} name={(scenarios[i] || {}).name || `Scenario ${i + 1}`} fill={COLORS[i]} radius={[3, 3, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cash Flow Line Chart */}
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 16 }}>Capital / Cash Flow Over Time</div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="month" tick={{ fill: C.muted, fontSize: 11 }} interval={11} />
            <YAxis tickFormatter={v => fmtINR(v)} tick={{ fill: C.muted, fontSize: 12 }} width={80} />
            <Tooltip formatter={(v) => fmtINR(v)} contentStyle={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 6 }} />
            <Legend />
            {allScenarioResults.map((_, i) => (
              <Line key={i} type="monotone" dataKey={`capital_s${i}`} name={`${(scenarios[i] || {}).name || `S${i + 1}`} Capital`} stroke={COLORS[i]} dot={false} strokeWidth={2} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Client Growth Line Chart */}
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 16 }}>Client Growth Over Time</div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="month" tick={{ fill: C.muted, fontSize: 11 }} interval={11} />
            <YAxis tick={{ fill: C.muted, fontSize: 12 }} />
            <Tooltip contentStyle={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 6 }} />
            <Legend />
            {allScenarioResults.map((_, i) => (
              <Line key={i} type="monotone" dataKey={`clients_s${i}`} name={`${(scenarios[i] || {}).name || `S${i + 1}`} Clients`} stroke={COLORS[i]} dot={false} strokeWidth={2} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
