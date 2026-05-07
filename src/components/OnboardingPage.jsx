import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { capName } from "../utils";

const US_STATES = ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"];

export default function OnboardingPage({ user, onComplete, setSelectedState }) {
  const [step, setStep] = useState(1);
  const [state, setState] = useState("");

  const [stateOpen, setStateOpen] = useState(false);
  const [stateSearch, setStateSearch] = useState("");
  const [interests, setInterests] = useState("both");
  const [following, setFollowing] = useState(new Set());
  const [suggestedUsers, setSuggestedUsers] = useState([]);

  useEffect(() => {
    supabase.from("profiles").select("user_id, username, avatar_url, bio").neq("user_id", user.id).limit(12).then(({ data }) => {
      const blocked = ["example", "test", "user_342", "admin", "user"];
      const adminId = "user_3CKoCuA9KUvrtfrJ3ia3Bm2BH1a";
      setSuggestedUsers((data || []).filter(u => u.username && u.user_id !== adminId && !blocked.includes(u.username.toLowerCase()) && !u.username.toLowerCase().startsWith("user_")).slice(0, 6));
    });
  }, []);

  const complete = async () => {
    await supabase.from("profiles").update({ onboarding_complete: true, interests, selected_state: state || null }).eq("user_id", user.id);
    if (state) setSelectedState(state);
    for (const uid of following) {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: uid }).catch(() => { });
    }
    onComplete();
  };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
          {[1, 2, 3].map(s => <div key={s} style={{ flex: 1, height: 3, borderRadius: 4, background: step >= s ? "var(--green)" : "var(--border)", transition: "background 0.3s" }} />)}
        </div>

        {step === 1 && (
          <div className="fade-in">
            <div style={{ marginBottom: 16 }}><img src="/logo.png" style={{ width: 176, height: 176, objectFit: "contain" }} /></div>
            <div style={{ color: "var(--text)", fontWeight: 800, fontSize: 24, marginBottom: 8 }}>Welcome to Ravlin</div>
            <div style={{ color: "var(--text2)", fontSize: 15, marginBottom: 32, lineHeight: 1.5 }}>Let's personalize your experience. What do you primarily do?</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                ["hunting", "Hunting", <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="22" x2="18" y1="12" y2="12" /><line x1="6" x2="2" y1="12" y2="12" /><line x1="12" x2="12" y1="6" y2="2" /><line x1="12" x2="12" y1="22" y2="18" /></svg>],
                ["fishing", "Fishing", <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="m17.586 11.414-5.93 5.93a1 1 0 0 1-8-8l3.137-3.137a.707.707 0 0 1 1.207.5V10" /><path d="M20.414 8.586 22 7" /><circle cx="19" cy="10" r="2" /></svg>],
                ["both", "Both", <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>],
              ].map(([val, label, icon]) => (
                <button key={val} onClick={() => setInterests(val)} style={{ padding: "18px 20px", borderRadius: 14, border: `2px solid ${interests === val ? "var(--green)" : "var(--border)"}`, background: interests === val ? "rgba(120,180,80,0.12)" : "var(--card)", color: interests === val ? "var(--green)" : "var(--text)", fontSize: 16, fontWeight: 700, cursor: "pointer", textAlign: "left", fontFamily: "var(--font-body)", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 14 }}>
                  {icon}{label}
                  {interests === val && <svg style={{ marginLeft: "auto" }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)} style={{ width: "100%", padding: "17px", marginTop: 24, fontSize: 16, fontWeight: 700, borderRadius: 14, background: "linear-gradient(135deg, #78b450, #4a8a2a)", border: "none", color: "white", cursor: "pointer", fontFamily: "var(--font-body)", boxShadow: "0 4px 20px rgba(120,180,80,0.35)", transition: "transform 0.15s, box-shadow 0.15s" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(120,180,80,0.45)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(120,180,80,0.35)"; }} onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"} onMouseUp={e => e.currentTarget.style.transform = "translateY(-2px)"} onTouchStart={e => e.currentTarget.style.transform = "scale(0.97)"} onTouchEnd={e => { const el = e.currentTarget; el.style.transform = "scale(1.02)"; setTimeout(() => { if (el) el.style.transform = "scale(1)"; }, 150); }}>Continue →</button>
          </div>
        )}

        {step === 2 && (
          <div className="fade-in">
            <div style={{ marginBottom: 8 }}><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg></div>
            <div style={{ color: "var(--text)", fontWeight: 800, fontSize: 24, marginBottom: 8 }}>Where do you hunt or fish?</div>
            <div style={{ color: "var(--text2)", fontSize: 15, marginBottom: 24, lineHeight: 1.5 }}>We'll use this for regulations, weather and local content.</div>
            <div style={{ position: "relative", marginBottom: 24 }}>
              {window.matchMedia("(hover: hover)").matches ? (
                <>
                  <input value={stateSearch || state} onChange={e => { setState(""); setStateSearch(e.target.value); setStateOpen(true); }} onFocus={() => { if (state) setStateSearch(state); setStateOpen(true); }} onBlur={() => setTimeout(() => setStateOpen(false), 150)} placeholder="Search your state..." style={{ width: "100%", padding: "14px 16px", borderRadius: stateOpen ? "14px 14px 0 0" : 14, border: `2px solid ${state ? "var(--border-accent)" : "var(--border)"}`, background: "#0d1a0d", color: "var(--text)", fontSize: 15, fontFamily: "var(--font-body)", outline: "none", boxSizing: "border-box" }} />
                  {stateOpen && (
                    <div style={{ background: "#0d1a0d", border: "2px solid var(--border)", borderTop: "1px solid rgba(255,255,255,0.06)", borderRadius: "0 0 14px 14px", maxHeight: 220, overflowY: "auto", position: "absolute", width: "100%", zIndex: 10 }}>
                      {US_STATES.filter(s => s.toLowerCase().includes((stateSearch || "").toLowerCase())).map(s => (
                        <div key={s} onClick={() => { setState(s); setStateSearch(""); setStateOpen(false); }} style={{ padding: "12px 16px", cursor: "pointer", color: "var(--text)", fontSize: 15, borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(120,180,80,0.08)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>{s}</div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div onClick={() => setStateOpen(o => !o)} style={{ width: "100%", padding: "14px 16px", borderRadius: stateOpen ? "14px 14px 0 0" : 14, border: `2px solid ${state ? "var(--border-accent)" : "var(--border)"}`, background: "#0d1a0d", color: state ? "var(--text)" : "var(--text3)", fontSize: 15, fontFamily: "var(--font-body)", boxSizing: "border-box", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {state || "Select your state..."}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points={stateOpen ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} /></svg>
                  </div>
                  {stateOpen && (
                    <div style={{ background: "#0d1a0d", border: "2px solid var(--border)", borderTop: "1px solid rgba(255,255,255,0.06)", borderRadius: "0 0 14px 14px", maxHeight: 220, overflowY: "auto", position: "absolute", width: "100%", zIndex: 10 }}>
                      {US_STATES.map(s => (
                        <div key={s} onClick={() => { setState(s); setStateOpen(false); }} style={{ padding: "12px 16px", cursor: "pointer", color: "var(--text)", fontSize: 15, borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(120,180,80,0.08)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>{s}</div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            <div style={{ color: "var(--text3)", fontSize: 12, textAlign: "center", marginBottom: 16 }}>You can change this anytime in settings</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: "17px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--card)", color: "var(--text2)", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", transition: "transform 0.15s", boxShadow: "none" }} onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"} onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}>← Back</button>
              <button disabled={!state} onClick={() => setStep(3)} style={{ flex: 2, padding: "17px", borderRadius: 14, background: state ? "linear-gradient(135deg, #78b450, #4a8a2a)" : "rgba(255,255,255,0.06)", border: "none", color: state ? "white" : "var(--text3)", fontSize: 16, fontWeight: 700, cursor: state ? "pointer" : "default", fontFamily: "var(--font-body)", boxShadow: state ? "0 4px 20px rgba(120,180,80,0.35)" : "none", transition: "transform 0.15s, box-shadow 0.15s" }} onMouseEnter={e => { if (!state) return; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(120,180,80,0.45)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = state ? "0 4px 20px rgba(120,180,80,0.35)" : "none"; }} onMouseDown={e => { if (state) e.currentTarget.style.transform = "scale(0.97)"; }} onMouseUp={e => { if (state) e.currentTarget.style.transform = "translateY(-2px)"; }} onTouchStart={e => { if (state) e.currentTarget.style.transform = "scale(0.97)"; }} onTouchEnd={e => { if (!state) return; const el = e.currentTarget; el.style.transform = "scale(1.02)"; setTimeout(() => { if (el) el.style.transform = "scale(1)"; }, 150); }}>Continue →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="fade-in">
            <div style={{ marginBottom: 8 }}><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg></div>
            <div style={{ color: "var(--text)", fontWeight: 800, fontSize: 24, marginBottom: 8 }}>Follow some people</div>
            <div style={{ color: "var(--text2)", fontSize: 15, marginBottom: 24, lineHeight: 1.5 }}>Follow a few people to fill your feed with posts.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {suggestedUsers.map(u => (
                <div key={u.user_id} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--card)", border: `1px solid ${following.has(u.user_id) ? "var(--border-accent)" : "var(--border)"}`, borderRadius: 14, padding: "12px 14px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--green-dim)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "var(--green)", flexShrink: 0 }}>
                    {u.avatar_url ? <img src={u.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : u.username[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 14 }}>{capName(u.username)}</div>

                  </div>
                  <button onClick={() => setFollowing(prev => { const n = new Set(prev); n.has(u.user_id) ? n.delete(u.user_id) : n.add(u.user_id); return n; })} style={{ padding: "7px 14px", borderRadius: 20, border: `1px solid ${following.has(u.user_id) ? "var(--border-accent)" : "var(--border)"}`, background: following.has(u.user_id) ? "rgba(120,180,80,0.12)" : "var(--card)", color: following.has(u.user_id) ? "var(--green)" : "var(--text2)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", flexShrink: 0 }}>{following.has(u.user_id) ? "Following" : "Follow"}</button>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(2)} style={{ flex: 1, padding: "17px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--card)", color: "var(--text2)", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", transition: "transform 0.15s" }} onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"} onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}>← Back</button>
              <button onClick={complete} style={{ flex: 2, padding: "17px", borderRadius: 14, background: "linear-gradient(135deg, #78b450, #4a8a2a)", border: "none", color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", boxShadow: "0 4px 20px rgba(120,180,80,0.35)", transition: "transform 0.15s, box-shadow 0.15s" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(120,180,80,0.45)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(120,180,80,0.35)"; }} onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"} onMouseUp={e => e.currentTarget.style.transform = "translateY(-2px)"} onTouchStart={e => e.currentTarget.style.transform = "scale(0.97)"} onTouchEnd={e => { const el = e.currentTarget; el.style.transform = "scale(1.02)"; setTimeout(() => { if (el) el.style.transform = "scale(1)"; }, 150); }}>Let's go!</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
