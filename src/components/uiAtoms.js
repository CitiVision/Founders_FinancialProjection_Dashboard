import React from 'react';

export const C = {
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

export const Field = ({ label, id, value, onChange, prefix, suffix, hint, readOnly, labelColor }) => {
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

export const Card = ({ children, style = {}, variant }) => {
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

export const Sec = ({ children, color }) => (
  <div style={{ fontSize: "15px", color: color || C.accent, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "monospace", marginBottom: "14px", borderBottom: `1px solid ${C.border}`, paddingBottom: "7px" }}>
    {children}
  </div>
);

export const KPI = ({ label, value, sub, color = C.accent }) => (
  <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: "9px", padding: "13px 17px", flex: 1, minWidth: "145px" }}>
    <div style={{ fontSize: "15px", color: C.muted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "6px" }}>{label}</div>
    <div style={{ fontSize: "24px", fontWeight: 700, color, fontFamily: "monospace", lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: "15px", color: C.muted, marginTop: "5px" }}>{sub}</div>}
  </div>
);

export const TabBtn = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{ background: active ? C.bgHov : "transparent", border: active ? `1px solid ${C.border}` : "1px solid transparent", color: active ? C.accent : C.muted, padding: "7px 13px", borderRadius: "6px", cursor: "pointer", fontSize: "17px", fontFamily: "monospace", whiteSpace: "nowrap" }}>
    {children}
  </button>
);

export const Badge = ({ children, color = C.green }) => (
  <span style={{ background: `${color}22`, color, fontSize: "9px", padding: "2px 7px", borderRadius: "3px", fontFamily: "monospace", letterSpacing: "0.05em", fontWeight: 600 }}>
    {children}
  </span>
);

export default {};
