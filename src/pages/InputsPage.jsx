import React, { useEffect, useState } from 'react';
import SidePanel from '../components/inputs/SidePanel.jsx';
import InputCardContainer from '../components/inputs/InputCardContainer.jsx';
import KpiCompact from '../components/inputs/KpiCompact.jsx';

export default function InputsPage({ inp, upd, updStr, kpi, fmtINR }) {
  const [selected, setSelected] = useState(null);

  const sections = [
    { key: 'PDF Baseline', label: 'PDF Baseline' },
    { key: 'Business Assumptions', label: 'Business Assumptions' },
    { key: 'Platform Launch', label: 'Platform Launch' },
    { key: 'Region Mix', label: 'Region Mix' },
    { key: 'FX Rates', label: 'FX Rates' },
    { key: 'Manpower Model', label: 'Manpower Model' },
    { key: 'Monthly Fixed Expenses', label: 'Monthly Fixed Expenses' },
    { key: 'SKU Pricing', label: 'SKU Pricing' },
    { key: 'SKU Revenue Mix', label: 'SKU Revenue Mix' },
  ];

  useEffect(() => {
    if (inp.pricingModel === 'perAcre' && selected === 'Platform Launch') {
      setSelected(null);
    }
  }, [inp.pricingModel, selected]);

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <SidePanel inp={inp} upd={upd} updStr={updStr} sections={sections} selected={selected} onSelect={setSelected} />
      <div style={{ flex: 1, minHeight: 420, paddingTop: 2 }}>
        <InputCardContainer inp={inp} upd={upd} updStr={updStr} kpi={kpi} fmtINR={fmtINR} selected={selected} />
      </div>
      <div style={{ marginLeft: 8, position: 'sticky', top: 84 }}>
        <KpiCompact kpi={kpi} fmtINR={fmtINR} />
      </div>
    </div>
  );
}

