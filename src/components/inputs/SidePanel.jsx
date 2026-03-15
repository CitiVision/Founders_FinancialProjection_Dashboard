import React from 'react';
import { Card, Sec, C } from '../uiAtoms.jsx';

export default function SidePanel({ inp, upd, updStr, sections, selected, onSelect }) {
  const pricingModels = [
    { id: 'annualSaas', label: 'Annual SaaS / SKU', desc: 'Per-seat annual contracts' },
    { id: 'perAcre', label: '🌾 Per Acre', desc: 'Revenue per project acre' },
  ];

  return (
    <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 84 }}>
      <Card>
        <Sec>Pricing Model</Sec>
        <div style={{ display: 'flex', gap: 8 }}>
          {pricingModels.map(m => (
            <div key={m.id} onClick={() => { updStr('pricingModel', m.id); onSelect('Pricing Model'); }} style={{ flex: 1, padding: 10, borderRadius: 8, cursor: 'pointer', border: `2px solid ${inp.pricingModel === m.id ? C.accent : C.border}`, background: inp.pricingModel === m.id ? `${C.accent}15` : C.bgCard }}>
              <div style={{ fontWeight: 700, color: inp.pricingModel === m.id ? C.accent : C.text }}>{m.label}</div>
              <div style={{ fontSize: 12, color: C.dim }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <Sec>Headcount Cost Model</Sec>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ id: false, label: 'Simple Burn' }, { id: true, label: 'Headcount Model' }].map(opt => (
            <div key={String(opt.id)} onClick={() => { updStr('useHeadcountSalaryModel', opt.id); onSelect('Headcount Model'); }} style={{ flex: 1, padding: 10, borderRadius: 6, cursor: 'pointer', textAlign: 'center', border: `2px solid ${inp.useHeadcountSalaryModel === opt.id ? C.accent : C.border}`, background: inp.useHeadcountSalaryModel === opt.id ? `${C.accent}22` : 'transparent', color: inp.useHeadcountSalaryModel === opt.id ? C.accent : C.text }}>{opt.label}</div>
          ))}
        </div>
      </Card>

      <Card>
        <Sec>Inputs</Sec>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sections.map(s => {
            const locked = inp.pricingModel === 'perAcre' && s.key === 'Platform Launch';
            return (
              <div key={s.key} onClick={() => !locked && onSelect(s.key)} style={{ padding: '10px', borderRadius: 6, cursor: locked ? 'not-allowed' : 'pointer', background: selected === s.key ? `${C.accent}12` : 'transparent', border: `1px solid ${selected === s.key ? C.accent : C.border}`, opacity: locked ? 0.45 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600 }}>{s.label}</div>
                  {locked && <div style={{ fontSize: 12, color: C.dim }}>Locked</div>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
