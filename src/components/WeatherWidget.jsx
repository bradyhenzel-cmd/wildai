import React, { useState } from "react";
import { Cloud } from "lucide-react";
import { Icon } from "@iconify/react";

export default function WeatherWidget({ selectedState, weather, setWeather, locationName, setLocationName }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState(null);

  const searchLocations = async (val) => {
    if (val.length < 2) { setSuggestions([]); return; }
    try {
      const token = import.meta.env.VITE_MAPBOX_TOKEN;
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(val)}.json?access_token=${token}&country=us&types=place,locality,district&limit=8&language=en`);
      const data = await res.json();
      const unique = (data.features || []).map(f => ({
        display_name: f.place_name,
        lat: f.center[1],
        lon: f.center[0],
      }));
      setSuggestions(unique);
      setShowDropdown(true);
    } catch { setSuggestions([]); }
  };

  const loadWeather = async (lat, lon, name) => {
    setLoading(true); setError(null); setShowDropdown(false); setLocationName(name);
    try {
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,precipitation&wind_speed_unit=mph&temperature_unit=fahrenheit&timezone=auto`);
      const d = await r.json();
      if (d.current) setWeather({ ...d.current, lat, lng: lon, timezone: d.timezone });
    } catch { setError("Unable to load weather."); }
    setLoading(false);
  };

  const wxIconName = (c) => {
    c = parseInt(c);
    const h = new Date().getHours();
    const n = h >= 20 || h < 6;
    if (isNaN(c)) return n ? "meteocons:partly-cloudy-night-fill" : "meteocons:partly-cloudy-day-fill";
    if (c === 0) return n ? "meteocons:clear-night-fill" : "meteocons:clear-day-fill";
    if (c === 1) return n ? "meteocons:clear-night-fill" : "meteocons:clear-day-fill";
    if (c === 2) return n ? "meteocons:partly-cloudy-night-fill" : "meteocons:partly-cloudy-day-fill";
    if (c === 3) return "meteocons:cloudy-fill";
    if (c === 45 || c === 48) return n ? "meteocons:fog-night-fill" : "meteocons:fog-day-fill";
    if (c === 51 || c === 53 || c === 55) return "meteocons:drizzle-fill";
    if (c === 56 || c === 57) return n ? "meteocons:partly-cloudy-night-drizzle-fill" : "meteocons:partly-cloudy-day-drizzle-fill";
    if (c === 61 || c === 63 || c === 65) return "meteocons:rain-fill";
    if (c === 66 || c === 67) return n ? "meteocons:partly-cloudy-night-sleet-fill" : "meteocons:partly-cloudy-day-sleet-fill";
    if (c === 71 || c === 73 || c === 75) return "meteocons:snow-fill";
    if (c === 77) return "meteocons:hail-fill";
    if (c === 80 || c === 81 || c === 82) return n ? "meteocons:partly-cloudy-night-rain-fill" : "meteocons:partly-cloudy-day-rain-fill";
    if (c === 85 || c === 86) return n ? "meteocons:partly-cloudy-night-snow-fill" : "meteocons:partly-cloudy-day-snow-fill";
    if (c === 95) return n ? "meteocons:thunderstorms-night-fill" : "meteocons:thunderstorms-day-fill";
    if (c === 96 || c === 99) return n ? "meteocons:thunderstorms-night-rain-fill" : "meteocons:thunderstorms-day-rain-fill";
    return n ? "meteocons:partly-cloudy-night-fill" : "meteocons:partly-cloudy-day-fill";
  };
  const cond = (w) => {
    if (!w) return null;
    if (w.precipitation > 0.1) return { label: "Rain/Snow — Great for tracking!", color: "var(--green)" };
    if (w.wind_speed_10m < 10 && w.temperature_2m < 50 && w.temperature_2m > 20) return { label: "Excellent hunting conditions", color: "var(--green)" };
    if (w.wind_speed_10m > 20) return { label: "High wind — animals bedded down", color: "var(--amber)" };
    if (w.temperature_2m > 70) return { label: "Warm — animals moving at night", color: "var(--amber)" };
    return { label: "Fair conditions", color: "var(--text2)" };
  };

  const c2 = weather ? cond(weather) : null;

  const localTime = weather?.timezone ? new Date().toLocaleTimeString("en-US", { timeZone: weather.timezone, hour: "numeric", minute: "2-digit", hour12: true }) : null;

  return (
    <div className="card fade-in" style={{ padding: 24 }}>
      <div style={{ color: "var(--text3)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 12 }}>LIVE WEATHER</div>

      <div style={{ position: "relative", marginBottom: 20 }}>
        <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#4a6a4a", pointerEvents: "none" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        <input
          value={query}
          onChange={e => { const v = e.target.value; setQuery(v); clearTimeout(window._wt); window._wt = setTimeout(() => searchLocations(v), 300); }}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder="Search a location..."
          style={{ width: "100%", padding: "12px 16px 12px 34px", borderRadius: "var(--radius-sm)", fontSize: 14 }}
        />
        {showDropdown && suggestions.length > 0 && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#0d1a0d", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", zIndex: 100, maxHeight: 220, overflowY: "auto", marginTop: 4 }}>
            {suggestions.map((s, i) => (
              <div key={i} onClick={() => { const name = s.display_name.split(",").slice(0, 2).join(",").trim(); setQuery(name); loadWeather(s.lat, s.lon, name); }}
                style={{ padding: "10px 14px", cursor: "pointer", fontSize: 13, color: "var(--text2)", borderBottom: "1px solid var(--border)" }}
                onMouseEnter={e => e.target.style.background = "var(--card-hover)"}
                onMouseLeave={e => e.target.style.background = "transparent"}
              >
                {s.display_name.split(",").slice(0, 2).join(",").trim()}
              </div>
            ))}
          </div>
        )}
      </div>

      {loading && <div style={{ textAlign: "center", padding: 30, color: "var(--text3)", fontSize: 13 }} className="pulse">Loading weather...</div>}
      {error && <div style={{ color: "var(--amber)", fontSize: 13, padding: 16, textAlign: "center" }}>{error}</div>}
      {!weather && !loading && !error && (
        <div style={{ textAlign: "center", padding: 32, color: "var(--text3)", fontSize: 14 }}>
          <div style={{ marginBottom: 12, display:"flex", justifyContent:"center" }}><Cloud size={40} color="rgba(255,255,255,0.15)" /></div>
          Search any hunting or fishing location to get live conditions
        </div>
      )}
      {weather && !loading && (
        <>
          {/* Main weather card */}
          <div style={{ background: "linear-gradient(160deg, #0c1c0c 0%, #071007 100%)", border: "1px solid rgba(139,195,74,0.15)", borderTop: "1px solid rgba(139,195,74,0.25)", borderRadius: 16, padding: "16px 18px", marginBottom: 10, boxShadow: "0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(139,195,74,0.6)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span style={{ color: "rgba(139,195,74,0.7)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{locationName || "Current Location"}</span>
              </div>
              {localTime && <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 500 }}>Local {localTime}</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <Icon icon={wxIconName(weather.weather_code)} style={{ width: 64, height: 64, display: "block", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                  <span style={{ color: "#ffffff", fontSize: 42, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.02em", textShadow: "0 0 20px rgba(255,255,255,0.15)" }}>{Math.round(weather.temperature_2m)}°</span>
                  <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 22, fontWeight: 300 }}>F</span>
                </div>
                {c2 && <div style={{ color: c2.color, fontSize: 12, fontWeight: 600 }}>{c2.label}</div>}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 14 }}>
              {[
                { icon: "meteocons:humidity-fill", val: `${weather.relative_humidity_2m}%`, lbl: "Humidity" },
                { icon: "meteocons:wind-fill", val: `${Math.round(weather.wind_speed_10m)} mph`, lbl: "Wind" },
                { icon: "meteocons:rain-fill", val: `${weather.precipitation}"`, lbl: "Precip" },
              ].map(({ icon, val, lbl }, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "10px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <Icon icon={icon} style={{ width: 24, height: 24 }} />
                  <span style={{ color: "#ffffff", fontWeight: 700, fontSize: 13 }}>{val}</span>
                  <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 500 }}>{lbl}</span>
                </div>
              ))}
            </div>
          </div>


          {/* Solunar Card */}
          {(() => {
            const now = new Date();
            const rad = Math.PI / 180, deg = 180 / Math.PI;

            // Moon phase
            const synodicMonth = 29.53058867;
            const known = new Date(2000, 0, 6, 18, 14, 0);
            const diff = (now - known) / (1000 * 60 * 60 * 24);
            const phase = ((diff % synodicMonth) + synodicMonth) % synodicMonth;

            // Meeus algorithm for accurate moon transit time
            const JD = (now.getTime() / 86400000) + 2440587.5;
            const T = (JD - 2451545.0) / 36525;
            const L0 = (218.3164477 + 481267.88123421 * T) % 360;
            const M = (357.5291092 + 35999.0502909 * T) % 360;
            const Mprime = (134.9633964 + 477198.8675055 * T) % 360;
            const D = (297.8501921 + 445267.1114034 * T) % 360;
            const F = (93.2720950 + 483202.0175233 * T) % 360;
            const sinTerms = [[6288774, 0, 1, 0, 0], [1274027, 2, -1, 0, 0], [658314, 2, 0, 0, 0], [213618, 0, 2, 0, 0], [-185116, 1, 0, 0, 0], [-114332, 0, 0, 0, 2], [58793, 2, -2, 0, 0], [57066, 2, -1, 1, 0], [53322, 2, 0, 1, 0]];
            let sigmaL = 0;
            for (const [coef, d, mp, m, f] of sinTerms) sigmaL += coef * Math.sin(rad * (d * D + mp * Mprime + m * M + f * F));
            const moonLng = (L0 + sigmaL / 1000000) % 360;
            const moonLat = 5.128 * Math.sin(rad * F);
            const obliquity = 23.439291 - 0.013004 * T;
            const sinRA = Math.sin(rad * moonLng) * Math.cos(rad * obliquity) - Math.tan(rad * moonLat) * Math.sin(rad * obliquity);
            let RA = deg * Math.atan2(sinRA, Math.cos(rad * moonLng));
            if (RA < 0) RA += 360;
            const GST = (280.46061837 + 360.98564736629 * (JD - 2451545.0)) % 360;
            // Use weather location lng if available, otherwise default to -98 (center US)
            const userLng = typeof weather?.lng === 'number' ? weather.lng : -98;
            const LST = ((GST + userLng) % 360 + 360) % 360;
            let HA = LST - RA;
            if (HA > 180) HA -= 360;
            if (HA < -180) HA += 360;
            const currentUTCHour = now.getUTCHours() + now.getUTCMinutes() / 60;
            let transitUTC = currentUTCHour - HA / 15;
            transitUTC = ((transitUTC % 24) + 24) % 24;
            const tzOffset = Math.round(userLng / 15);
            const major1 = (transitUTC + tzOffset + 24) % 24;
            const major2 = (major1 + 12) % 24;
            const minor1 = (major1 + 6) % 24;
            const minor2 = (major1 + 18) % 24;

            // Rating based on moon phase
            const distFromNew = Math.min(phase, synodicMonth - phase) / (synodicMonth / 2);
            const distFromFull = Math.abs(phase - synodicMonth / 2) / (synodicMonth / 2);
            const rating = Math.max(0, 1 - Math.min(distFromNew, distFromFull) * 2);
            const ratingLabel = rating > 0.75 ? "Excellent" : rating > 0.5 ? "Good" : rating > 0.25 ? "Fair" : "Poor";
            const ratingColor = rating > 0.75 ? "#4ade80" : rating > 0.5 ? "#a3e635" : rating > 0.25 ? "#fbbf24" : "#f87171";
            const bars = Math.round(rating * 4);

            const hour = now.getHours() + now.getMinutes() / 60;
            const fmt = (h) => { if (isNaN(h) || !isFinite(h)) return "--:--"; const hh = Math.floor(h), mm = Math.round((h - hh) * 60), ap = hh >= 12 ? "PM" : "AM"; return `${hh % 12 || 12}:${mm.toString().padStart(2, '0')} ${ap}`; };
            const isActive = (h) => { const diff = Math.abs(hour - h); return diff <= 1 || diff >= 23; };
            const moonIcon = phase < 1.85 ? "🌑" : phase < 5.53 ? "🌒" : phase < 9.22 ? "🌓" : phase < 12.91 ? "🌔" : phase < 16.61 ? "🌕" : phase < 20.30 ? "🌖" : phase < 23.99 ? "🌗" : "🌘";

            return (
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "11px 13px", marginTop: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div>
                    <div style={{ color: "var(--text3)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4 }}>SOLUNAR FORECAST</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{moonIcon}</span>
                      <span style={{ color: ratingColor, fontWeight: 700, fontSize: 15, fontFamily: "var(--font-display)" }}>{ratingLabel}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{ width: 6, height: 20, borderRadius: 3, background: i <= bars ? ratingColor : "rgba(255,255,255,0.08)", transition: "all 0.3s" }} />
                    ))}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { label: "Major", time: fmt(major1), active: isActive(major1) },
                    { label: "Major", time: fmt(major2), active: isActive(major2) },
                    { label: "Minor", time: fmt(minor1), active: isActive(minor1) },
                    { label: "Minor", time: fmt(minor2), active: isActive(minor2) },
                  ].map((p, i) => (
                    <div key={i} style={{ padding: "6px 9px", borderRadius: 8, background: p.active ? "rgba(120,180,80,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${p.active ? "rgba(120,180,80,0.3)" : "rgba(255,255,255,0.06)"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ color: p.label === "Major" ? "var(--green)" : "var(--text3)", fontSize: 9, fontWeight: 700, letterSpacing: "0.06em" }}>{p.label.toUpperCase()}</div>
                        <div style={{ color: "var(--text)", fontWeight: 600, fontSize: 12 }}>{p.time}</div>
                      </div>
                      {p.active && <span style={{ fontSize: 9, fontWeight: 700, color: "var(--green)", background: "rgba(120,180,80,0.2)", padding: "2px 6px", borderRadius: 8 }}>NOW</span>}
                    </div>
                  ))}
                </div>
                <div style={{ color: "var(--text3)", fontSize: 10, marginTop: 8, textAlign: "center" }}>Peak activity windows for hunting & fishing</div>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
