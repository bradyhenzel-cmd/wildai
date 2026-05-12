import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { createPortal } from "react-dom";
import { supabase } from "../supabase";
import { MapPin, Trash2, Crosshair, Lock, Cloud, Thermometer, Wind, CloudRain, Sunrise, Sunset, Navigation } from "lucide-react";
import { FREE_PIN_LIMIT, STATE_COORDS } from "../constants";
import { toast } from "../utils";

function PinsPage({ pins, onBack, onSelectPin }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1010, background: "#070e07", display: "flex", flexDirection: "column", fontFamily: "var(--font-body)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", borderBottom: "1px solid var(--border)", background: "rgba(8,15,8,0.98)" }}>
        <button onClick={onBack} className="btn-ghost" style={{ padding: "6px 12px", fontSize: 13 }}>← Back</button>
        <span style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", gap: 7 }}><MapPin size={16} color="var(--green)" /> My Pins</span>
        <span style={{ color: "var(--text3)", fontSize: 12, marginLeft: 4 }}>({pins.length})</span>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {pins.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text3)", fontSize: 14 }}>
            <MapPin size={36} color="rgba(255,255,255,0.15)" style={{ marginBottom: 10 }} />
            No pins yet. Tap the map to drop one.
          </div>
        )}
        {pins.map(pin => (
          <button key={pin.id} onClick={() => onSelectPin(pin)} className="card" style={{ width: "100%", textAlign: "left", padding: "14px 16px", cursor: "pointer", background: "none", border: "1px solid var(--border)", borderRadius: "var(--radius)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--green)", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "var(--text)", fontWeight: 600, fontSize: 14, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pin.name || "Unnamed Spot"}</div>
              <div style={{ display: "flex", gap: 6 }}>
                {pin.spot_type && <div style={{ color: "var(--text3)", fontSize: 11 }}>{pin.spot_type}</div>}
                {pin.species && <div style={{ color: "var(--green)", fontSize: 11 }}>{pin.species}</div>}
                {!pin.spot_type && !pin.species && pin.location && <div style={{ color: "var(--text3)", fontSize: 11 }}>{pin.location}</div>}
              </div>
            </div>
            <span style={{ color: "var(--text3)", fontSize: 18 }}>›</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function PinDetailPage({ pin, onBack, onDelete, onSharePin, onSave }) {
  const [name, setName] = useState(pin.name || "");
  const [species, setSpecies] = useState(pin.species || "");
  const [notes, setNotes] = useState(pin.notes || "");
  const [spotType, setSpotType] = useState(pin.spot_type || "");
  const [bestWind, setBestWind] = useState(pin.best_wind || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeletePin, setConfirmDeletePin] = useState(false);
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("conditions");

  const handleSave = async () => {
    setSaving(true);
    const error = await onSave(pin.id, { name, species, notes, spot_type: spotType || null, best_wind: bestWind || null });
    setSaving(false);
    if (!error) onBack();
  };

  const handleDelete = async () => { setConfirmDeletePin(true); };
  const doDeletePin = async () => {
    setDeleting(true);
    setConfirmDeletePin(false);
    await onDelete(pin.id);
  };

  const fetchConditions = async () => {
    setWeatherLoading(true);
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${pin.lat}&longitude=${pin.lng}&current=temperature_2m,windspeed_10m,winddirection_10m,precipitation,cloudcover,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,windspeed_10m_max,winddirection_10m_dominant,sunrise,sunset,precipitation_sum&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=7`);
      const data = await res.json();
      const c = data.current;
      const dirs = ["N","NE","E","SE","S","SW","W","NW"];
      const windDir = dirs[Math.round(c.winddirection_10m / 45) % 8];
      const codes = { 0:"Clear", 1:"Mostly Clear", 2:"Partly Cloudy", 3:"Overcast", 45:"Foggy", 48:"Foggy", 51:"Light Drizzle", 61:"Light Rain", 63:"Rain", 65:"Heavy Rain", 71:"Light Snow", 73:"Snow", 75:"Heavy Snow", 80:"Showers", 95:"Thunderstorm", 99:"Thunderstorm" };
      const wxIcon = (code) => { if (code === 0 || code === 1) return "☀️"; if (code === 2) return "⛅"; if (code === 3) return "☁️"; if (code >= 51 && code <= 67) return "🌧️"; if (code >= 71 && code <= 77) return "❄️"; if (code >= 80 && code <= 82) return "🌦️"; if (code >= 95) return "⛈️"; return "🌤️"; };
      const sunrise = data.daily?.sunrise?.[0] ? new Date(data.daily.sunrise[0]).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : null;
      const sunset = data.daily?.sunset?.[0] ? new Date(data.daily.sunset[0]).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : null;
      setWeather({ temp: Math.round(c.temperature_2m), windSpeed: Math.round(c.windspeed_10m), windDir, precip: c.precipitation, cloudcover: c.cloudcover, condition: codes[c.weathercode] || "Unknown", sunrise, sunset });
      const days = (data.daily?.time || []).map((date, i) => ({
        date, label: i === 0 ? "Today" : i === 1 ? "Tmrw" : new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" }),
        high: Math.round(data.daily.temperature_2m_max[i]),
        low: Math.round(data.daily.temperature_2m_min[i]),
        wind: Math.round(data.daily.windspeed_10m_max[i]),
        windDir: dirs[Math.round((data.daily.winddirection_10m_dominant[i] || 0) / 45) % 8],
        precip: data.daily.precipitation_sum[i],
        icon: wxIcon(data.daily.weathercode[i]),
      }));
      setForecast(days);
    } catch (e) { setWeather({ error: true }); }
    setWeatherLoading(false);
  };

  useEffect(() => { fetchConditions(); }, []);

  const windMatch = weather && bestWind ? bestWind === weather.windDir : null;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${pin.lat},${pin.lng}`;

  const PIN_TYPE_STYLE = { "Stand": { color: "#78b450" }, "Blind": { color: "#c8922a" }, "Bedding": { color: "#d4930a" }, "Food Source": { color: "#e8a020" }, "Trail Cam": { color: "#a0a0a0" }, "Glassing": { color: "#7ab0e0" }, "Access Point": { color: "#888" }, "Fishing Hole": { color: "#4a9fd4" }, "Boat Ramp": { color: "#3a8fc4" }, "Other": { color: "#78b450" } };
  const pinStyle = PIN_TYPE_STYLE[spotType] || { color: "#78b450", emoji: "📍" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1020, background: "#070e07", display: "flex", flexDirection: "column", fontFamily: "var(--font-body)" }}>
      {confirmDeletePin && createPortal(
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setConfirmDeletePin(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#0d1a0d", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 28, maxWidth: 320, width: "100%", textAlign: "center" }}>
            <div style={{ marginBottom: 12, display: "flex", justifyContent: "center" }}><MapPin size={32} color="rgba(255,255,255,0.2)" /></div>
            <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, fontFamily: "var(--font-display)", marginBottom: 8 }}>Delete this spot?</div>
            <div style={{ color: "var(--text3)", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>This can't be undone.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmDeletePin(false)} className="btn-ghost" style={{ flex: 1, padding: "10px 0", fontSize: 14 }}>Cancel</button>
              <button onClick={doDeletePin} style={{ flex: 1, padding: "10px 0", fontSize: 14, background: "rgba(255,60,60,0.15)", border: "1px solid rgba(255,60,60,0.3)", borderRadius: "var(--radius-sm)", color: "rgba(255,100,100,0.9)", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>Delete</button>
            </div>
          </div>
        </div>, document.body
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", borderBottom: "1px solid var(--border)", background: "rgba(8,15,8,0.98)", flexShrink: 0 }}>
        <button onClick={onBack} className="btn-ghost" style={{ padding: "6px 12px", fontSize: 13 }}>← Back</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><MapPin size={14} color={pinStyle.color} /></div>
          <span style={{ color: "var(--text)", fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>{pin.name || "Spot"}</span>
        </div>
        <button onClick={handleDelete} disabled={deleting} style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,100,100,0.75)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)", padding: "6px 10px", flexShrink: 0 }}>
          {deleting ? "..." : <Trash2 size={16} />}
        </button>
      </div>

      {/* Tab toggle */}
      <div style={{ display: "flex", background: "rgba(0,0,0,0.3)", margin: "12px 18px 0", borderRadius: 12, padding: 3, flexShrink: 0 }}>
        {["conditions", "details"].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ flex: 1, padding: "8px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, transition: "all 0.15s", background: activeTab === t ? "var(--green)" : "transparent", color: activeTab === t ? "#050a02" : "var(--text3)", textTransform: "capitalize" }}>
            {t === "conditions" ? "Conditions" : "Details"}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* CONDITIONS TAB */}
        {activeTab === "conditions" && (
          <>
            {weatherLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[1,2,3].map(i => <div key={i} style={{ height: 56, borderRadius: 12, backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.04) 75%)", backgroundSize: "200% 100%", animation: `shimmer 1.4s ease-in-out ${i*0.1}s infinite` }} />)}
              </div>
            ) : weather?.error ? (
              <div style={{ textAlign: "center", padding: 32, color: "var(--text3)" }}>
                <div style={{ marginBottom: 12 }}><Cloud size={32} color="rgba(255,255,255,0.2)" /></div>
                Couldn't load conditions.
                <button onClick={fetchConditions} className="btn-ghost" style={{ display: "block", margin: "12px auto 0", padding: "8px 16px", fontSize: 13 }}>Try Again</button>
              </div>
            ) : weather && (
              <>
                {/* Wind match banner */}
                {windMatch !== null && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderRadius: 14, background: windMatch ? "rgba(120,180,80,0.12)" : "rgba(255,80,80,0.08)", border: `1px solid ${windMatch ? "rgba(120,180,80,0.3)" : "rgba(255,80,80,0.2)"}` }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: windMatch ? "var(--green)" : "rgba(255,80,80,0.9)", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: windMatch ? "var(--green)" : "rgba(255,100,100,0.9)" }}>{windMatch ? "Good wind for this spot" : "Bad wind today"}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{windMatch ? `${weather.windDir} wind is ideal here` : `${weather.windDir} wind — best is ${bestWind}`}</div>
                    </div>
                  </div>
                )}

                {/* Current conditions grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { icon: <Thermometer size={16} />, label: "Temp", value: `${weather.temp}°F` },
                    { icon: <Wind size={16} />, label: "Wind", value: `${weather.windSpeed} mph ${weather.windDir}` },
                    { icon: <Cloud size={16} />, label: "Cloud Cover", value: `${weather.cloudcover}%` },
                    { icon: <Sunrise size={16} />, label: "Sunrise", value: weather.sunrise || "—" },
                    { icon: <Sunset size={16} />, label: "Sunset", value: weather.sunset || "—" },
                    { icon: <CloudRain size={16} />, label: "Precip", value: weather.precip > 0 ? `${weather.precip}mm` : "None" },
                  ].map((s, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ color: "var(--green)", opacity: 0.8 }}>{s.icon}</div>
                      <div>
                        <div style={{ color: "var(--text3)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
                        <div style={{ color: "var(--text)", fontSize: 13, fontWeight: 600, marginTop: 1 }}>{s.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 7-day forecast strip */}
                {forecast.length > 0 && (
                  <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
                    <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", color: "var(--text3)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>7-Day Forecast</div>
                    <div style={{ display: "flex" }}>
                      {forecast.map((day, i) => {
                        const dayWindMatch = bestWind ? bestWind === day.windDir : null;
                        const label = i === 0 ? "Today" : new Date(day.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" });
                        return (
                          <div key={i} style={{ flex: 1, padding: "10px 4px", textAlign: "center", borderRight: i < forecast.length - 1 ? "1px solid var(--border)" : "none", background: i === 0 ? "rgba(139,195,74,0.06)" : "transparent" }}>
                            <div style={{ color: i === 0 ? "var(--green)" : "var(--text3)", fontSize: 9, fontWeight: 700, marginBottom: 4 }}>{label}</div>
                            <div style={{ fontSize: 20, marginBottom: 4 }}>{day.icon}</div>
                            <div style={{ color: "var(--text)", fontSize: 12, fontWeight: 700 }}>{day.high}°</div>
                            <div style={{ color: "var(--text3)", fontSize: 10 }}>{day.low}°</div>
                            <div style={{ color: "var(--text3)", fontSize: 9, marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
                              <Wind size={8} />{day.wind}
                            </div>
                            {dayWindMatch !== null && (
                              <div style={{ width: 6, height: 6, borderRadius: "50%", background: dayWindMatch ? "var(--green)" : "rgba(255,80,80,0.7)", margin: "4px auto 0" }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Coords + directions */}
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 12, padding: "10px 14px" }}>
                    <div style={{ color: "var(--text3)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Coordinates</div>
                    <div style={{ color: "var(--text2)", fontSize: 12, fontFamily: "monospace" }}>{pin.lat?.toFixed(4)}, {pin.lng?.toFixed(4)}</div>
                  </div>
                  <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ padding: "10px 16px", fontSize: 13, textDecoration: "none", color: "var(--text2)", borderRadius: 12, border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                    <Navigation size={13} />Directions
                  </a>
                </div>
              </>
            )}
          </>
        )}

        {/* DETAILS TAB */}
        {activeTab === "details" && (
          <>
            <div>
              <label style={{ color: "var(--text3)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Name</label>
              <input value={name} onChange={e => setName(e.target.value)} style={{ width: "100%", padding: "11px 14px", borderRadius: "var(--radius-sm)", fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: "var(--text3)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Spot Type</label>
                <select value={spotType} onChange={e => setSpotType(e.target.value)} style={{ width: "100%", padding: "11px 10px", borderRadius: "var(--radius-sm)", fontSize: 13 }}>
                  <option value="">None</option>
                  <option value="Stand">🌲 Stand</option>
                  <option value="Blind">🏕️ Blind</option>
                  <option value="Bedding">😴 Bedding</option>
                  <option value="Food Source">🌾 Food Source</option>
                  <option value="Trail Cam">📷 Trail Cam</option>
                  <option value="Glassing">🔭 Glassing</option>
                  <option value="Access Point">🚗 Access Point</option>
                  <option value="Fishing Hole">🎣 Fishing Hole</option>
                  <option value="Boat Ramp">⛵ Boat Ramp</option>
                  <option value="Other">📍 Other</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ color: "var(--text3)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Best Wind</label>
                <select value={bestWind} onChange={e => setBestWind(e.target.value)} style={{ width: "100%", padding: "11px 10px", borderRadius: "var(--radius-sm)", fontSize: 13 }}>
                  <option value="">None</option>
                  <option value="N">N</option>
                  <option value="NE">NE</option>
                  <option value="E">E</option>
                  <option value="SE">SE</option>
                  <option value="S">S</option>
                  <option value="SW">SW</option>
                  <option value="W">W</option>
                  <option value="NW">NW</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ color: "var(--text3)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Species / Target</label>
              <input value={species} onChange={e => setSpecies(e.target.value)} placeholder="e.g. Elk, Trout, Duck..." style={{ width: "100%", padding: "11px 14px", borderRadius: "var(--radius-sm)", fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ color: "var(--text3)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Conditions, access, scouting notes..." rows={4} style={{ width: "100%", padding: "11px 14px", borderRadius: "var(--radius-sm)", fontSize: 14, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--text)", outline: "none", resize: "vertical", fontFamily: "var(--font-body)", boxSizing: "border-box" }} />
            </div>
            <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ padding: "13px", fontSize: 14 }}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

  export default function MapTab({ selectedState, user, onSharePin, isPro, onPinAdded, weatherOverride, locationNameOverride }) {
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const markersRef = useRef([]);
  const selectedRef = useRef(null);
  const dropMarkerRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [mapStyle, setMapStyle] = useState("satellite");

  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    if (isFullscreen) document.body.classList.add('map-fullscreen');
    else document.body.classList.remove('map-fullscreen');
    return () => document.body.classList.remove('map-fullscreen');
  }, [isFullscreen]);
  const [pins, setPins] = useState([]);
  const [mapReady, setMapReady] = useState(false);
  const [dropForm, setDropForm] = useState(null);
  const [dropName, setDropName] = useState("");
  const [dropSpecies, setDropSpecies] = useState("");
  const [dropSpotType, setDropSpotType] = useState("");
  const [dropBestWind, setDropBestWind] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPinList, setShowPinList] = useState(false);
  const [groups, setGroups] = useState([]);
  const [pinFilter, setPinFilter] = useState("all");
  const [newGroupName, setNewGroupName] = useState("");
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [assigningPin, setAssigningPin] = useState(null);
  const [viewingPin, setViewingPin] = useState(null);
  const [showPinsPage, setShowPinsPage] = useState(false);
  const [showPrivacyPopup, setShowPrivacyPopup] = useState(false);
  const [quickConditions, setQuickConditions] = useState(null);
  const [quickConditionsLoading, setQuickConditionsLoading] = useState(false);
  const [showPinConditions, setShowPinConditions] = useState(false);
  const [quickLocationName, setQuickLocationName] = useState("");
  const [userCoords, setUserCoords] = useState(null);

  const getDistanceMi = (lat1, lng1, lat2, lng2) => {
    const R = 3958.8;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  useEffect(() => {
    if (weatherOverride && weatherOverride.lat && weatherOverride.lng) {
      const w = weatherOverride;
      const dirs = ["N","NE","E","SE","S","SW","W","NW"];
      const windDir = dirs[Math.round((w.winddirection_10m ?? 0) / 45) % 8];
      const codes = { 0:"Clear", 1:"Mostly Clear", 2:"Partly Cloudy", 3:"Overcast", 45:"Foggy", 51:"Light Drizzle", 61:"Light Rain", 63:"Rain", 71:"Light Snow", 73:"Snow", 80:"Showers", 95:"Thunderstorm" };
      const wxIcon = (code) => { if (code <= 1) return "☀️"; if (code === 2) return "⛅"; if (code === 3) return "☁️"; if (code >= 51 && code <= 67) return "🌧️"; if (code >= 71 && code <= 77) return "❄️"; if (code >= 80 && code <= 82) return "🌦️"; if (code >= 95) return "⛈️"; return "🌤️"; };
      setQuickConditions({ temp: Math.round(w.temperature_2m), windSpeed: Math.round(w.wind_speed_10m), windDir, condition: codes[w.weather_code] || "Clear", icon: wxIcon(w.weather_code), wxCode: w.weather_code });
      setQuickLocationName(locationNameOverride || "");
      setUserCoords({ lat: w.lat, lng: w.lng });
      return;
    }
    if (!navigator.geolocation) return;
    setQuickConditionsLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      setUserCoords({ lat, lng });
      try {
        const wxRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,windspeed_10m,winddirection_10m,weathercode&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`);
        const data = await wxRes.json();
        const c = data.current;
        const dirs = ["N","NE","E","SE","S","SW","W","NW"];
        const windDir = dirs[Math.round(c.winddirection_10m / 45) % 8];
        const codes = { 0:"Clear", 1:"Mostly Clear", 2:"Partly Cloudy", 3:"Overcast", 45:"Foggy", 51:"Light Drizzle", 61:"Light Rain", 63:"Rain", 71:"Light Snow", 73:"Snow", 80:"Showers", 95:"Thunderstorm" };
        const wxIcon = (code) => { if (code <= 1) return "☀️"; if (code === 2) return "⛅"; if (code === 3) return "☁️"; if (code >= 51 && code <= 67) return "🌧️"; if (code >= 71 && code <= 77) return "❄️"; if (code >= 80 && code <= 82) return "🌦️"; if (code >= 95) return "⛈️"; return "🌤️"; };
        setQuickConditions({ temp: Math.round(c.temperature_2m), windSpeed: Math.round(c.windspeed_10m), windDir, condition: codes[c.weathercode] || "Clear", icon: wxIcon(c.weathercode), wxCode: c.weathercode });
      } catch {}
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const geoData = await geoRes.json();
        const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || "";
        const stateAbbr = { "Alabama":"AL","Alaska":"AK","Arizona":"AZ","Arkansas":"AR","California":"CA","Colorado":"CO","Connecticut":"CT","Delaware":"DE","Florida":"FL","Georgia":"GA","Hawaii":"HI","Idaho":"ID","Illinois":"IL","Indiana":"IN","Iowa":"IA","Kansas":"KS","Kentucky":"KY","Louisiana":"LA","Maine":"ME","Maryland":"MD","Massachusetts":"MA","Michigan":"MI","Minnesota":"MN","Mississippi":"MS","Missouri":"MO","Montana":"MT","Nebraska":"NE","Nevada":"NV","New Hampshire":"NH","New Jersey":"NJ","New Mexico":"NM","New York":"NY","North Carolina":"NC","North Dakota":"ND","Ohio":"OH","Oklahoma":"OK","Oregon":"OR","Pennsylvania":"PA","Rhode Island":"RI","South Carolina":"SC","South Dakota":"SD","Tennessee":"TN","Texas":"TX","Utah":"UT","Vermont":"VT","Virginia":"VA","Washington":"WA","West Virginia":"WV","Wisconsin":"WI","Wyoming":"WY" };
        const abbr = stateAbbr[geoData.address?.state] || "";
        if (city && abbr) setQuickLocationName(`${city}, ${abbr}`);
      } catch {}
      setQuickConditionsLoading(false);
    }, () => setQuickConditionsLoading(false));
  }, [weatherOverride, locationNameOverride]);
  useEffect(() => { window._showMapPrivacy = () => setShowPrivacyPopup(true); return () => { delete window._showMapPrivacy; }; }, []);

  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
  const STYLES = {
    satellite: "mapbox://styles/mapbox/satellite-streets-v12",
    terrain: "mapbox://styles/mapbox/outdoors-v12",
    street: "mapbox://styles/mapbox/dark-v11",
  };

  // Keep selectedRef in sync so marker click handlers can access current value
  useEffect(() => { selectedRef.current = selected; }, [selected]);

  const loadPins = async () => {
    if (!user) return;
    const { data } = await supabase.from("saved_pins").select("*").eq("user_id", user.id);
    setPins(data || []);
    window._addPinToMap = (pin) => setPins(prev => [...prev, pin]);
    window._removePinFromMap = (postId) => setPins(prev => prev.filter(p => p.post_id !== postId));
  };

  const loadGroups = async () => {
    if (!user) return;
    const { data } = await supabase.from("pin_groups").select("*").eq("user_id", user.id).order("created_at", { ascending: true });
    setGroups(data || []);
  };

  useEffect(() => { loadPins(); loadGroups(); }, [user]);

  const PrivacyPopup = showPrivacyPopup && user ? createPortal(
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="fade-in" style={{ background: "#0d1a0d", border: "1px solid var(--border-accent)", borderRadius: 20, padding: 28, maxWidth: 320, width: "100%", textAlign: "center" }}>
        <div style={{ marginBottom: 12, display: "flex", justifyContent: "center" }}><Lock size={36} color="rgba(255,255,255,0.2)" /></div>
        <div style={{ color: "var(--text)", fontWeight: 800, fontSize: 17, marginBottom: 10 }}>Your pins are private</div>
        <div style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>Everything you save to your map is completely private. Pins are only shared if you choose to send them in a DM.</div>
        <button onClick={() => { setShowPrivacyPopup(false); sessionStorage.setItem("ravlin_map_privacy_seen", "1"); }} style={{ width: "100%", padding: "13px", borderRadius: 14, background: "linear-gradient(135deg, #78b450, #4a8a2a)", border: "none", color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>Got it</button>
      </div>
    </div>, document.body
  ) : null;



  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;
    if (!document.querySelector('link[href*="mapbox-gl"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.css";
      document.head.appendChild(link);
    }
    import("mapbox-gl").then(({ default: mapboxgl }) => {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      const coords = selectedState && STATE_COORDS[selectedState];
      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: STYLES.satellite,
        center: coords ? [coords[1], coords[0]] : [-98.35, 39.5],
        zoom: coords ? 6 : 4,
      });
      mapInst.current = map;
      map.addControl(new mapboxgl.NavigationControl(), "top-right");
      const geolocate = new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false });
      map.addControl(geolocate, "top-right");
      map.on("load", () => { setMapReady(true); setTimeout(() => geolocate.trigger(), 500); });
      map.on("click", e => {
        if (e.originalEvent.target.classList.contains("wildai-pin")) return;
        setDropForm({ lng: e.lngLat.lng, lat: e.lngLat.lat });
        setDropName(""); setDropSpecies(""); setSelected(null);
      });
    });
    return () => { if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; setMapReady(false); } };
  }, []);

  // Temporary drop marker
  useEffect(() => {
    import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (dropMarkerRef.current) { dropMarkerRef.current.remove(); dropMarkerRef.current = null; }
      if (dropForm && mapInst.current) {
        const el = document.createElement("div");
        el.style.cssText = "width:18px;height:18px;border-radius:50%;background:#d4930a;border:3px solid white;box-shadow:0 2px 12px rgba(212,147,10,0.6);cursor:pointer;animation:pulse 1.5s ease-in-out infinite;";
        dropMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: "center" }).setLngLat([dropForm.lng, dropForm.lat]).addTo(mapInst.current);
      }
    });
  }, [dropForm]);



  // Style change
  const changeStyle = (style) => {
    if (!mapInst.current || style === mapStyle) return;
    setMapStyle(style);
    setMapReady(false);
    mapInst.current.setStyle(STYLES[style]);
    mapInst.current.once("style.load", () => { setMapReady(true); });
  };

  // Draw pins — use requestAnimationFrame to avoid lag
  useEffect(() => {
    if (!mapReady || !mapInst.current) return;
    const frame = requestAnimationFrame(() => {
      import("mapbox-gl").then(({ default: mapboxgl }) => {
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];
        pins.filter(p => p.lat && p.lng).forEach(pin => {
          const el = document.createElement("div");
          el.className = "wildai-pin";
          el.style.cssText = "width:14px;height:14px;border-radius:50%;background:#78b450;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.6);cursor:pointer;";
          el.addEventListener("mouseenter", () => { el.style.background = "#d4930a"; });
          el.addEventListener("mouseleave", () => { el.style.background = "#78b450"; });
          el.addEventListener("click", e => {
            e.stopPropagation();
            setSelected(pin);
            setDropForm(null);
            setShowPinsPage(false);
            setViewingPin(pin);
          });
          const marker = new mapboxgl.Marker({ element: el, anchor: "center" }).setLngLat([pin.lng, pin.lat]).addTo(mapInst.current);
          markersRef.current.push(marker);
        });
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [pins, mapReady]);

  const saveDropPin = async () => {
    if (!dropName.trim() || !user) return;
    if (!isPro && pins.length >= FREE_PIN_LIMIT) {
      toast(`Free accounts can save up to ${FREE_PIN_LIMIT} pins. Upgrade to Pro for unlimited pins.`, "error");
      setDropForm(null);
      return;
    }
    setSaving(true);
    if (dropMarkerRef.current) { dropMarkerRef.current.remove(); dropMarkerRef.current = null; }
    await supabase.from("saved_pins").insert({
      user_id: user.id, name: dropName, species: dropSpecies,
      spot_type: dropSpotType || null, best_wind: dropBestWind || null,
      lat: dropForm.lat, lng: dropForm.lng,
      state: selectedState || "",
      location: `${dropForm.lat.toFixed(5)}, ${dropForm.lng.toFixed(5)}`,
    });
    await loadPins();
    setDropForm(null);
    setDropSpotType("");
    setDropBestWind("");
    setSaving(false);
  };

  const createGroup = async () => {
    if (!newGroupName.trim() || !user) return;
    const { data } = await supabase.from("pin_groups").insert({ user_id: user.id, name: newGroupName.trim() }).select().single();
    if (data) setGroups(prev => [...prev, data]);
    setNewGroupName("");
    setShowGroupForm(false);
  };

  const deleteGroup = async (id) => {
    await supabase.from("pin_groups").delete().eq("id", id);
    await supabase.from("saved_pins").update({ group_id: null }).eq("group_id", id);
    setGroups(prev => prev.filter(g => g.id !== id));
    setPins(prev => prev.map(p => p.group_id === id ? { ...p, group_id: null } : p));
  };

  const assignGroup = async (pinId, groupId) => {
    await supabase.from("saved_pins").update({ group_id: groupId || null }).eq("id", pinId);
    setPins(prev => prev.map(p => p.id === pinId ? { ...p, group_id: groupId || null } : p));
    setAssigningPin(null);
  };

  const removePin = async (id) => {
    await supabase.from("saved_pins").delete().eq("id", id);
    setPins(prev => prev.filter(p => p.id !== id));
    setSelected(null);
    setViewingPin(null);
    setShowPinsPage(false);
  };

  const updatePin = async (id, fields) => {
    const { error } = await supabase.from("saved_pins").update(fields).eq("id", id);
    if (!error) {
      setPins(prev => prev.map(p => p.id === id ? { ...p, ...fields } : p));
      setViewingPin(prev => prev?.id === id ? { ...prev, ...fields } : prev);
    }
    return error;
  };

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {PrivacyPopup}
      {showPinsPage && !viewingPin && (
        <PinsPage
          pins={pins}
          onBack={() => setShowPinsPage(false)}
          onSelectPin={(pin) => setViewingPin(pin)}
        />
      )}
      {viewingPin && (
        <PinDetailPage
          pin={viewingPin}
          onBack={() => {
            if (showPinsPage) { setViewingPin(null); }
            else { setViewingPin(null); }
          }}
          onDelete={async (id) => { await removePin(id); }}
          onSave={updatePin}
          onSharePin={(pin) => { setViewingPin(null); setShowPinsPage(false); onSharePin(pin); }}
        />
      )}

      {/* Conditions card - TOP */}
      <div style={{ background: "linear-gradient(160deg, #0c1c0c 0%, #071007 100%)", border: "1px solid rgba(139,195,74,0.15)", borderTop: "1px solid rgba(139,195,74,0.25)", borderRadius: 18, padding: "16px 18px", boxShadow: "0 4px 24px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04) inset, 0 -1px 0 rgba(0,0,0,0.3) inset" }}>
        {quickConditionsLoading ? (
          <div style={{ color: "var(--text3)", fontSize: 13 }}>Fetching conditions...</div>
        ) : quickConditions ? (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <MapPin size={11} color="rgba(139,195,74,0.6)" />
                <span style={{ color: "rgba(139,195,74,0.7)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{quickLocationName || "Current Location"}</span>
              </div>
              {user && pins.length > 0 && (
                <button onClick={() => setShowPinConditions(true)} style={{ background: "rgba(139,195,74,0.08)", border: "1px solid rgba(139,195,74,0.2)", color: "var(--green)", borderRadius: 8, padding: "5px 11px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: 5, letterSpacing: "0.02em" }}>
                  <MapPin size={11} />Pin Conditions
                </button>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <Icon icon={(() => {
                  const h = new Date().getHours();
                  const n = h >= 20 || h < 6;
                  const c = parseInt(quickConditions.wxCode);
                  if (c === 0) return n ? "meteocons:clear-night-fill" : "meteocons:clear-day-fill";
                  if (c === 1) return n ? "meteocons:partly-cloudy-night-fill" : "meteocons:partly-cloudy-day-fill";
                  if (c === 2) return n ? "meteocons:partly-cloudy-night-fill" : "meteocons:partly-cloudy-day-fill";
                  if (c === 3) return n ? "meteocons:overcast-night-fill" : "meteocons:overcast-day-fill";
                  if (c === 45 || c === 48) return n ? "meteocons:fog-night-fill" : "meteocons:fog-day-fill";
                  if (c === 51 || c === 53 || c === 55) return "meteocons:drizzle-fill";
                  if (c === 56 || c === 57) return n ? "meteocons:partly-cloudy-night-drizzle-fill" : "meteocons:partly-cloudy-day-drizzle-fill";
                  if (c === 61 || c === 63 || c === 65) return "meteocons:rain-fill";
                  if (c === 66 || c === 67) return "meteocons:sleet-fill";
                  if (c === 71 || c === 73 || c === 75) return "meteocons:snow-fill";
                  if (c === 77) return "meteocons:hail-fill";
                  if (c === 80 || c === 81 || c === 82) return n ? "meteocons:partly-cloudy-night-rain-fill" : "meteocons:partly-cloudy-day-rain-fill";
                  if (c === 85 || c === 86) return n ? "meteocons:partly-cloudy-night-snow-fill" : "meteocons:partly-cloudy-day-snow-fill";
                  if (c === 95) return n ? "meteocons:thunderstorms-night-fill" : "meteocons:thunderstorms-day-fill";
                  if (c === 96 || c === 99) return n ? "meteocons:thunderstorms-night-rain-fill" : "meteocons:thunderstorms-day-rain-fill";
                  return n ? "meteocons:partly-cloudy-night-fill" : "meteocons:partly-cloudy-day-fill";
                })()} style={{ width: 56, height: 56, display: "block" }} />
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 500 }}>{quickConditions.condition}</span>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: 8 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 6 }}>
                  <span style={{ color: "#ffffff", fontSize: 44, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.02em", textShadow: "0 0 20px rgba(255,255,255,0.15)" }}>{quickConditions.temp}°</span>
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 22, fontWeight: 300 }}>F</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Wind size={11} color="rgba(255,255,255,0.25)" />
                  <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>{quickConditions.windSpeed} mph {quickConditions.windDir}</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text3)", fontSize: 13 }}>Enable location to see conditions</span>
            {user && pins.length > 0 && (
              <button onClick={() => setShowPinConditions(true)} style={{ background: "rgba(139,195,74,0.08)", border: "1px solid rgba(139,195,74,0.2)", color: "var(--green)", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: 5 }}><MapPin size={12} />Pin Conditions</button>
            )}
          </div>
        )}
      </div>

      {/* Map */}
      <div style={{ position: "relative", borderRadius: isFullscreen ? 0 : "var(--radius)", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", borderTopColor: "rgba(255,255,255,0.14)", boxShadow: isFullscreen ? "none" : "0 8px 40px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)" }}>
        <div ref={mapRef} style={{ height: isFullscreen ? "100dvh" : 280, width: "100%", position: isFullscreen ? "fixed" : "relative", top: isFullscreen ? 0 : "auto", left: isFullscreen ? 0 : "auto", right: isFullscreen ? 0 : "auto", bottom: isFullscreen ? 0 : "auto", zIndex: isFullscreen ? 998 : "auto" }} />

        {/* Expand button */}
        <div style={{ position: isFullscreen ? "fixed" : "absolute", top: isFullscreen ? 16 : 10, left: isFullscreen ? 16 : 10, zIndex: 1001, display: "flex", gap: 6 }}>
          <button onClick={() => { setIsFullscreen(f => !f); setTimeout(() => mapInst.current?.resize(), 150); }} style={{ background: "rgba(8,15,8,0.95)", border: "1px solid var(--border-accent)", color: "var(--green)", borderRadius: "var(--radius-sm)", padding: "8px 14px", fontSize: 12, cursor: "pointer", backdropFilter: "blur(8px)", fontFamily: "var(--font-body)", fontWeight: 600 }}>
            {isFullscreen ? "✕ Exit" : "⊞ Expand"}
          </button>
          <button onClick={() => { const styles = ["satellite", "terrain", "street"]; const next = styles[(styles.indexOf(mapStyle) + 1) % styles.length]; changeStyle(next); }} style={{ background: "rgba(8,15,8,0.95)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 10px", fontSize: 12, cursor: "pointer", backdropFilter: "blur(8px)", color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center" }}>
            {mapStyle === "satellite"
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
              : mapStyle === "terrain"
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 20 9 4 15 16 19 10 21 20 3 20" /></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" /></svg>
            }
          </button>
        </div>

        {user && <div style={{ position: "absolute", bottom: 10, left: 10, zIndex: 10, background: "rgba(8,15,8,0.9)", border: "1px solid var(--border)", color: "var(--text3)", borderRadius: "var(--radius-sm)", padding: "5px 10px", fontSize: 10, backdropFilter: "blur(8px)" }}>Tap map to drop a pin</div>}
      </div>

      {/* Pin conditions picker */}
      {showPinConditions && user && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1050, display: "flex", alignItems: "flex-end" }} onClick={() => setShowPinConditions(false)}>
          <div onClick={e => e.stopPropagation()} className="fade-in" style={{ width: "100%", background: "#0d1a0d", borderRadius: "20px 20px 0 0", padding: "20px 20px 40px", border: "1px solid var(--border)", borderBottom: "none", maxHeight: "60vh", overflowY: "auto" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", margin: "0 auto 16px" }} />
            <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Check Pin Conditions</div>
            {pins.filter(p => p.lat && p.lng).map(pin => (
              <button key={pin.id} onClick={() => { setShowPinConditions(false); setViewingPin(pin); }} style={{ width: "100%", textAlign: "left", background: "none", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-body)" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: "var(--text)", fontWeight: 600, fontSize: 13 }}>{pin.name || "Unnamed Spot"}</div>
                  {pin.spot_type && <div style={{ color: "var(--text3)", fontSize: 11 }}>{pin.spot_type}</div>}
                </div>
                <span style={{ color: "var(--green)", fontSize: 12, fontWeight: 600 }}>Conditions →</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {dropForm && user && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1002, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setDropForm(null)}>
          <div onClick={e => e.stopPropagation()} className="fade-in" style={{ width: "100%", background: "#0d1a0d", borderRadius: "20px 20px 0 0", padding: "20px 20px 40px", border: "1px solid var(--border)", borderBottom: "none", boxShadow: "0 -8px 40px rgba(0,0,0,0.6)", marginBottom: 0 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", margin: "0 auto 18px" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Crosshair size={18} color="var(--green)" />
              <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 15 }}>Save Spot</div>
              <div style={{ color: "var(--text3)", fontSize: 11, marginLeft: 4 }}>{dropForm.lat.toFixed(4)}, {dropForm.lng.toFixed(4)}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input placeholder="Spot name *" value={dropName} onChange={e => setDropName(e.target.value)} autoFocus style={{ width: "100%", padding: "12px 14px", borderRadius: "var(--radius-sm)", fontSize: 14, boxSizing: "border-box" }} />
              <div style={{ display: "flex", gap: 8 }}>
                <select value={dropSpotType} onChange={e => setDropSpotType(e.target.value)} style={{ flex: 1, padding: "12px 10px", borderRadius: "var(--radius-sm)", fontSize: 13 }}>
                  <option value="">Spot type...</option>
                  <option value="Stand">🌲 Stand</option>
                  <option value="Blind">🏕️ Blind</option>
                  <option value="Bedding">😴 Bedding</option>
                  <option value="Food Source">🌾 Food Source</option>
                  <option value="Trail Cam">📷 Trail Cam</option>
                  <option value="Glassing">🔭 Glassing</option>
                  <option value="Access Point">🚗 Access Point</option>
                  <option value="Fishing Hole">🎣 Fishing Hole</option>
                  <option value="Boat Ramp">⛵ Boat Ramp</option>
                  <option value="Other">📍 Other</option>
                </select>
                <select value={dropBestWind} onChange={e => setDropBestWind(e.target.value)} style={{ flex: 1, padding: "12px 10px", borderRadius: "var(--radius-sm)", fontSize: 13 }}>
                  <option value="">Best wind...</option>
                  <option value="N">N</option>
                  <option value="NE">NE</option>
                  <option value="E">E</option>
                  <option value="SE">SE</option>
                  <option value="S">S</option>
                  <option value="SW">SW</option>
                  <option value="W">W</option>
                  <option value="NW">NW</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={saveDropPin} disabled={!dropName.trim() || saving} className="btn-primary" style={{ flex: 1, padding: "12px", fontSize: 14, opacity: !dropName.trim() ? 0.5 : 1 }}>{saving ? "Saving..." : "Save Spot"}</button>
                <button onClick={() => setDropForm(null)} className="btn-ghost" style={{ padding: "12px 16px", fontSize: 14 }}>✕</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Pins section */}
      {user && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: "rgba(139,195,74,0.7)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>My Pins</span>
            <button onClick={() => setShowPinsPage(true)} style={{ background: "none", border: "none", color: "var(--green)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", letterSpacing: "0.02em" }}>View All ({pins.length}) →</button>
          </div>
          {pins.filter(p => p.lat && p.lng).length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text3)", fontSize: 13 }}>Tap the map to drop your first pin</div>
          ) : (
            <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {pins.filter(p => p.lat && p.lng).map(pin => {
                const dist = userCoords ? getDistanceMi(userCoords.lat, userCoords.lng, pin.lat, pin.lng) : null;
                const distLabel = dist !== null ? (dist < 0.1 ? "< 0.1 mi" : `${dist.toFixed(1)} mi`) : null;
                return (
                  <button key={pin.id} onClick={() => setViewingPin(pin)} style={{ flexShrink: 0, width: 148, background: "linear-gradient(160deg, #0c1c0c 0%, #071007 100%)", border: "1px solid rgba(139,195,74,0.12)", borderTop: "1px solid rgba(139,195,74,0.2)", borderRadius: 14, padding: "14px", textAlign: "left", cursor: "pointer", fontFamily: "var(--font-body)", display: "flex", flexDirection: "column", gap: 6, boxShadow: "0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)" }}>
                    <span style={{ color: "#ffffff", fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pin.name || "Unnamed Spot"}</span>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                      <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{pin.spot_type || ""}</span>
                      {distLabel && <span style={{ color: "rgba(139,195,74,0.55)", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0, letterSpacing: "0.02em" }}>{distLabel}</span>}
                    </div>
                    <div style={{ marginTop: "auto", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--green)", fontSize: 11, fontWeight: 700 }}>Conditions</span>
                      <span style={{ color: "var(--green)", fontSize: 13 }}>→</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!user && (
        <div style={{ textAlign: "center", padding: 24, color: "var(--text3)", fontSize: 14 }}>
          Sign in to save and drop pins on your map
        </div>
      )}

      {selected && (
        <div className="card fade-in" style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{selected.name || "Saved Spot"}</div>
            {selected.species && <div style={{ color: "var(--green)", fontSize: 12, marginBottom: 4 }}>{selected.species}</div>}
            {selected.location && <div style={{ color: "var(--text2)", fontSize: 13, marginBottom: 8 }}>📍 {selected.location}</div>}
            {selected.photo && <img src={selected.photo} style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: "var(--radius-sm)", marginBottom: 8 }} />}
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)", fontSize: 12, fontWeight: 600 }}>Get Directions →</a>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <button onClick={() => removePin(selected.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,100,100,0.7)", fontSize: 11, padding: "4px 8px", fontFamily: "var(--font-body)" }}><span style={{ display: "flex", alignItems: "center", gap: 4 }}><Trash2 size={12} />Remove</span></button>
            <button onClick={() => setSelected(null)} className="btn-ghost" style={{ padding: "5px 10px", fontSize: 12 }}>✕</button>
          </div>
        </div>
      )}

    </div>
  );
}
