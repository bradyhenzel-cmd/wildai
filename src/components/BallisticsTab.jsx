import React, { useState } from "react";

export default function BallisticsTab() {
  const [form, setForm] = useState({ label: "", weight: "", velocity: "", bc: "", zero: "100", scopeHeight: "1.5", wind: "" });
  const resetResults = () => setResults(null);
  const [results, setResults] = useState(null);

  const calculate = () => {
    const mv = parseFloat(form.velocity);
    const bc = parseFloat(form.bc);
    const weight = parseFloat(form.weight);
    const zero = parseInt(form.zero);
    const sh = parseFloat(form.scopeHeight) / 12;
    const wind = parseFloat(form.wind) || 0;
    if (!mv || !bc || !weight) return;

    const g = 32.174, dt = 0.001;

    // Ingalls ballistic table — standard G1 reference (Hatcher's Notebook)
    const ingallsF = [
      [800, 1.679], [900, 1.746], [1000, 1.812], [1100, 1.887],
      [1200, 2.388], [1300, 2.945], [1400, 3.175], [1500, 3.284],
      [1600, 3.366], [1700, 3.415], [1800, 3.450], [1900, 3.468],
      [2000, 3.478], [2100, 3.486], [2200, 3.493], [2300, 3.489],
      [2400, 3.474], [2500, 3.450], [2600, 3.418], [2700, 3.382],
      [2800, 3.341], [2900, 3.298], [3000, 3.254], [3100, 3.213],
      [3200, 3.172], [3300, 3.134], [3400, 3.096], [3500, 3.061],
    ];
    const getF = (v) => {
      v = Math.max(800, Math.min(3500, v));
      for (let i = 0; i < ingallsF.length - 1; i++) {
        if (v >= ingallsF[i][0] && v <= ingallsF[i + 1][0]) {
          const t = (v - ingallsF[i][0]) / (ingallsF[i + 1][0] - ingallsF[i][0]);
          return ingallsF[i][1] + t * (ingallsF[i + 1][1] - ingallsF[i][1]);
        }
      }
      return ingallsF[ingallsF.length - 1][1];
    };

    const solve = (targetYards) => {
      const targetFt = targetYards * 3;
      let vx = mv, vy = 0, x = 0, y = 0, t = 0;
      while (x < targetFt && t < 10) {
        const v = Math.sqrt(vx * vx + vy * vy);
        const decel = (getF(v) * v * v) / (bc * 36000);
        vx += -(decel * vx / v) * dt;
        vy += (-g - (decel * vy / v)) * dt;
        x += vx * dt; y += vy * dt; t += dt;
      }
      return { y, v: Math.sqrt(vx * vx + vy * vy), t };
    };

    const rawRows = [];
    for (let yd = 0; yd <= 500; yd += 100) {
      const { y, v, t } = solve(yd);
      const energy = (weight * v * v) / 450400;
      const wind_fps = wind * 1.467;
      const tof_vac = (yd * 3) / mv;
      const drift = Math.round(wind_fps * (t - tof_vac) * 12 * 10) / 10;
      rawRows.push({ yd, drop_in_raw: -y * 12, vr: Math.round(v), energy: Math.round(energy), drift });
    }

    const zeroRow = rawRows.find(r => r.yd === zero) || rawRows[1];
    const zeroDropIn = zeroRow.drop_in_raw - (sh * 12);
    const corrected = rawRows.map(r => ({
      ...r,
      drop: Math.round((r.drop_in_raw - sh * 12 - zeroDropIn) * 10) / 10,
    }));
    setResults(corrected);
  };

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: "linear-gradient(160deg, #0c1c0c 0%, #071007 100%)", border: "1px solid rgba(139,195,74,0.15)", borderTop: "1px solid rgba(139,195,74,0.25)", borderRadius: 16, padding: "16px 18px", boxShadow: "0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(239,68,68,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/></svg>
          </div>
          <div>
            <div style={{ color: "#ffffff", fontWeight: 800, fontSize: 16, fontFamily: "var(--font-display)", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>Ballistics Calculator</div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 2 }}>Bullet drop & wind drift at range</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ color: "rgba(139,195,74,0.6)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 6 }}>LOAD NAME (optional)</div>
            <input placeholder="" value={form.label} onChange={e => { setForm(f => ({ ...f, label: e.target.value })); resetResults(); }} style={{ width: "100%", padding: "11px 14px", borderRadius: 12, fontSize: 13, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text)", outline: "none", boxSizing: "border-box" }} />
          </div>
          {[
            { key: "weight", label: "BULLET WEIGHT (gr)", placeholder: "168", type: "number" },
            { key: "velocity", label: "MUZZLE VELOCITY (fps)", placeholder: "2650", type: "number" },
            { key: "bc", label: "BALLISTIC COEFF (G1)", placeholder: "0.47", type: "number" },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <div style={{ color: "rgba(139,195,74,0.6)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 6 }}>{label}</div>
              <input type={type} placeholder="" value={form[key]} onChange={e => { setForm(f => ({ ...f, [key]: e.target.value })); resetResults(); }} style={{ width: "100%", padding: "11px 14px", borderRadius: 12, fontSize: 13, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text)", outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}
          <div>
            <div style={{ color: "rgba(139,195,74,0.6)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 6 }}>ZERO DISTANCE (yd)</div>
            <select value={form.zero} onChange={e => { setForm(f => ({ ...f, zero: e.target.value })); resetResults(); }} style={{ width: "100%", padding: "11px 14px", borderRadius: 12, fontSize: 13, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text)", outline: "none", boxSizing: "border-box" }}>
              <option value="50">50 yards</option>
              <option value="100">100 yards</option>
              <option value="200">200 yards</option>
              <option value="300">300 yards</option>
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ color: "rgba(139,195,74,0.6)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 6 }}>WIND SPEED (mph)</div>
            <input type="number" placeholder="" value={form.wind} onChange={e => { setForm(f => ({ ...f, wind: e.target.value })); resetResults(); }} style={{ width: "100%", padding: "11px 14px", borderRadius: 12, fontSize: 13, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text)", outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>
        <button onClick={calculate} disabled={!form.weight || !form.velocity || !form.bc} style={{ width: "100%", padding: "13px", fontSize: 14, fontWeight: 700, borderRadius: 12, border: "none", cursor: "pointer", background: (!form.weight || !form.velocity || !form.bc) ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, #78b450, #4a8a2a)", color: (!form.weight || !form.velocity || !form.bc) ? "rgba(255,255,255,0.25)" : "#ffffff", transition: "all 0.2s", fontFamily: "var(--font-body)", boxShadow: (!form.weight || !form.velocity || !form.bc) ? "none" : "0 4px 16px rgba(120,180,80,0.35)" }}>
          Calculate Drop Chart
        </button>
      </div>

      {results && (
        <div style={{ background: "linear-gradient(160deg, #0c1c0c 0%, #071007 100%)", border: "1px solid rgba(139,195,74,0.15)", borderTop: "1px solid rgba(139,195,74,0.25)", borderRadius: 16, padding: "20px", overflowX: "auto", boxShadow: "0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            {form.label ? <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 15, fontFamily: "var(--font-display)" }}>{form.label}</div> : <div />}
            <button onClick={() => setResults(null)} style={{ background: "none", border: "none", color: "var(--text3)", fontSize: 18, cursor: "pointer", padding: 0, lineHeight: 1 }}>✕</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Range", "Drop", "Velocity", "Energy", form.wind ? "Wind Drift" : null].filter(Boolean).map(h => (
                  <th key={h} style={{ color: "var(--text3)", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textAlign: "center", padding: "6px 8px", borderBottom: "1px solid var(--border)" }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={r.yd} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                  <td style={{ color: "var(--green)", fontWeight: 700, textAlign: "center", padding: "10px 8px" }}>{r.yd} yd</td>
                  <td style={{ color: r.drop > 0 ? "rgba(255,100,100,0.8)" : r.drop < 0 ? "var(--green)" : "var(--text)", textAlign: "center", padding: "10px 8px", fontWeight: 600 }}>{r.drop > 0 ? "+" : ""}{r.drop}"</td>
                  <td style={{ color: "var(--text2)", textAlign: "center", padding: "10px 8px" }}>{r.vr} fps</td>
                  <td style={{ color: "var(--text2)", textAlign: "center", padding: "10px 8px" }}>{r.energy} ft-lb</td>
                  {form.wind && <td style={{ color: "var(--amber)", textAlign: "center", padding: "10px 8px" }}>{r.drift}"</td>}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--amber-dim)", border: "1px solid rgba(212,147,10,0.2)", borderRadius: "var(--radius-sm)" }}>
            <p style={{ color: "rgba(212,147,10,0.8)", fontSize: 11, margin: 0 }}>⚠️ Simplified G1 model — use as a field reference only. Always confirm with actual range data.</p>
          </div>
        </div>
      )}
    </div>
  );
}
