import React from 'react';
import { Card, C } from '../uiAtoms.jsx';

export default function KpiCompact({ kpi, fmtINR }) {
  return (
    <div style={{ width: 260 }}>
      <Card style={{ padding: 10 }}>
        <div style={{ fontSize: 12, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Yr5 Targets</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ color: C.muted }}>Yr5 Valuation</div>
            <div style={{ color: C.accent, fontWeight: 700 }}>{fmtINR(kpi.yr5Val)}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ color: C.muted }}>Yr5 EBITDA</div>
            <div style={{ color: C.blue, fontWeight: 700 }}>{fmtINR(kpi.yr5EBITDA)}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ color: C.muted }}>Yr5 Rev Needed</div>
            <div style={{ color: C.blue, fontWeight: 700 }}>{fmtINR(kpi.yr5Rev)}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
