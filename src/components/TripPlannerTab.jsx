import React, { useState, useEffect, useRef } from "react";
import { Fish, AlertTriangle } from "lucide-react";
import { supabase } from "../supabase";
import { STATE_COORDS } from "../constants";
import { DatePickerInput } from "../utils";

export default function TripPlannerTab({ selectedState, user, isPro, hitLimit, messageCount, setMessageCount, onUpgrade, isGuest }) {
  const [step, setStep] = useState(1);
  const [activityType, setActivityType] = useState("hunting");
  const [targetSpecies, setTargetSpecies] = useState("");
  const [experience, setExperience] = useState("intermediate");
  const [duration, setDuration] = useState("3");
  const [groupSize, setGroupSize] = useState("2");
  const [startDate, setStartDate] = useState("");
  const [notes, setNotes] = useState("");
  const [plan, setPlan] = useState(null);
  const [parsedSections, setParsedSections] = useState([]);
  const [checkedGear, setCheckedGear] = useState({});
  const [collapsedSections, setCollapsedSections] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [weather, setWeather] = useState(null);
  const [savedPins, setSavedPins] = useState({});
  const planRef = useRef(null);

  const HUNTING_SPECIES = ["Elk", "Whitetail Deer", "Mule Deer", "Turkey", "Bear", "Antelope", "Pheasant", "Duck", "Goose", "Grouse", "Moose", "Bighorn Sheep", "Mountain Goat", "Coyote", "Rabbit", "Other"];
  const FISHING_SPECIES = ["Bass", "Trout", "Walleye", "Catfish", "Pike", "Salmon", "Crappie", "Bluegill", "Muskie", "Steelhead", "Carp", "Perch", "Other"];

  const fetchWeatherForDate = async () => {
    if (!startDate || !selectedState) return;
    const coords = STATE_COORDS[selectedState];
    if (!coords) return;
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords[0]}&longitude=${coords[1]}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,winddirection_10m_dominant,sunrise,sunset&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&start_date=${startDate}&end_date=${startDate}`);
      const data = await res.json();
      if (data.daily) {
        const dirs = ["N","NE","E","SE","S","SW","W","NW"];
        const windDir = dirs[Math.round((data.daily.winddirection_10m_dominant?.[0] || 0) / 45) % 8];
        const sunrise = data.daily.sunrise?.[0] ? new Date(data.daily.sunrise[0]).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : null;
        const sunset = data.daily.sunset?.[0] ? new Date(data.daily.sunset[0]).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : null;
        setWeather({ high: Math.round(data.daily.temperature_2m_max?.[0]), low: Math.round(data.daily.temperature_2m_min?.[0]), wind: Math.round(data.daily.windspeed_10m_max?.[0]), windDir, precip: data.daily.precipitation_sum?.[0], sunrise, sunset });
      }
    } catch {}
  };

  useEffect(() => { if (startDate) fetchWeatherForDate(); }, [startDate, selectedState]);

  const parseSections = (text) => {
    const sections = [];
    const cleaned = text.replace(/^#+ /gm, "").replace(/^# .+$/gm, "");
    const parts = cleaned.split(/^## /m).filter(Boolean);
    parts.forEach(part => {
      const lines = part.trim().split("\n");
      const title = lines[0].trim().replace(/^#+\s*/, "");
      const content = lines.slice(1).join("\n").trim();
      if (title && content) sections.push({ title, content });
    });
    return sections;
  };

  const extractLocations = (text) => {
    const locations = [];
    const locSection = text.match(/## Best Locations\n([\s\S]*?)(?=\n## |$)/);
    if (!locSection) return locations;
    const content = locSection[1];
    const blocks = content.split(/\n(?=###|\*\*[A-Z])/);
    blocks.forEach(block => {
      const nameMatch = block.match(/###\s*(.+)|^\*\*(.+?)\*\*/m);
      if (nameMatch) {
        const name = (nameMatch[1] || nameMatch[2]).trim();
        locations.push({ name, notes: block.replace(/###.+\n?|\*\*.+?\*\*\n?/, "").trim().slice(0, 120) });
      }
    });
    return locations.slice(0, 3);
  };

  const generate = async () => {
    if (hitLimit) return;
    setLoading(true); setError(null); setPlan(null); setParsedSections([]); setCheckedGear({}); setCollapsedSections({}); setSavedPins({});
    const newCount = messageCount + 1;
    setMessageCount(newCount);
    localStorage.setItem("wildai_message_count", newCount);
    if (user) supabase.from("message_counts").upsert({ user_id: user.id, count: newCount, updated_at: new Date().toISOString() });

    try {
      const prompt = `Create a detailed ${duration}-day ${activityType} trip plan in ${selectedState || "the US"} targeting ${targetSpecies || "mixed species"} for a group of ${groupSize} with ${experience} experience${startDate ? `, starting ${new Date(startDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}` : ""}.${notes ? ` Additional notes: ${notes}` : ""}

Respond with EXACTLY these sections in order:

## Trip Overview
2-3 sentence summary of this specific trip.

## Best Locations
List 3 specific public land locations. For each use ### Location Name format, then bullet points with details about that spot.

## Daily Schedule
Detailed day-by-day breakdown. Use ### Day 1: Title format for each day. Include specific times and tactics.

## Gear List
List every item on its own line starting with a dash (-). Be very specific. No bold formatting on gear items.

## Tactics & Tips
Specific tactics for ${targetSpecies || "this species"} in ${selectedState || "this region"}. Use bullet points starting with -.

## What to Expect
Realistic expectations. Use bullet points starting with -.

Use **bold** only for key terms within sentences. Do not use # headers at the start. Be specific and practical.`;

      const res = await fetch("https://wildai-server.onrender.com/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }], system: "You are an expert hunting and fishing guide with deep knowledge of tactics, gear, and public lands across all US states. Be specific, practical, and location-accurate. Never provide specific regulation details — always direct users to their state wildlife agency." })
      });
      const d = await res.json();
      setPlan(d.reply);
      setParsedSections(parseSections(d.reply));
      setStep(3);
      setTimeout(() => planRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    } catch { setError("Couldn't generate trip plan. Try again."); }
    setLoading(false);
  };

  const saveLocationToMap = async (loc) => {
    if (!user) return;
    const coords = STATE_COORDS[selectedState];
    if (!coords) return;
    const jitter = (Math.random() - 0.5) * 0.3;
    const { data } = await supabase.from("saved_pins").insert({
      user_id: user.id,
      name: loc.name,
      spot_type: activityType === "hunting" ? "Stand" : "Fishing Hole",
      notes: loc.notes,
      lat: coords[0] + jitter,
      lng: coords[1] + jitter,
      state: selectedState || "",
      location: `${selectedState} — AI suggested`,
    }).select().single();
    if (data) {
      setSavedPins(prev => ({ ...prev, [loc.name]: true }));
      window._addPinToMap?.(data);
    }
  };

  const copyPlan = () => {
    const text = parsedSections.map(s => `${s.title}\n${"─".repeat(s.title.length)}\n${s.content.replace(/\*\*(.*?)\*\*/g, "$1")}`).join("\n\n");
    navigator.clipboard.writeText(`Ravlin Trip Plan — ${duration}-Day ${activityType} in ${selectedState}\n\n${text}`);
  };

  const toggleSection = (i) => setCollapsedSections(prev => ({ ...prev, [i]: !prev[i] }));

  const SECTION_ICONS = {
    "Trip Overview": <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
    "Best Locations": <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    "Daily Schedule": <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    "Gear List": <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    "Tactics & Tips": <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    "What to Expect": <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  };

  if (!isPro) return (
    <div className="card" style={{ padding: 40, textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(139,195,74,0.1)", border: "1px solid var(--border-accent)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
      </div>
      <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 18, marginBottom: 8, fontFamily: "var(--font-display)" }}>Trip Planner</div>
      <div style={{ color: "var(--text2)", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>Personalized trip plans with gear checklists, daily schedules, suggested locations you can save to your map, and live weather forecasts.</div>
      {!isGuest && <button onClick={onUpgrade} className="btn-gold" style={{ padding: "12px 28px", fontSize: 14, borderRadius: "var(--radius-sm)" }}>Upgrade to Pro</button>}
      {isGuest && <button onClick={onUpgrade} className="btn-primary" style={{ padding: "12px 28px", fontSize: 14, borderRadius: "var(--radius-sm)" }}>Sign Up to Unlock</button>}
    </div>
  );

  const cardStyle = { background: "linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid var(--border)", borderTopColor: "rgba(255,255,255,0.12)", borderRadius: "var(--radius)", overflow: "hidden" };

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Step indicator */}
      {step < 3 && (
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 0, padding: "4px 20px" }}>
          {["Activity & Species", "Trip Details"].map((label, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: i === 0 ? "none" : "none" }}>
              <div onClick={() => i < step - 1 && setStep(i + 1)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, cursor: i < step - 1 ? "pointer" : "default" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: step > i + 1 ? "var(--green)" : step === i + 1 ? "var(--green)" : "rgba(255,255,255,0.06)", border: `2px solid ${step >= i + 1 ? "var(--green)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
                  {step > i + 1 ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#050a02" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> : <span style={{ fontSize: 11, fontWeight: 700, color: step === i + 1 ? "#050a02" : "var(--text3)" }}>{i + 1}</span>}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: step >= i + 1 ? "var(--text)" : "var(--text3)", transition: "color 0.2s", whiteSpace: "nowrap" }}>{label}</span>
              </div>
              {i < 1 && (
                <div style={{ display: "flex", alignItems: "center", margin: "0 8px 0 -4px", marginBottom: 18, flexShrink: 0 }}>
                  <svg width="60" height="12" viewBox="0 0 60 12" fill="none" style={{ flexShrink: 0 }}>
                    <line x1="0" y1="6" x2="50" y2="6" stroke={step > 1 ? "var(--green)" : "var(--border)"} strokeWidth="2" style={{ transition: "stroke 0.3s" }} />
                    <polygon points="49,1 59,6 49,11" fill={step > 1 ? "var(--green)" : "var(--border)"} style={{ transition: "fill 0.3s" }} />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Step 1 — Activity & Species */}
      {step === 1 && (
        <div style={{ ...cardStyle, padding: "22px 20px 24px" }}>
          <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>What are you going after?</div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ color: "var(--text3)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Activity</div>
            <div style={{ display: "flex", gap: 8, background: "rgba(0,0,0,0.25)", borderRadius: "var(--radius-sm)", padding: 4 }}>
              {[
                { id: "hunting", label: "Hunting", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg> },
                { id: "fishing", label: "Fishing", icon: <Fish size={15} /> },
              ].map(a => (
                <button key={a.id} onClick={() => { setActivityType(a.id); setTargetSpecies(""); }} style={{ flex: 1, padding: "11px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.15s", background: activityType === a.id ? "linear-gradient(135deg, var(--green-light), var(--green2))" : "transparent", color: activityType === a.id ? "#050a02" : "var(--text3)", boxShadow: activityType === a.id ? "0 2px 12px rgba(139,195,74,0.35)" : "none" }}>
                  {a.icon}{a.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ color: "var(--text3)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Target Species</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "center" }}>
              {(activityType === "hunting" ? HUNTING_SPECIES : FISHING_SPECIES).map(s => (
                <button key={s} onClick={() => setTargetSpecies(s)} style={{ padding: "7px 13px", borderRadius: 20, fontSize: 12, fontWeight: 600, border: `1px solid ${targetSpecies === s ? "var(--green)" : "var(--border)"}`, background: targetSpecies === s ? "rgba(139,195,74,0.15)" : "rgba(255,255,255,0.04)", color: targetSpecies === s ? "var(--green)" : "var(--text3)", cursor: "pointer", transition: "all 0.15s", fontFamily: "var(--font-body)" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ color: "var(--text3)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Experience Level</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["beginner", "intermediate", "expert"].map(e => (
                <button key={e} onClick={() => setExperience(e)} style={{ flex: 1, padding: "9px", borderRadius: 10, fontSize: 12, fontWeight: 600, border: `1px solid ${experience === e ? "var(--green)" : "var(--border)"}`, background: experience === e ? "rgba(139,195,74,0.12)" : "rgba(255,255,255,0.03)", color: experience === e ? "var(--green)" : "var(--text3)", cursor: "pointer", transition: "all 0.15s", fontFamily: "var(--font-body)", textTransform: "capitalize" }}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => setStep(2)} disabled={!targetSpecies} className="btn-primary" style={{ width: "100%", padding: "13px", fontSize: 14, opacity: !targetSpecies ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            Continue
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        </div>
      )}

      {/* Step 2 — Trip Details */}
      {step === 2 && (
        <div style={{ ...cardStyle, padding: "22px 20px 24px" }}>
          <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "var(--text3)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)", marginBottom: 16, display: "flex", alignItems: "center", gap: 6, padding: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Back
          </button>
          <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Trip Details</div>
          <div style={{ color: "var(--text3)", fontSize: 13, marginBottom: 20 }}>{activityType.charAt(0).toUpperCase() + activityType.slice(1)} · {targetSpecies} · {experience}</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ color: "var(--text3)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Duration</div>
              <select value={duration} onChange={e => setDuration(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "var(--radius-sm)", fontSize: 13 }}>
                {["1","2","3","4","5","6","7"].map(d => <option key={d} value={d}>{d} day{d !== "1" ? "s" : ""}</option>)}
              </select>
            </div>
            <div>
              <div style={{ color: "var(--text3)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Group Size</div>
              <select value={groupSize} onChange={e => setGroupSize(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "var(--radius-sm)", fontSize: 13 }}>
                {["1","2","3","4","5","6","7","8"].map(n => <option key={n} value={n}>{n} {n === "1" ? "person" : "people"}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ color: "var(--text3)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Start Date <span style={{ color: "var(--text3)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional — pulls forecast)</span></div>
              <DatePickerInput value={startDate} onChange={setStartDate} minDate={new Date()} maxDate={new Date(Date.now() + 365*24*60*60*1000)} placeholder="Select start date..." />
            </div>
          </div>

          {/* Weather preview if date set */}
          {weather && startDate && (
            <div style={{ background: "rgba(139,195,74,0.06)", border: "1px solid rgba(139,195,74,0.2)", borderRadius: "var(--radius-sm)", padding: "12px 14px", marginBottom: 14, display: "flex", flexWrap: "wrap", gap: 10 }}>
              <div style={{ color: "var(--text3)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", width: "100%", marginBottom: 4 }}>Forecast for {new Date(startDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
              {[
                { label: `${weather.high}°/${weather.low}°F`, icon: "🌡️" },
                { label: `${weather.windDir} ${weather.wind} mph`, icon: "💨" },
                { label: weather.precip > 0 ? `${weather.precip}" precip` : "No precip", icon: "🌧️" },
                { label: weather.sunrise || "—", icon: "🌅" },
                { label: weather.sunset || "—", icon: "🌇" },
              ].map((w, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text2)" }}>
                  <span>{w.icon}</span><span>{w.label}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <div style={{ color: "var(--text3)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Any specific notes? <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></div>
            <textarea placeholder="e.g. First time hunting elk, have a truck, prefer public land only, want to camp..." value={notes} onChange={e => setNotes(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "var(--radius-sm)", fontSize: 13, minHeight: 64, resize: "vertical", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "var(--font-body)", boxSizing: "border-box" }} />
          </div>

          {!selectedState && <div style={{ color: "var(--amber)", fontSize: 12, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={13} />Select your state for accurate location suggestions</div>}

          {hitLimit ? (
            <div style={{ background: "rgba(139,195,74,0.06)", border: "1px solid var(--border-accent)", borderRadius: "var(--radius-sm)", padding: "16px 20px", textAlign: "center" }}>
              <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Upgrade to Ravlin Pro</div>
              <div style={{ color: "var(--text2)", fontSize: 13, marginBottom: 14 }}>Upgrade for unlimited trip plans.</div>
              <button className="btn-primary" style={{ padding: "11px 24px", fontSize: 14 }} onClick={onUpgrade}>Upgrade to Pro</button>
            </div>
          ) : (
            <button onClick={generate} disabled={loading} className="btn-primary" style={{ width: "100%", padding: "13px", fontSize: 14, opacity: loading ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              {loading ? "Generating your plan..." : `Generate ${targetSpecies} Trip Plan`}
            </button>
          )}
          {error && <div style={{ color: "var(--amber)", fontSize: 13, marginTop: 10 }}>{error}</div>}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 48, textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid rgba(139,195,74,0.15)", borderTopColor: "var(--green)", borderRadius: "50%", margin: "0 auto 20px", animation: "spin 0.8s linear infinite" }} />
          <div style={{ color: "var(--text2)", fontSize: 14, fontWeight: 600 }}>Building your {targetSpecies} trip plan...</div>
          <div style={{ color: "var(--text3)", fontSize: 12, marginTop: 6 }}>Finding locations, gear, and tactics</div>
        </div>
      )}

      {/* Step 3 — Results */}
      {parsedSections.length > 0 && !loading && (
        <div ref={planRef} style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 0" }}>
            <div>
              <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 15 }}>{duration}-Day {targetSpecies} {activityType.charAt(0).toUpperCase() + activityType.slice(1)}</div>
              <div style={{ color: "var(--text3)", fontSize: 12, marginTop: 2 }}>{selectedState} · Group of {groupSize} · {experience}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={copyPlan} className="btn-ghost" style={{ padding: "7px 13px", fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy
              </button>
              <button onClick={() => { setPlan(null); setParsedSections([]); setStep(1); setTargetSpecies(""); }} className="btn-ghost" style={{ padding: "7px 13px", fontSize: 12 }}>
                New Plan
              </button>
            </div>
          </div>

          {/* Weather strip if available */}
          {weather && startDate && (
            <div style={{ background: "rgba(139,195,74,0.06)", border: "1px solid rgba(139,195,74,0.18)", borderRadius: "var(--radius-sm)", padding: "10px 14px", display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ color: "var(--green)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Forecast {new Date(startDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
              {[`${weather.high}°/${weather.low}°F`, `💨 ${weather.windDir} ${weather.wind}mph`, `🌅 ${weather.sunrise}`, `🌇 ${weather.sunset}`].map((w, i) => (
                <span key={i} style={{ fontSize: 12, color: "var(--text2)" }}>{w}</span>
              ))}
            </div>
          )}

          {/* Sections */}
          {parsedSections.map((section, i) => {
            const isGear = section.title === "Gear List";
            const isLocations = section.title === "Best Locations";
            const collapsed = collapsedSections[i];
            const gearItems = isGear ? section.content.split("\n").filter(l => l.trim().startsWith("-")).map(l => l.replace(/^-\s*/, "").replace(/\*\*(.*?)\*\*/g, "$1").trim()).filter(Boolean) : [];
            const checkedCount = gearItems.filter((_, idx) => checkedGear[`${i}-${idx}`]).length;
            const locations = isLocations ? extractLocations(plan) : [];

            return (
              <div key={i} style={{ ...cardStyle }}>
                {/* Section header — tappable to collapse */}
                <div onClick={() => toggleSection(i)} style={{ padding: "13px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, color: "var(--green)" }}>
                    {SECTION_ICONS[section.title] || null}
                    <span style={{ color: "var(--text)", fontWeight: 700, fontSize: 13 }}>{section.title}</span>
                    {isGear && <span style={{ color: "var(--text3)", fontSize: 11, fontWeight: 500 }}>{checkedCount}/{gearItems.length}</span>}
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9"/></svg>
                </div>

                {!collapsed && (
                  <div style={{ borderTop: "1px solid var(--border)", padding: "14px 16px" }}>
                    {isGear ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {gearItems.map((item, idx) => (
                          <div key={idx} onClick={() => setCheckedGear(prev => ({ ...prev, [`${i}-${idx}`]: !prev[`${i}-${idx}`] }))} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, background: checkedGear[`${i}-${idx}`] ? "rgba(139,195,74,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${checkedGear[`${i}-${idx}`] ? "rgba(139,195,74,0.25)" : "var(--border)"}`, cursor: "pointer", transition: "all 0.12s" }}>
                            <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${checkedGear[`${i}-${idx}`] ? "var(--green)" : "var(--border)"}`, background: checkedGear[`${i}-${idx}`] ? "var(--green)" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.12s" }}>
                              {checkedGear[`${i}-${idx}`] && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#050a02" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                            </div>
                            <span style={{ fontSize: 13, color: checkedGear[`${i}-${idx}`] ? "var(--text3)" : "var(--text2)", textDecoration: checkedGear[`${i}-${idx}`] ? "line-through" : "none", flex: 1 }}>{item}</span>
                          </div>
                        ))}
                        {checkedCount === gearItems.length && gearItems.length > 0 && (
                          <div style={{ textAlign: "center", padding: 10, color: "var(--green)", fontSize: 13, fontWeight: 700 }}>All packed — you're ready to go!</div>
                        )}
                      </div>
                    ) : isLocations && locations.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {locations.map((loc, li) => (
                          <div key={li} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "12px 14px" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: loc.notes ? 6 : 0 }}>
                              <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 13 }}>{loc.name}</div>
                              <button onClick={() => saveLocationToMap(loc)} disabled={savedPins[loc.name]} style={{ flexShrink: 0, padding: "5px 11px", borderRadius: 8, border: `1px solid ${savedPins[loc.name] ? "rgba(139,195,74,0.3)" : "var(--border)"}`, background: savedPins[loc.name] ? "rgba(139,195,74,0.1)" : "rgba(255,255,255,0.04)", color: savedPins[loc.name] ? "var(--green)" : "var(--text3)", fontSize: 11, fontWeight: 600, cursor: savedPins[loc.name] ? "default" : "pointer", fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s" }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                {savedPins[loc.name] ? "Saved" : "Save to Map"}
                              </button>
                            </div>
                            {loc.notes && <div style={{ color: "var(--text3)", fontSize: 12, lineHeight: 1.5 }}>{loc.notes}</div>}
                          </div>
                        ))}
                        <div style={{ color: "var(--text3)", fontSize: 12, marginTop: 4, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: section.content.replace(/^### .+$/gm, "").replace(/\*\*(.*?)\*\*/g, "<strong style='color:var(--text)'>$1</strong>").replace(/^- (.*?)$/gm, "<div style='display:flex;gap:8px;margin:3px 0'><span style='color:var(--green);flex-shrink:0;margin-top:1px'>—</span><span>$1</span></div>").replace(/\n\n/g, "<br/>").replace(/\n/g, "") }} />
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, lineHeight: 1.75, color: "var(--text2)" }} dangerouslySetInnerHTML={{
                        __html: section.content
                          .replace(/^### (.*?)$/gm, "<div style='color:var(--text);font-weight:700;font-size:13px;margin:14px 0 6px;padding-top:4px;border-top:1px solid var(--border)'>$1</div>")
                          .replace(/\*\*(.*?)\*\*/g, "<strong style='color:var(--text)'>$1</strong>")
                          .replace(/^- (.*?)$/gm, "<div style='display:flex;gap:8px;margin:5px 0'><span style='color:var(--green);flex-shrink:0;margin-top:2px'>—</span><span>$1</span></div>")
                          .replace(/\n\n/g, "<br/>")
                          .replace(/\n/g, "")
                      }} />
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ textAlign: "center", padding: "8px 4px" }}>
            <div style={{ color: "var(--text3)", fontSize: 11 }}>Always verify regulations with your state wildlife agency</div>
          </div>
        </div>
      )}
    </div>
  );
}
