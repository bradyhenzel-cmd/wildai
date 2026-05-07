import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { STATES, STATE_WILDLIFE_AGENCIES, ADMIN_USER_ID } from "../constants";

export default function RegulationsTab({ selectedState, currentUser }) {
  const [regs, setRegs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState({});
  const [scraping, setScraping] = useState(false);

  useEffect(() => {
    if (!selectedState) return;
    const load = async () => {
      setLoading(true);
      setRegs(null);
      const { data } = await supabase.from("regulations_cache").select("*").eq("state", selectedState).single();
      if (false) {
        setRegs(data);
      } else {
        await generate();
      }
      setLoading(false);
    };
    load();
  }, [selectedState]);

  const generate = async () => {
    return; // disabled
    setGenerating(true);
    try {
      return; // regs disabled
      const prompt = `Provide current ${new Date().getFullYear()} hunting and fishing regulations for ${selectedState}. Return a JSON object with exactly these three keys: "hunting" (key species season dates and bag limits), "fishing" (key species seasons and limits), "general" (license costs and important notes). Keep each value under 300 characters. No markdown, just the JSON object.`;
      const res = await fetch("https://wildai-server.onrender.com/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }], system: "Return only a valid JSON object with hunting, fishing, and general keys. No markdown. No explanation." })
      });
      const d = await res.json();
      const text = d.reply.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(text);
      await supabase.from("regulations_cache").upsert({ state: selectedState, hunting: parsed.hunting, fishing: parsed.fishing, general: parsed.general, updated_at: new Date().toISOString() });
      setRegs({ ...parsed, state: selectedState });
    } catch { }
    setGenerating(false);
  };

  const refresh = async () => {
    await supabase.from("regulations_cache").delete().eq("state", selectedState);
    setRegs(null);
    await generate();
  };

  const scrapeAllStates = async () => {
    setScraping(true);
    setScrapeStatus({});
    for (const state of STATES) {
      setScrapeStatus(prev => ({ ...prev, [state]: "loading" }));
      const agency = STATE_WILDLIFE_AGENCIES[state];
      try {
        const res = await fetch("https://wildai-server.onrender.com/scrape-regulations", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state, huntingUrl: agency.hunting, fishingUrl: agency.fishing })
        });
        const d = await res.json();
        if (d.success) {
          await supabase.from("regulations_cache").upsert({ state, hunting: d.data.hunting, fishing: d.data.fishing, general: d.data.general, updated_at: new Date().toISOString() });
          setScrapeStatus(prev => ({ ...prev, [state]: d.data.scraped ? "scraped" : "ai" }));
        } else {
          setScrapeStatus(prev => ({ ...prev, [state]: "error" }));
        }
      } catch {
        setScrapeStatus(prev => ({ ...prev, [state]: "error" }));
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    setScraping(false);
  };

  if (!selectedState) return (
    <div className="card" style={{ padding: 40, textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
      <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Select Your State</div>
      <div style={{ color: "var(--text2)", fontSize: 14 }}>Go back home and choose your state to view regulations.</div>
    </div>
  );

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
        <div>
          <div style={{ color: "var(--text3)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 2 }}>REGULATIONS</div>
          <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 22, fontFamily: "var(--font-display)" }}>{selectedState}</div>
        </div>
        {currentUser?.id === ADMIN_USER_ID && (
          <button onClick={() => setShowAdmin(s => !s)} className="btn-ghost" style={{ padding: "6px 14px", fontSize: 12 }}>
            {showAdmin ? "✕ Close" : "⚙️ Admin"}
          </button>
        )}
      </div>

      {/* Official links */}
      {STATE_WILDLIFE_AGENCIES[selectedState] && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <a href={STATE_WILDLIFE_AGENCIES[selectedState].hunting} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", textDecoration: "none", transition: "border-color 0.2s" }} onMouseEnter={e => e.currentTarget.style.borderColor = "var(--green)"} onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div>
                <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 15, fontFamily: "var(--font-display)", marginBottom: 3 }}>Hunting Regulations</div>
                <div style={{ color: "var(--text3)", fontSize: 12 }}>{selectedState} Official Wildlife Agency</div>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
          </a>
          <a href={STATE_WILDLIFE_AGENCIES[selectedState].fishing} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", textDecoration: "none", transition: "border-color 0.2s" }} onMouseEnter={e => e.currentTarget.style.borderColor = "var(--green)"} onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div>
                <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 15, fontFamily: "var(--font-display)", marginBottom: 3 }}>Fishing Regulations</div>
                <div style={{ color: "var(--text3)", fontSize: 12 }}>{selectedState} Official Wildlife Agency</div>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
          </a>
        </div>
      )}

      <div style={{ padding: "13px 18px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
        <div style={{ color: "var(--text3)", fontSize: 12, lineHeight: 1.6 }}>Detailed in-app regulations coming soon. Official agency links above are always current.</div>
      </div>

      {regs && !loading && !generating && (
        <>
          {[
            { emoji: "🎯", label: "Hunting", text: regs.hunting, accent: "rgba(212,147,10,0.12)", border: "rgba(212,147,10,0.25)", color: "var(--amber)" },
            { emoji: "🎣", label: "Fishing", text: regs.fishing, accent: "rgba(80,140,220,0.1)", border: "rgba(80,140,220,0.25)", color: "#7ab0e0" },
            { emoji: "📋", label: "Licenses & General Info", text: regs.general, accent: "rgba(120,180,80,0.08)", border: "var(--border-accent)", color: "var(--green)" },
          ].map(({ emoji, label, text, accent, border, color }) => (
            <div key={label} style={{ background: accent, border: `1px solid ${border}`, borderRadius: "var(--radius)", padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: accent, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: `0 0 20px ${border}` }}>{emoji}</div>
                <span style={{ color, fontWeight: 700, fontSize: 15, fontFamily: "var(--font-display)" }}>{label}</span>
              </div>
              <p style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.85, margin: 0 }}>{text}</p>
            </div>
          ))}
        </>
      )}

      {showAdmin && currentUser?.id === ADMIN_USER_ID && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 15 }}>⚙️ Admin — Scrape All States</div>
            <button onClick={scrapeAllStates} disabled={scraping} className="btn-primary" style={{ padding: "8px 18px", fontSize: 13, opacity: scraping ? 0.5 : 1 }}>
              {scraping ? "⏳ Running..." : "▶ Run All 50 States"}
            </button>
          </div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 12 }}>Fetches each state's official site and generates structured regulations. Takes ~5 minutes.</div>
          <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 11, color: "var(--text3)" }}>
            <span>✅ Scraped from official site</span>
            <span>🟡 AI knowledge fallback</span>
            <span>❌ Failed</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 6 }}>
            {STATES.map(s => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", borderRadius: "var(--radius-sm)", background: scrapeStatus[s] === "scraped" ? "var(--green-dim)" : scrapeStatus[s] === "ai" ? "rgba(212,147,10,0.1)" : scrapeStatus[s] === "error" ? "rgba(255,100,100,0.1)" : scrapeStatus[s] === "loading" ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                <span style={{ fontSize: 10 }}>{scrapeStatus[s] === "scraped" ? "✅" : scrapeStatus[s] === "ai" ? "🟡" : scrapeStatus[s] === "error" ? "❌" : scrapeStatus[s] === "loading" ? "⏳" : "⬜"}</span>
                <span style={{ fontSize: 11, color: "var(--text2)" }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {false && <div style={{ padding: "16px 20px", background: "var(--green-dim)", border: "1px solid var(--border-accent)", borderRadius: "var(--radius)" }}>
        <p style={{ color: "var(--green)", fontSize: 13, lineHeight: 1.7 }}>💬 Have a specific regulation question? Ask Ravlin in the Guide tab for more detailed info.</p>
      </div>}
    </div>
  );
}
