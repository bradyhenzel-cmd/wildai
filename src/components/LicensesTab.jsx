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
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="card" style={{ padding: "20px 24px" }}>
        <div style={{ color: "var(--text3)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4 }}>STATE WILDLIFE AGENCY</div>
        <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 20, marginBottom: 4 }}>{agency?.name}</div>
        <div style={{ color: "var(--text3)", fontSize: 13 }}>{selectedState}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <a href={agency?.hunting} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
          <div className="card" style={{ padding: "28px 20px", textAlign: "center", cursor: "pointer", borderColor: "rgba(212,147,10,0.3)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
            <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Hunting License</div>
            <div style={{ color: "var(--text2)", fontSize: 13, marginBottom: 16 }}>Tags, permits & stamps</div>
            <div style={{ background: "linear-gradient(135deg,var(--amber),#a06800)", color: "white", padding: "10px 20px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 600 }}>Buy Now →</div>
          </div>
        </a>
        <a href={agency?.fishing} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
          <div className="card" style={{ padding: "28px 20px", textAlign: "center", cursor: "pointer", borderColor: "rgba(80,140,220,0.3)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎣</div>
            <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Fishing License</div>
            <div style={{ color: "var(--text2)", fontSize: 13, marginBottom: 16 }}>Freshwater & saltwater</div>
            <div style={{ background: "linear-gradient(135deg,#4a90d9,#2060a0)", color: "white", padding: "10px 20px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 600 }}>Buy Now →</div>
          </div>
        </a>
      </div>
      {false && <div style={{ padding: "16px 20px", background: "var(--green-dim)", border: "1px solid var(--border-accent)", borderRadius: "var(--radius)" }}>
        <p style={{ color: "var(--green)", fontSize: 13, lineHeight: 1.7 }}>💬 Have a specific regulation question? Ask Ravlin in the Guide tab for more detailed info.</p>
        {STATE_WILDLIFE_AGENCIES[selectedState] && (
          <a href={STATE_WILDLIFE_AGENCIES[selectedState].hunting} target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)", fontSize: 13, fontWeight: 600, display: "inline-block", marginTop: 8 }}>
            Visit {STATE_WILDLIFE_AGENCIES[selectedState].name} for official regulations →
          </a>
        )}
      </div>}
      <div style={{ padding: "16px 20px", background: "var(--amber-dim)", border: "1px solid rgba(212,147,10,0.2)", borderRadius: "var(--radius)" }}>
        <p style={{ color: "rgba(212,147,10,0.9)", fontSize: 13, lineHeight: 1.7 }}>⚠️ License requirements and fees change annually. Always verify current requirements with your state agency.</p>
      </div>
    </div>
  );
}
