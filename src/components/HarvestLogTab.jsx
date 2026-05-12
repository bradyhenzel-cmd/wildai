import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../supabase";
import { STATES } from "../constants";
import { DatePickerInput, stripExif } from "../utils";

export default function HarvestLogTab({ user, openSignIn, isPro, openPricingModal }) {
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [logFilter, setLogFilter] = useState("all");
  const [logSort, setLogSort] = useState("newest");
  const [form, setForm] = useState({ type: "hunting", species: "", date: "", location: "", state: "", size: "", weight: "", notes: "", photo: "" });
  const [submittedIds, setSubmittedIds] = useState(new Set());
  const [submittingTrophy, setSubmittingTrophy] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const loadEntries = async () => {
    if (!user) { setLoadingEntries(false); return; }
    setLoadingEntries(true);
    const { data } = await supabase.from("harvest_logs").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setEntries(data || []);
    setLoadingEntries(false);
  };

  useEffect(() => { loadEntries(); }, [user]);

  const save = async () => {
    if (!form.species || !form.date || !user) return;
    let photoUrl = form.photo;
    if (form.photoFile) {
      const fileName = `${user.id}-${Date.now()}-${form.photoFile.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const strippedPhoto = await stripExif(form.photoFile);
      const { data } = await supabase.storage.from("post-photos").upload(fileName, strippedPhoto, { contentType: "image/jpeg" });
      if (data) {
        const { data: urlData } = supabase.storage.from("post-photos").getPublicUrl(fileName);
        photoUrl = urlData.publicUrl;
      }
    }
    await supabase.from("harvest_logs").insert({
      user_id: user.id,
      type: form.type,
      species: form.species,
      date: form.date,
      location: form.location,
      state: form.state,
      size: form.size,
      weight: form.weight,
      notes: form.notes,
      photo: photoUrl,
    });
    setForm({ type: "hunting", species: "", date: "", location: "", state: "", size: "", weight: "", notes: "", photo: "", photoFile: null });
    setShowForm(false);
    loadEntries();
  };

  const remove = async (id) => {
    await supabase.from("harvest_logs").delete().eq("id", id);
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const submitToTrophyBoard = async (e) => {
    if (!user || !e.photo) return;
    setSubmittingTrophy(e.id);
    await supabase.from("trophy_board").insert({
      user_id: user.id,
      username: user.username || user.firstName || "Hunter",
      species: e.species,
      weight: e.weight,
      size: e.size,
      location: e.location,
      state: e.state || "",
      date: e.date,
      photo: e.photo,
      notes: e.notes,
    });
    setSubmittedIds(prev => new Set([...prev, e.id]));
    setSubmittingTrophy(null);
  };

  useEffect(() => {
    const loadSubmitted = async () => {
      if (!user) return;
      const { data: trophies } = await supabase.from("trophy_board").select("species, date").eq("user_id", user.id);
      if (trophies && entries.length) {
        const submitted = new Set(entries.filter(e => trophies.some(t => t.species === e.species && t.date === e.date)).map(e => e.id));
        setSubmittedIds(submitted);
      }
    };
    loadSubmitted();
  }, [user]);


  if (!user) return (
    <div className="card" style={{ padding: 40, textAlign: "center" }}>
      <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Sign In to Use Harvest Log</div>
      <div style={{ color: "var(--text2)", fontSize: 14, marginBottom: 20 }}>Your entries sync across all your devices.</div>
      <button onClick={openSignIn} className="btn-primary" style={{ padding: "12px 28px", fontSize: 14 }}>Sign In →</button>
    </div>
  );

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ textAlign: "center", paddingBottom: 4 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", color: "var(--green)", textTransform: "uppercase", marginBottom: 4 }}>My Log</div>
        <div style={{ color: "var(--text)", fontWeight: 800, fontSize: 28, fontFamily: "var(--font-display)", letterSpacing: "-0.3px", lineHeight: 1 }}>Harvest Log</div>
        <div style={{ color: "var(--text3)", fontSize: 12, marginTop: 6 }}>{entries.length} {entries.length === 1 ? "entry" : "entries"}</div>
      </div>

      {/* Filter row */}
      <div style={{ display: "flex", background: "#0e160e", border: "1px solid #192019", borderRadius: 14, padding: 3 }}>
        {[["all", "All", <svg key="all" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>], ["hunting", "Hunt", <svg key="hunt" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="22" x2="18" y1="12" y2="12" /><line x1="6" x2="2" y1="12" y2="12" /><line x1="12" x2="12" y1="6" y2="2" /><line x1="12" x2="12" y1="22" y2="18" /></svg>], ["fishing", "Fish", <svg key="fish" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="m17.586 11.414-5.93 5.93a1 1 0 0 1-8-8l3.137-3.137a.707.707 0 0 1 1.207.5V10" /><path d="M20.414 8.586 22 7" /><circle cx="19" cy="10" r="2" /></svg>]].map(([val, label, icon]) => {
          const active = logFilter === val;
          return <button key={val} onClick={() => setLogFilter(val)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 0", fontSize: 11, fontWeight: 700, borderRadius: 11, border: "none", cursor: "pointer", transition: "all 0.2s", background: active ? "linear-gradient(135deg,#2d5a1b,#1e4010)" : "transparent", color: active ? "white" : "#4a6a4a", boxShadow: active ? "0 2px 8px rgba(45,90,27,0.5)" : "none", fontFamily: "var(--font-body)" }}>{icon}{label}</button>;
        })}
      </div>

      <button onClick={() => setShowForm(true)} style={{ width: "100%", padding: "11px", borderRadius: 14, border: "1px dashed rgba(120,180,80,0.3)", background: "rgba(120,180,80,0.04)", color: "var(--green)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        Log New Entry
      </button>


      {showForm && createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "linear-gradient(160deg, #0a160a 0%, #060d06 100%)", display: "flex", flexDirection: "column" }}>
          <div style={{ width: "100%", height: "100%", overflowY: "auto", display: "flex", flexDirection: "column", animation: "slideUp 0.3s cubic-bezier(0.32,0.72,0,1)" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 12px", borderBottom: "1px solid rgba(139,195,74,0.08)", background: "rgba(0,0,0,0.3)" }}>
              <div>
                <div style={{ color: "rgba(139,195,74,0.7)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Harvest Log</div>
                <div style={{ color: "#ffffff", fontWeight: 800, fontSize: 18, fontFamily: "var(--font-display)" }}>New Entry</div>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✕</button>
            </div>
            {/* Photo */}
            <label style={{ display: "block", cursor: "pointer", position: "relative" }}>
              <input type="file" accept="image/*" onChange={e => { const file = e.target.files[0]; if (!file) return; setForm(f => ({ ...f, photoFile: file, photo: URL.createObjectURL(file) })); }} style={{ display: "none" }} />
              {form.photo ? (
                <div style={{ position: "relative" }}>
                  <img src={form.photo} style={{ width: "100%", maxHeight: 260, objectFit: "cover", display: "block" }} />
                  <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "5px 12px", fontSize: 11, color: "white", fontWeight: 600 }}>Change Photo</div>
                </div>
              ) : (
                <div style={{ height: 120, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(139,195,74,0.03)", borderTop: "1px solid rgba(139,195,74,0.08)", borderBottom: "1px solid rgba(139,195,74,0.08)" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(139,195,74,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  <span style={{ color: "rgba(139,195,74,0.5)", fontSize: 12, fontWeight: 600 }}>Tap to add a photo</span>
                </div>
              )}
            </label>
            <div style={{ padding: "16px 18px 40px", display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Type toggle */}
              <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 4 }}>
                {[["hunting", "Hunting", <svg key="hunt" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/></svg>], ["fishing", "Fishing", <svg key="fish" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="m17.586 11.414-5.93 5.93a1 1 0 0 1-8-8l3.137-3.137a.707.707 0 0 1 1.207.5V10"/><path d="M20.414 8.586 22 7"/><circle cx="19" cy="10" r="2"/></svg>]].map(([val, label, icon]) => (
                  <button key={val} onClick={() => setForm(f => ({ ...f, type: val }))} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", fontSize: 13, fontWeight: 700, borderRadius: 10, border: "none", cursor: "pointer", transition: "all 0.2s", background: form.type === val ? "linear-gradient(135deg, #3a7020, #2d5a1a)" : "transparent", color: form.type === val ? "#ffffff" : "rgba(255,255,255,0.3)", fontFamily: "var(--font-body)", boxShadow: form.type === val ? "0 2px 8px rgba(0,0,0,0.3)" : "none" }}>
                    {icon}{label}
                  </button>
                ))}
              </div>
              <input placeholder="Species *" maxLength={50} value={form.species} onChange={e => setForm(f => ({ ...f, species: e.target.value }))} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text)", fontFamily: "var(--font-body)", boxSizing: "border-box", outline: "none" }} />
              {/Mobi|Android/i.test(navigator.userAgent) ? (
                <div style={{ display: "flex", gap: 6 }}>
                  {(() => {
                    const parts = form.date ? form.date.split("-") : ["", "", ""];
                    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
                    const days = Array.from({length: 31}, (_, i) => i + 1);
                    const years = Array.from({length: 30}, (_, i) => new Date().getFullYear() - i);
                    const selStyle = { flex: 1, padding: "11px 8px", borderRadius: 12, fontSize: 13, background: "#0e1510", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text)", fontFamily: "var(--font-body)", cursor: "pointer", appearance: "none", WebkitAppearance: "none", textAlign: "center" };
                    const update = (idx, val) => { const p = form.date ? form.date.split("-") : [new Date().getFullYear().toString(), "01", "01"]; p[idx] = val; setForm(f => ({ ...f, date: p.join("-") })); };
                    return <>
                      <select value={parts[1] || ""} onChange={e => update(1, e.target.value)} style={selStyle}>
                        <option value="" disabled>Month</option>
                        {months.map((m, i) => <option key={m} value={String(i+1).padStart(2,"0")}>{m}</option>)}
                      </select>
                      <select value={parts[2] || ""} onChange={e => update(2, e.target.value)} style={{...selStyle, flex: 0.6}}>
                        <option value="" disabled>Day</option>
                        {days.map(d => <option key={d} value={String(d).padStart(2,"0")}>{d}</option>)}
                      </select>
                      <select value={parts[0] || ""} onChange={e => update(0, e.target.value)} style={{...selStyle, flex: 0.8}}>
                        <option value="" disabled>Year</option>
                        {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
                      </select>
                    </>;
                  })()}
                </div>
              ) : (
                <DatePickerInput value={form.date} onChange={val => setForm(f => ({ ...f, date: val }))} maxDate={new Date()} minDate={new Date(new Date().getFullYear() - 10, 0, 1)} placeholder="Select harvest date..." />
              )}
              <input placeholder="Location" maxLength={100} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 13, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text)", fontFamily: "var(--font-body)", boxSizing: "border-box", outline: "none" }} />
              <select value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 13, background: "#0a160a", border: "1px solid rgba(255,255,255,0.08)", color: form.state ? "var(--text)" : "rgba(255,255,255,0.3)", fontFamily: "var(--font-body)", boxSizing: "border-box", outline: "none" }}>
                <option value="">State (optional)</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div style={{ display: "flex", gap: 10 }}>
                <input placeholder="Weight (lbs)" maxLength={8} value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} style={{ flex: 1, minWidth: 0, padding: "12px 14px", borderRadius: 12, fontSize: 13, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text)", fontFamily: "var(--font-body)", boxSizing: "border-box", outline: "none" }} />
                <input placeholder={form.type === "fishing" ? "Length (in)" : "Antlers/Score"} maxLength={30} value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))} style={{ flex: 1, minWidth: 0, padding: "12px 14px", borderRadius: 12, fontSize: 13, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text)", fontFamily: "var(--font-body)", boxSizing: "border-box", outline: "none" }} />
              </div>
              <textarea placeholder="Weather conditions, tactics used, memorable details..." maxLength={500} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 13, minHeight: 80, resize: "none", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text)", fontFamily: "var(--font-body)", boxSizing: "border-box", outline: "none" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(212,147,10,0.06)", border: "1px solid rgba(212,147,10,0.15)", borderRadius: 12 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(212,147,10,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>
                <span style={{ color: "rgba(212,147,10,0.7)", fontSize: 12 }}>Fill out all fields and add a photo to submit to the Trophy Board.</span>
              </div>
              <button onClick={save} disabled={!form.species || !form.date} style={{ width: "100%", padding: "14px", fontSize: 14, fontWeight: 700, borderRadius: 14, border: "none", cursor: "pointer", background: (!form.species || !form.date) ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, #78b450, #4a8a2a)", color: (!form.species || !form.date) ? "rgba(255,255,255,0.2)" : "#ffffff", fontFamily: "var(--font-body)", boxShadow: (!form.species || !form.date) ? "none" : "0 4px 16px rgba(120,180,80,0.35)", transition: "all 0.2s" }}>Save Entry</button>
            </div>
          </div>
        </div>,
        document.body
      )}


      {loadingEntries && <div style={{ textAlign: "center", padding: 40, color: "var(--text3)" }} className="pulse">Loading your log...</div>}

      {!loadingEntries && entries.length === 0 && !showForm && (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text3)", fontSize: 14 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📓</div>
          <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Start Your Harvest Log</div>
          Log your catches and harvests to track your season
        </div>
      )}

      {/* 3-col grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4, marginTop: 4 }}>
        {[...entries]
          .filter(e => logFilter === "all" || e.type === logFilter)
          .sort((a, b) => logSort === "newest" ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date))
          .map(e => (
            <div key={e.id} onClick={() => setSelectedEntry(e)} style={{ position: "relative", aspectRatio: "1", overflow: "hidden", borderRadius: 8, cursor: "pointer", background: "#1a2a1a" }}>
              {e.photo
                ? <img src={e.photo} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--green)" }}>
                  {e.type === "hunting"
                    ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="22" x2="18" y1="12" y2="12" /><line x1="6" x2="2" y1="12" y2="12" /><line x1="12" x2="12" y1="6" y2="2" /><line x1="12" x2="12" y1="22" y2="18" /></svg>
                    : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m17.586 11.414-5.93 5.93a1 1 0 0 1-8-8l3.137-3.137a.707.707 0 0 1 1.207.5V10" /><path d="M20.414 8.586 22 7" /><circle cx="19" cy="10" r="2" /></svg>}
                </div>
              }
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 6px 5px", background: "linear-gradient(transparent, rgba(0,0,0,0.75))" }}>
                <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 9, fontWeight: 600, textAlign: "center", lineHeight: 1.2 }}>{new Date(e.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}</div>
              </div>
            </div>
          ))}
      </div>

      {/* Detail modal */}
      {selectedEntry && (() => {
        const e = selectedEntry;
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.92)", display: "flex", flexDirection: "column" }} onClick={() => setSelectedEntry(null)}>
            <div onClick={ev => ev.stopPropagation()} style={{ background: "#0a0f0a", width: "100%", height: "100%", overflowY: "auto", display: "flex", flexDirection: "column" }}>

              {/* Header bar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 12px", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#2d5a1b,#1e4010)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--green)", flexShrink: 0 }}>
                    {e.type === "hunting"
                      ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/></svg>
                      : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="m17.586 11.414-5.93 5.93a1 1 0 0 1-8-8l3.137-3.137a.707.707 0 0 1 1.207.5V10"/><path d="M20.414 8.586 22 7"/><circle cx="19" cy="10" r="2"/></svg>}
                  </div>
                  <div>
                    <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>{e.species}</div>
                    <div style={{ color: "var(--text3)", fontSize: 11, marginTop: 2 }}>{new Date(e.date + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button onClick={() => { remove(e.id); setSelectedEntry(null); }} style={{ background: "none", border: "none", color: "rgba(255,100,100,0.5)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)", padding: "4px 8px" }}>Delete</button>
                  <button onClick={() => setSelectedEntry(null)} style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "var(--text2)", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✕</button>
                </div>
              </div>

              {/* Full photo — uncropped, full width */}
              {e.photo && (
                <img src={e.photo} style={{ width: "100%", display: "block", objectFit: "contain", background: "#000", flexShrink: 0 }} />
              )}

              {/* Info */}
              <div style={{ padding: "16px 16px 36px", display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Stat pills */}
                {(e.location || e.state || e.weight || e.size) && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {e.location && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 20, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", color: "var(--text2)", fontSize: 12 }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>{e.location}</span>}
                    {e.state && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 20, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", color: "var(--text2)", fontSize: 12 }}>{e.state}</span>}
                    {e.weight && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 20, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", color: "var(--text2)", fontSize: 12 }}>⚖️ {e.weight} lbs</span>}
                    {e.size && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 20, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", color: "var(--text2)", fontSize: 12 }}>📏 {e.size}</span>}
                  </div>
                )}

                {/* Notes */}
                {e.notes && <div style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.7 }}>{e.notes}</div>}

                {/* Trophy board */}
                {e.photo && (
                  <button onClick={() => submitToTrophyBoard(e)} disabled={submittedIds.has(e.id) || submittingTrophy === e.id} style={{ alignSelf: "flex-start", background: submittedIds.has(e.id) ? "var(--green-dim)" : "linear-gradient(135deg,rgba(212,147,10,0.15),rgba(180,120,5,0.1))", border: `1px solid ${submittedIds.has(e.id) ? "var(--border-accent)" : "rgba(212,147,10,0.3)"}`, color: submittedIds.has(e.id) ? "var(--green)" : "var(--amber)", padding: "9px 18px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: submittedIds.has(e.id) ? "default" : "pointer", fontFamily: "var(--font-body)" }}>
                    {submittedIds.has(e.id) ? "✓ On Trophy Board" : submittingTrophy === e.id ? "Submitting..." : "🏆 Submit to Trophy Board"}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
