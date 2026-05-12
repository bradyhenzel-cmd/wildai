import React from "react";
import { Lock } from "lucide-react";
import { STATE_WILDLIFE_AGENCIES } from "../constants";

export default function LicensesTab({ selectedState }) {
  const agency = selectedState ? STATE_WILDLIFE_AGENCIES[selectedState] : null;
  if (!selectedState) return (
    <div className="card" style={{ padding: 40, textAlign: "center" }}>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}><Lock size={48} color="rgba(255,255,255,0.15)" /></div>
      <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Select Your State</div>
      <div style={{ color: "var(--text2)", fontSize: 14 }}>Go back home and choose your state to view license options.</div>
    </div>
  );
  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header card */}
      <div style={{ background: "linear-gradient(160deg, #0c1c0c 0%, #071007 100%)", border: "1px solid rgba(139,195,74,0.15)", borderTop: "1px solid rgba(139,195,74,0.25)", borderRadius: 16, padding: "16px 18px", boxShadow: "0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)" }}>
        <div style={{ color: "rgba(139,195,74,0.7)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Licenses</div>
        <div style={{ color: "#ffffff", fontWeight: 800, fontSize: 26, fontFamily: "var(--font-display)", letterSpacing: "-0.01em", textShadow: "0 0 20px rgba(255,255,255,0.1)", lineHeight: 1 }}>{selectedState}</div>
        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 4 }}>{agency?.name}</div>
      </div>

      {/* License cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[
          { href: agency?.hunting, label: "Hunting License", sub: "Tags, permits & stamps", accent: "rgba(212,147,10,0.15)", border: "rgba(212,147,10,0.25)", btnBg: "linear-gradient(135deg,#d4930a,#a06800)", icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(212,147,10,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/></svg> },
          { href: agency?.fishing, label: "Fishing License", sub: "Freshwater & saltwater", accent: "rgba(74,144,217,0.12)", border: "rgba(74,144,217,0.25)", btnBg: "linear-gradient(135deg,#4a90d9,#2060a0)", icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(74,144,217,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m17.586 11.414-5.93 5.93a1 1 0 0 1-8-8l3.137-3.137a.707.707 0 0 1 1.207.5V10"/><path d="M20.414 8.586 22 7"/><circle cx="19" cy="10" r="2"/></svg> },
        ].map(({ href, label, sub, accent, border, btnBg, icon }) => (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
            <div style={{ background: "linear-gradient(160deg, #0c1c0c 0%, #071007 100%)", border: `1px solid ${border}`, borderTop: `1px solid ${border}`, borderRadius: 16, padding: "22px 16px", textAlign: "center", cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: accent, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
              <div>
                <div style={{ color: "#ffffff", fontWeight: 700, fontSize: 14, marginBottom: 3, textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>{label}</div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{sub}</div>
              </div>
              <div style={{ background: btnBg, color: "white", padding: "9px 20px", borderRadius: 10, fontSize: 12, fontWeight: 700, width: "100%", boxSizing: "border-box", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>Buy Now →</div>
            </div>
          </a>
        ))}
      </div>

      {/* Warning */}
      <div style={{ padding: "14px 16px", background: "rgba(212,147,10,0.06)", border: "1px solid rgba(212,147,10,0.18)", borderRadius: 14 }}>
        <p style={{ color: "rgba(212,147,10,0.7)", fontSize: 12, lineHeight: 1.7, margin: 0, textAlign: "center" }}>License requirements and fees change annually. Always verify with your state agency.</p>
      </div>
    </div>
  );
}
