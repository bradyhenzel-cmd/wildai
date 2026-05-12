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
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(160deg, #0c1c0c 0%, #071007 100%)", border: "1px solid rgba(139,195,74,0.15)", borderTop: "1px solid rgba(139,195,74,0.25)", borderRadius: 16, padding: "16px 18px", boxShadow: "0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "rgba(139,195,74,0.7)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Regulations</div>
          <div style={{ color: "#ffffff", fontWeight: 800, fontSize: 26, fontFamily: "var(--font-display)", letterSpacing: "-0.01em", textShadow: "0 0 20px rgba(255,255,255,0.1)", lineHeight: 1 }}>{selectedState}</div>
        </div>
        {currentUser?.id === ADMIN_USER_ID && (
          <button onClick={() => setShowAdmin(s => !s)} className="btn-ghost" style={{ padding: "6px 14px", fontSize: 12 }}>
            {showAdmin ? "✕ Close" : "Admin"}
          </button>
        )}
      </div>

      {/* Official links */}
      {STATE_WILDLIFE_AGENCIES[selectedState] && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { href: STATE_WILDLIFE_AGENCIES[selectedState].hunting, label: "Hunting Regs", sub: "Official state rules", accent: "rgba(212,147,10,0.12)", border: "rgba(212,147,10,0.25)", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(212,147,10,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/></svg> },
            { href: STATE_WILDLIFE_AGENCIES[selectedState].fishing, label: "Fishing Regs", sub: "Official state rules", accent: "rgba(74,144,217,0.12)", border: "rgba(74,144,217,0.25)", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(74,144,217,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m17.586 11.414-5.93 5.93a1 1 0 0 1-8-8l3.137-3.137a.707.707 0 0 1 1.207.5V10"/><path d="M20.414 8.586 22 7"/><circle cx="19" cy="10" r="2"/></svg> },
          ].map(({ href, label, sub, accent, border, icon }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <div style={{ background: "linear-gradient(160deg, #0c1c0c 0%, #071007 100%)", border: `1px solid ${border}`, borderRadius: 16, padding: "20px 16px", textAlign: "center", cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: accent, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
                <div>
                  <div style={{ color: "#ffffff", fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{label}</div>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{sub}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(139,195,74,0.7)", fontSize: 11, fontWeight: 600 }}>
                  View Official Site
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      <div style={{ padding: "13px 16px", background: "rgba(139,195,74,0.04)", border: "1px solid rgba(139,195,74,0.1)", borderRadius: 14 }}>
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, lineHeight: 1.6, textAlign: "center" }}>Detailed in-app regulations coming soon. Official agency links above are always current.</div>
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
