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
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="card" style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 24 }}>🎯</span>
          <div>
            <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, fontFamily: "var(--font-display)" }}>Ballistics Calculator</div>
            <div style={{ color: "var(--text3)", fontSize: 12 }}>Bullet drop & wind drift at range</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 5 }}>LOAD NAME (optional)</div>
            <input placeholder=".308 Win 168gr Federal" value={form.label} onChange={e => { setForm(f => ({ ...f, label: e.target.value })); resetResults(); }} style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", fontSize: 13 }} />
          </div>
          <div>
            <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 5 }}>BULLET WEIGHT (gr)</div>
            <input type="number" placeholder="168" value={form.weight} onChange={e => { setForm(f => ({ ...f, weight: e.target.value })); resetResults(); }} style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", fontSize: 13 }} />
          </div>
          <div>
            <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 5 }}>MUZZLE VELOCITY (fps)</div>
            <input type="number" placeholder="2650" value={form.velocity} onChange={e => { setForm(f => ({ ...f, velocity: e.target.value })); resetResults(); }} style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", fontSize: 13 }} />
          </div>
          <div>
            <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 5 }}>BALLISTIC COEFF (G1)</div>
            <input type="number" placeholder="0.47" value={form.bc} onChange={e => { setForm(f => ({ ...f, bc: e.target.value })); resetResults(); }} style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", fontSize: 13 }} />
          </div>
          <div>
            <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 5 }}>ZERO DISTANCE (yd)</div>
            <select value={form.zero} onChange={e => { setForm(f => ({ ...f, zero: e.target.value })); resetResults(); }} style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", fontSize: 13 }}>
              <option value="50">50 yards</option>
              <option value="100">100 yards</option>
              <option value="200">200 yards</option>
              <option value="300">300 yards</option>
            </select>
          </div>
          <div>
            <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 5 }}>WIND SPEED (mph)</div>
            <input type="number" placeholder="10" value={form.wind} onChange={e => { setForm(f => ({ ...f, wind: e.target.value })); resetResults(); }} style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", fontSize: 13 }} />
          </div>
        </div>
        <button onClick={calculate} disabled={!form.weight || !form.velocity || !form.bc} className="btn-primary" style={{ width: "100%", padding: "11px", fontSize: 14, opacity: (!form.weight || !form.velocity || !form.bc) ? 0.5 : 1 }}>
          Calculate Drop Chart
        </button>
      </div>

      {results && (
        <div className="card fade-in" style={{ padding: "20px 24px", overflowX: "auto" }}>
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
