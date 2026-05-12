import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { PawPrint, Crosshair, IdCard, Package } from "lucide-react";
import { createPortal } from "react-dom";
import { supabase } from "../supabase";
import { useUser, UserButton, useClerk } from "@clerk/react";
import { STATES, SPECIES, SPECIES_ICONS, GEAR_CHECKLISTS, FREE_LIMIT } from "../constants";
import { TypewriterText, fmtMsg, toast } from "../utils";
const WeatherWidget = lazy(() => import("./WeatherWidget"));
const MapTab = lazy(() => import("./MapTab"));
const RegulationsTab = lazy(() => import("./RegulationsTab"));
const LicensesTab = lazy(() => import("./LicensesTab"));
const TripPlannerTab = lazy(() => import("./TripPlannerTab"));
const AdminTab = lazy(() => import("./AdminTab"));
const HarvestLogTab = lazy(() => import("./HarvestLogTab"));
const BallisticsTab = lazy(() => import("./BallisticsTab"));
const TrophyBoardTab = lazy(() => import("./TrophyBoardTab"));
const CommunityTab = lazy(() => import("./CommunityTab"));

export default function ChatPage({ onBack, messageCount, setMessageCount, selectedState, setSelectedState, onTerms, messagesUnread, setMessagesUnread, notifUnread, setNotifUnread, openPricingModal, isGuest, onSignIn }) {
  const [tab, setTab] = useState("more");
  const [weather, setWeather] = useState(null);
  const [locationName, setLocationName] = useState("");

  useEffect(() => {
    let lat, lon;
    const fetchWeather = async () => {
      if (!lat || !lon) return;
      try {
        const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,precipitation&wind_speed_unit=mph&temperature_unit=fahrenheit&timezone=auto`);
        const d = await r.json();
        if (d.current) setWeather({ ...d.current, lat, lng: lon, timezone: d.timezone });
      } catch { }
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
        try {
          const geo = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
          const geoData = await geo.json();
          const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || "Your Location";
          const stateAbbr = { "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA", "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE", "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA", "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD", "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT", "Virginia": "VA", "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY" };
          const abbr = stateAbbr[geoData.address?.state] || "";
          const name = abbr ? `${city}, ${abbr}` : city;
          setLocationName(name);
          const detectedState = geoData.address?.state;
          if (detectedState) setGpsState(detectedState);
          if (detectedState && STATES.includes(detectedState) && !selectedState) {
            setSelectedState(detectedState);
          } else if (detectedState && selectedState && detectedState !== selectedState) {
            setShowLocationPrompt(true);
          }
          await fetchWeather();
        } catch { }
        setDetectingLocation(false);
      }, () => setDetectingLocation(false));
    } else {
      setDetectingLocation(false);
    }
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  const [locationPreference, setLocationPreference] = useState(null);
  const [botStatus, setBotStatus] = useState("online");
  const [gpsState, setGpsState] = useState("");
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: `Hey, I'm Ravlin${selectedState ? ` — your ${selectedState} hunting & fishing assistant` : ""}. Ask me anything about tactics, gear, or conditions. For regulations, the Regs tab links directly to your state's official site. What are you after?`, animate: false },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [showMore, setShowMore] = useState(false);
  const [stateSpecies, setStateSpecies] = useState([]);
  const [loadingStateSpecies, setLoadingStateSpecies] = useState(false);
  const speciesTabCache = useRef({});
  const bottomRef = useRef(null);
  const { user, isLoaded } = useUser();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const [billingPlan, setBillingPlan] = useState("monthly");
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(() => !localStorage.getItem("wildai_selected_state") && !selectedState);
  const { openSignIn: _openSignIn, openUserProfile } = useClerk();
  const openSignIn = () => { _openSignIn({ afterSignInUrl: window.location.href, afterSignUpUrl: window.location.href }); };
  useEffect(() => { window._triggerSignIn = openSignIn; window._clerkOpenProfile = openUserProfile; return () => { window._triggerSignIn = null; window._clerkOpenProfile = null; }; }, [openSignIn, openUserProfile]);
  const [mapMounted, setMapMounted] = useState(false);
  useEffect(() => { if (tab === "map") setMapMounted(true); }, [tab]);

  const isPro = user?.publicMetadata?.isPro === true;
  const openPricingOrSignIn = () => { if (!user || isGuest) { openSignIn(); } else { openPricingModal(); } };
  const hitLimit = !isPro && messageCount >= FREE_LIMIT;

  useEffect(() => {
    if (selectedState && gpsState) {
      if (gpsState !== selectedState) { setLocationPreference(null); setShowLocationPrompt(true); }
      else { setShowLocationPrompt(false); }
    }
  }, [selectedState]);

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone;
    setIsIOS(ios);
    if (localStorage.getItem("ravlin_install_dismissed")) return;
    if (!user) return;
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); setTimeout(() => setShowInstallBanner(true), 3000); };
    if (ios) { setTimeout(() => setShowInstallBanner(true), 3000); return; }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [user]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => {
    if (!user || isPro) return;
    const loadCount = async () => {
      const { data } = await supabase.from("message_counts").select("count, updated_at").eq("user_id", user.id).maybeSingle();
      if (data) {
        const lastUpdate = new Date(data.updated_at);
        const now = new Date();
        if (lastUpdate.getMonth() !== now.getMonth() || lastUpdate.getFullYear() !== now.getFullYear()) {
          await supabase.from("message_counts").upsert({ user_id: user.id, count: 0, updated_at: now.toISOString() });
          setMessageCount(0);
          localStorage.setItem("wildai_message_count", 0);
        } else {
          setMessageCount(data.count);
        }
      }
    };
    loadCount();
  }, [user]);

  const sendMessage = async (text) => {
    const msg = text || input;
    if (!msg.trim() || hitLimit) return;
    const newMsgs = [...messages, { role: "user", content: msg, animate: false }];
    setMessages(newMsgs); setInput(""); setLoading(true);
    const newCount = messageCount + 1;
    setMessageCount(newCount);
    localStorage.setItem("wildai_message_count", newCount);
    if (user) {
      supabase.from("message_counts").upsert({ user_id: user.id, count: newCount, updated_at: new Date().toISOString() });
    }
    if (tab !== "chat") setTab("chat");
    const now = new Date();
    const moonPhase = () => {
      const synodicMonth = 29.53058867;
      const known = new Date(2000, 0, 6, 18, 14, 0);
      const diff = (now - known) / (1000 * 60 * 60 * 24);
      const phase = ((diff % synodicMonth) + synodicMonth) % synodicMonth;
      if (phase < 1.85) return "New Moon 🌑";
      if (phase < 5.53) return "Waxing Crescent 🌒";
      if (phase < 9.22) return "First Quarter 🌓";
      if (phase < 12.91) return "Waxing Gibbous 🌔";
      if (phase < 16.61) return "Full Moon 🌕";
      if (phase < 20.30) return "Waning Gibbous 🌖";
      if (phase < 23.99) return "Last Quarter 🌗";
      if (phase < 27.68) return "Waning Crescent 🌘";
      return "New Moon 🌑";
    };
    const timeOfDay = now.getHours() < 12 ? "morning" : now.getHours() < 17 ? "afternoon" : "evening";
    const system = `You are Ravlin, an expert hunting and fishing assistant${selectedState ? ` specializing in ${selectedState}` : ""}. Deep knowledge of hunting tactics, fishing techniques, gear, wildlife behavior, seasons, regulations${selectedState ? ` specific to ${selectedState}` : " across US states"}, trip planning, and public land navigation. Give practical, specific, confident advice like a seasoned outdoorsman. Use **bold** for key terms. Keep responses concise and useful. Never use hashtags or markdown headers (# symbols). Never use bullet point symbols like • or -. Remind users to verify regulations with their state agency when relevant.If a user asks about canceling their subscription or managing billing, tell them to click their profile avatar in the top right corner of the app and select "Manage Subscription".

CURRENT CONTEXT (use this for accurate seasonal and timing advice):
- Today's date: ${now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
- Time of day: ${timeOfDay}
- Current moon phase: ${moonPhase()}
- User's selected state (for regulations/seasons): ${selectedState || "not specified"}
- User's GPS location (physical location right now): ${locationName || "not detected"}
- User's location preference: ${locationPreference === "gps" ? `User chose GPS — use ${locationName} for ALL advice` : locationPreference === "state" ? `User chose selected state — use ${selectedState} for ALL advice` : "Not chosen yet — use selected state for regulations, GPS for weather only. Do NOT mix them."}
- Season: ${["Winter", "Winter", "Spring", "Spring", "Spring", "Summer", "Summer", "Summer", "Fall", "Fall", "Fall", "Winter"][now.getMonth()]}${weather && locationName ? `\n- Current weather at ${locationName}: ${Math.round(weather.temperature_2m)}°F, wind ${Math.round(weather.wind_speed_10m)}mph, precip ${weather.precipitation}"` : `\n- Current weather: not loaded. If the user asks about current conditions, tell them to enter a location in the Weather tab and then come back to chat.`}`;
    try {
      const res = await fetch("https://wildai-server.onrender.com/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs.map(m => ({ role: m.role, content: m.content })), system })
      });
      const d = await res.json();
      setBotStatus("online");
      setMessages([...newMsgs, { role: "assistant", content: d.reply, animate: true }]);
    } catch {
      setBotStatus("offline");
      setMessages([...newMsgs, { role: "assistant", content: "Sorry, I had trouble connecting. Please try again.", animate: false }]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!selectedState) return;
    const cacheKey = selectedState;
    if (speciesTabCache.current[cacheKey]) {
      setStateSpecies(speciesTabCache.current[cacheKey]);
      return;
    }
    setLoadingStateSpecies(true);
    const loadSpecies = async () => {
      try {
        const { data: cached } = await supabase.from("species_cache").select("species").eq("state", selectedState).maybeSingle();
        if (cached) {
          setStateSpecies(cached.species);
          speciesTabCache.current[cacheKey] = cached.species;
          setLoadingStateSpecies(false);
          return;
        }
        const res = await fetch("https://wildai-server.onrender.com/chat", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", content: `Return ONLY a JSON array of exactly 30 species for ${selectedState}, ranked #1 to #30 by actual hunter and angler participation numbers — most popular first. The mix of hunting vs fishing should naturally reflect what ${selectedState} is genuinely known for. Only include species with real open seasons and significant participation. Each object must have: name (string, use common name), type ("hunting" or "fishing"), desc (string, max 6 words describing habitat or key trait). No commercial-only species, no rare or exotic species, no random padding. No emoji, no markdown, no explanation, just the raw JSON array.` }], system: "Return only a valid JSON array ranked by popularity. No emoji. No markdown. No explanation. No code fences." })
        });
        const d = await res.json();
        const text = d.reply.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(text);
        setStateSpecies(parsed);
        speciesTabCache.current[cacheKey] = parsed;
        await supabase.from("species_cache").upsert({ state: selectedState, species: parsed }, { onConflict: "state" });
      } catch {
        setStateSpecies([]);
      }
      setLoadingStateSpecies(false);
    };
    loadSpecies();
  }, [selectedState]);

  const toggleCheck = (cl, item) => {
    const k = `${cl}::${item}`;
    setCheckedItems(p => ({ ...p, [k]: !p[k] }));
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", fontFamily: "var(--font-body)" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      </div>

      <header style={{ borderBottom: "1px solid rgba(120,180,80,0.1)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", backdropFilter: "blur(24px)", background: "rgba(5,10,5,0.88)", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 4px 24px rgba(0,0,0,0.3), 0 1px 0 rgba(120,180,80,0.08)", overflow: "visible" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div className="mobile-header-center" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="mobile-header-logo" style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "var(--text)" }}>Ravlin</span>
            <select className="mobile-state-select" value={selectedState} onChange={e => setSelectedState && setSelectedState(e.target.value)} style={{ background: "transparent", border: "none", color: selectedState ? "var(--text3)" : "var(--text3)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)", outline: "none", maxWidth: 120 }}>
              <option value="">· State</option>
              {STATES.map(s => <option key={s} value={s} style={{ background: "#0a150a" }}>· {s}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isPro ? (
              <div className="mobile-header-badge" style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "var(--green-dim)", border: "1px solid var(--border-accent)", color: "var(--green)" }}>Pro ✓</div>
            ) : !isGuest ? (
              <button onClick={() => openPricingModal()} className="btn-gold" style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12 }}>Go Pro</button>
            ) : null}
          </div>
          {!user || isGuest ? (
            <button onClick={() => openSignIn()} className="btn-primary" style={{ padding: "7px 14px", fontSize: 13 }}>{isGuest ? "Sign Up" : "Sign In"}</button>
          ) : (
            <div style={{ borderRadius: "50%", outline: "none", boxShadow: "0 0 0 1.5px rgba(255,255,255,0.7), 0 0 10px rgba(255,255,255,0.2)", display: "inline-flex", lineHeight: 0 }}>
              <UserButton afterSignOutUrl="https://wildai.netlify.app">
                <UserButton.MenuItems>
                  <UserButton.Action
                    label="Manage Subscription"
                    labelIcon={<span>💳</span>}
                    onClick={async () => {
                      const customerId = user?.publicMetadata?.stripeCustomerId;
                      const res = await fetch("https://wildai-server.onrender.com/customer-portal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerId }) });
                      const data = await res.json();
                      if (data.url) window.location.href = data.url;
                    }}
                  />
                </UserButton.MenuItems>
              </UserButton>
            </div>
          )}
        </div>
      </header>

      {/* BOTTOM NAV */}
      <div className="bottom-nav" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, background: "rgba(8,12,8,0.97)", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "stretch", height: 68, backdropFilter: "blur(24px)" }}>
        {(() => {
          const tabs = ["more", "map", "chat", "community"];
          const activeIndex = tabs.indexOf(tab);
          return <>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2.5, pointerEvents: "none" }}>
              <div style={{ position: "absolute", top: 0, height: 2.5, width: 36, borderRadius: "0 0 3px 3px", background: "var(--green)", boxShadow: "0 0 12px rgba(120,200,80,1)", left: `calc(${activeIndex} * 25% + 12.5% - 18px)`, transition: "left 0.25s cubic-bezier(0.4, 0, 0.2, 1)" }} />
            </div>
            <div style={{ display: "flex", flex: 1 }}>
              {[
                { id: "more", label: "Tools", svg: (active) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /></svg> },
                { id: "map", label: "Map", svg: (active) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" /><line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" /></svg> },
                { id: "chat", label: "Guide", svg: (active) => <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", transform: active ? "translateY(-6px)" : "none", transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)" }}><img src="/deer-shield.png" style={{ width: active ? 64 : 60, height: active ? 64 : 60, objectFit: "contain", opacity: active ? 1 : 0.4, filter: active ? "none" : "grayscale(100%) brightness(1.5)", transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)" }} />{active && <span style={{ position: "absolute", bottom: 5, left: "50%", transform: "translateX(-50%)", fontSize: 11, fontWeight: 700, color: "var(--green)", letterSpacing: "0.03em", whiteSpace: "nowrap", textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}>Guide</span>}</div> },
                { id: "community", label: "Community", svg: (active) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
              ].map(t => {
                const active = tab === t.id;
                return (
                  <button key={t.id} onClick={() => { setTab(t.id); setShowMore(false); if (t.id === "map" && !sessionStorage.getItem("ravlin_map_privacy_seen")) { window._showMapPrivacy?.(); } }} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: active ? "var(--green)" : "rgba(255,255,255,0.35)", transition: "color 0.2s" }}>
                    <div style={{ position: "relative", transform: active && t.id !== "chat" ? "scale(1.2) translateY(-3px)" : "scale(1)", transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)" }}>
                      {t.svg(active)}
                      {t.id === "community" && (messagesUnread + notifUnread) > 0 && (
                        <div style={{ position: "absolute", top: -3, right: -3, background: "#f43f5e", borderRadius: "50%", minWidth: 13, height: 13, fontSize: 8, fontWeight: 700, color: "white", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 2px" }}>
                          {(messagesUnread + notifUnread) > 9 ? "9+" : messagesUnread + notifUnread}
                        </div>
                      )}
                    </div>
                    {active && t.id !== "chat" && <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.03em" }}>{t.label}</span>}
                  </button>
                );
              })}
            </div>
          </>;
        })()}
      </div>

      <div style={{ flex: 1, padding: 20, paddingBottom: 80, maxWidth: 760, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 16, position: "relative" }}>

        {showInstallBanner && !window.navigator.standalone && createPortal(
          <div style={{ position: "fixed", inset: 0, zIndex: 999999, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(8px)" }}>
            <div style={{ background: "#0e1a0e", border: "1px solid rgba(120,180,80,0.3)", borderRadius: 20, padding: 28, maxWidth: 320, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
              <img src="/badge1.png" style={{ width: 80, height: 80, objectFit: "contain", marginBottom: 16, opacity: 0.9 }} />
              <div style={{ color: "white", fontWeight: 700, fontSize: 18, fontFamily: "var(--font-display)", marginBottom: 8 }}>Add Ravlin to your Home Screen</div>
              <div style={{ color: "rgba(238,245,232,0.6)", fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
                {isIOS ? <>Tap <strong style={{ color: "var(--green)" }}>Share ⬆</strong> then <strong style={{ color: "var(--green)" }}>Add to Home Screen</strong> for the best experience.</> : "Install Ravlin for the best experience — faster, fullscreen, and works like a native app."}
              </div>
              {!isIOS && <button onClick={handleInstall} style={{ width: "100%", padding: "13px", borderRadius: 14, background: "linear-gradient(135deg, #3a7020, #2d5a1a)", border: "1px solid rgba(120,180,80,0.5)", color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "var(--font-body)", marginBottom: 10 }}>Install App</button>}
              <button onClick={() => { setShowInstallBanner(false); localStorage.setItem("ravlin_install_dismissed", "1"); }} style={{ background: "none", border: "none", color: "rgba(238,245,232,0.35)", cursor: "pointer", fontSize: 13, fontFamily: "var(--font-body)" }}>Maybe later</button>
            </div>
          </div>,
          document.body
        )}

        {/* CHAT */}
        {tab === "chat" && (
          <div className="tab-fade">
            {showLocationPrompt && locationPreference === null && (
              <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
                <div className="fade-in" style={{ background: "linear-gradient(160deg, #0d1a0d, #080c08)", border: "1px solid #1c2a1c", borderRadius: 20, padding: 24, maxWidth: 340, width: "100%" }}>
                  <div style={{ fontSize: 32, textAlign: "center", marginBottom: 12 }}>📍</div>
                  <div style={{ color: "white", fontWeight: 800, fontSize: 16, textAlign: "center", marginBottom: 8 }}>Which location should I use?</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, textAlign: "center", lineHeight: 1.6, marginBottom: 20 }}>
                    You're in <strong style={{ color: "white" }}>{locationName}</strong> but your selected state is <strong style={{ color: "var(--green)" }}>{selectedState}</strong>. Which should I base my advice on?
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <button onClick={() => { setLocationPreference("gps"); setShowLocationPrompt(false); }} style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(74,170,200,0.15)", border: "1px solid rgba(74,170,200,0.3)", color: "rgba(74,170,200,0.9)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", transition: "transform 0.15s, box-shadow 0.15s" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(74,170,200,0.25)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                      📍 My Current Location ({locationName})
                    </button>
                    <button onClick={() => { setLocationPreference("state"); setShowLocationPrompt(false); }} style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(120,180,80,0.15)", border: "1px solid rgba(120,180,80,0.3)", color: "var(--green)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", transition: "transform 0.15s, box-shadow 0.15s" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(120,180,80,0.25)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                      🗺️ Selected State ({selectedState})
                    </button>
                  </div>
                </div>
              </div>
            )}
            {weather && (
              <div onClick={() => setTab("weather")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "linear-gradient(135deg, #0d160d, #111a11)", border: "1px solid #1c2c1c", borderRadius: 16, cursor: "pointer" }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "rgba(109,186,74,0.12)", border: "1px solid rgba(109,186,74,0.2)" }}>
                  <span style={{ fontSize: 18 }}>{weather.weather_code === 0 ? "☀️" : weather.weather_code <= 3 ? "⛅" : weather.weather_code <= 48 ? "🌫️" : weather.weather_code <= 67 ? "🌧️" : weather.weather_code <= 77 ? "❄️" : "⛈️"}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "white", fontSize: 13, fontWeight: 700 }}>{Math.round(weather.temperature_2m)}°F</span>
                    <span style={{ color: "#4a6a4a", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4a6a4a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>{locationName}</span>
                  </div>
                  <span style={{ color: "#6dba4a", fontSize: 11, fontWeight: 600, marginTop: 2 }}>
                    {weather.weather_code === 0 ? "Clear" : weather.weather_code <= 3 ? "Partly cloudy" : weather.weather_code <= 48 ? "Foggy" : weather.weather_code <= 67 ? "Rain" : weather.weather_code <= 77 ? "Snow" : "Showers"} · {Math.round(weather.wind_speed_10m)} mph
                  </span>
                </div>
                <div style={{ marginLeft: "auto", background: "rgba(109,186,74,0.1)", border: "1px solid rgba(109,186,74,0.15)", borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(109,186,74,0.7)" }}>LIVE</div>
              </div>
            )}
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "linear-gradient(160deg, #0d140d 0%, #090d09 100%)", border: "1px solid #1a261a", borderRadius: 20, boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }}>
              <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #141e14", background: "rgba(0,0,0,0.2)" }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: "linear-gradient(135deg, #78b450, #4a8a2a)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 16px rgba(120,180,80,0.3)" }}>
                  <img src="/chat.png" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: "50%" }} />
                </div>
                <div>
                  <div style={{ color: "white", fontWeight: 700, fontSize: 14 }}>Ravlin</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: botStatus === "online" ? "#4ade80" : "#f43f5e", boxShadow: botStatus === "online" ? "0 0 6px rgba(74,222,128,0.8)" : "0 0 6px rgba(244,63,94,0.8)" }} />
                    <span style={{ color: botStatus === "online" ? "#4a7a4a" : "#f43f5e", fontSize: 11 }}>{botStatus === "online" ? "Online" : "Not connected"}</span>
                  </div>
                </div>
              </div>
              <div style={{ overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 12, minHeight: 300, maxHeight: "55vh" }}>
                {messages.map((m, i) => (
                  <div key={i} className="fade-in" style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap: 10, alignItems: "flex-end" }}>
                    {m.role === "assistant" && <img src="/chat.png" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: "50%", flexShrink: 0 }} />}
                    <div style={{ background: m.role === "user" ? "linear-gradient(135deg,var(--green),var(--green2))" : "rgba(255,255,255,0.05)", border: m.role === "assistant" ? "1px solid var(--border)" : "none", color: "var(--text)", padding: "13px 17px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", maxWidth: "80%", boxShadow: m.role === "user" ? "0 4px 16px rgba(120,180,80,0.2)" : "none" }}>
                      {m.role === "assistant" && m.animate
                        ? <TypewriterText text={m.content} onDone={() => setMessages(prev => prev.map((msg, j) => j === i ? { ...msg, animate: false } : msg))} />
                        : fmtMsg(m.content)}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                    <img src="/chat.png" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: "50%", flexShrink: 0 }} />
                    <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", padding: "13px 17px", borderRadius: "18px 18px 18px 4px" }}>
                      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        {[0, 1, 2].map(j => <div key={j} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", animation: `pulse 1.2s ease-in-out ${j * 0.2}s infinite` }} />)}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
              {messages.length <= 2 && !hitLimit && (
                <div style={{ padding: "0 20px 16px", display: "flex", gap: 8, flexWrap: "wrap" }} className="hide-mobile">
                  {["Best fishing spots near me right now", "What should I be hunting this week?", "How's the weather for hunting today?", `What license do I need in ${selectedState || "my state"}?`].map((s, i) => (
                    <button key={i} onClick={() => sendMessage(s)} className="btn-ghost" style={{ padding: "7px 14px", fontSize: 12, borderRadius: 20 }}>{s}</button>
                  ))}
                </div>
              )}
              {hitLimit && (
                <div style={{ margin: "0 20px 20px", background: "linear-gradient(160deg, #0d1a0d 0%, #080c08 60%)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, overflow: "hidden", position: "relative" }}>
                  <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 260, height: 120, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(232,176,32,0.18) 0%, transparent 70%)", filter: "blur(20px)", pointerEvents: "none" }} />
                  <div style={{ padding: "32px 24px 20px", textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 26, color: "#f4f4f0", marginBottom: 8, lineHeight: 1.2, fontWeight: 900 }}>Every season.<br />Every state.<br /><span style={{ color: "#e8b020" }}>Every question.</span></div>
                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>You've used your 10 free messages —<br />Ravlin is clearly working for you 🎯</div>
                  </div>
                  <div style={{ margin: "0 24px 16px", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)" }} />
                  <div style={{ padding: "0 20px 16px" }}>
                    {["Unlimited hunting & fishing assistant", "Personalized trip planner", "Harvest log", "Unlimited private map pins", "Pro profile badge", "All future features"].map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(232,176,32,0.15)", border: "1px solid rgba(232,176,32,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ color: "#e8b020", fontSize: 10, fontWeight: 700 }}>✓</span>
                        </div>
                        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "8px 20px 28px", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ textAlign: "center", marginBottom: 4 }}>
                      <span style={{ color: "rgba(232,176,32,0.7)", fontSize: 12, fontWeight: 600 }}>Less than $2/month</span>
                    </div>
                    <button onClick={() => openPricingModal()} style={{ width: "100%", padding: "14px", fontSize: 15, fontWeight: 700, borderRadius: 14, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #e8b020, #c8940a)", color: "#000", position: "relative", overflow: "hidden", transition: "all 0.2s", boxShadow: "0 4px 20px rgba(232,176,32,0.4)" }}
                      onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "0 6px 28px rgba(232,176,32,0.6)"; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(232,176,32,0.4)"; }}
                      onMouseDown={e => e.currentTarget.style.transform = "scale(0.98)"}
                      onMouseUp={e => e.currentTarget.style.transform = "scale(1.02)"}>
                      Choose Your Plan →
                    </button>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.18)", textAlign: "center" }}>Cancel anytime · Secure payment via Stripe</div>
                  </div>
                </div>
              )}
              {!hitLimit && (
                <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, alignItems: "center" }}>
                  <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()}
                    placeholder={`Ask anything...`}
                    style={{ flex: 1, padding: "13px 18px", borderRadius: "var(--radius-sm)", fontSize: 14 }} />
                  <button onClick={() => sendMessage()} style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #78b450, #4a8a2a)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 16px rgba(120,180,80,0.35)", transition: "transform 0.15s" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "weather" && (
          <Suspense fallback={<div style={{ minHeight: 200 }} />}>
            <div className="fade-in">
              <WeatherWidget selectedState={selectedState} weather={weather} setWeather={setWeather} locationName={locationName} setLocationName={setLocationName} />
            </div>
          </Suspense>
        )}

        {mapMounted && (
          <div style={{ display: tab === "map" ? "block" : "none" }} ref={el => { if (el && tab === "map") setTimeout(() => window.dispatchEvent(new Event('resize')), 100); }}>
            <Suspense fallback={null}>
              <MapTab selectedState={selectedState} user={user} isPro={isPro} onSharePin={(pin) => { window._sharePinToComm = pin; setTab("community"); }} weatherOverride={weather} locationNameOverride={locationName} />
            </Suspense>
          </div>
        )}

        {tab === "regs" && <Suspense fallback={<div style={{ minHeight: 200 }} />}><div className="tab-fade"><RegulationsTab selectedState={selectedState} currentUser={user} /></div></Suspense>}
        {tab === "licenses" && <Suspense fallback={<div style={{ minHeight: 200 }} />}><div className="tab-fade"><LicensesTab selectedState={selectedState} /></div></Suspense>}
        {tab === "trip" && <Suspense fallback={<div style={{ minHeight: 200 }} />}><div className="tab-fade"><TripPlannerTab selectedState={selectedState} user={user} isPro={isPro} hitLimit={hitLimit} messageCount={messageCount} setMessageCount={setMessageCount} isGuest={isGuest} onUpgrade={() => { if (!user || isGuest) { openSignIn(); return; } openPricingModal(); }} /></div></Suspense>}
        {tab === "species" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ textAlign: "center", paddingTop: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", color: "var(--green)", textTransform: "uppercase", marginBottom: 4 }}>{selectedState || "Species"}</div>
              <div style={{ color: "var(--text)", fontWeight: 800, fontSize: 28, fontFamily: "var(--font-display)", letterSpacing: "-0.3px", lineHeight: 1 }}>Species Guide</div>
              <div style={{ color: "var(--text3)", fontSize: 12, marginTop: 5 }}>Tap any species to get guided tips</div>
            </div>
            {!selectedState ? (
              <div className="card" style={{ padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
                <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Select Your State</div>
                <div style={{ color: "var(--text2)", fontSize: 14 }}>Choose your state to see available species.</div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", background: "#0e160e", border: "1px solid #192019", borderRadius: 14, padding: 3 }}>
                  {[["all", "All", <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>], ["hunting", "Hunting", <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="22" x2="18" y1="12" y2="12" /><line x1="6" x2="2" y1="12" y2="12" /><line x1="12" x2="12" y1="6" y2="2" /><line x1="12" x2="12" y1="22" y2="18" /></svg>], ["fishing", "Fishing", <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="m17.586 11.414-5.93 5.93a1 1 0 0 1-8-8l3.137-3.137a.707.707 0 0 1 1.207.5V10" /><path d="M20.414 8.586 22 7" /><circle cx="19" cy="10" r="2" /></svg>]].map(([val, label, icon]) => {
                    const active = speciesFilter === val;
                    return <button key={val} onClick={() => setSpeciesFilter(val)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 0", fontSize: 11, fontWeight: 700, borderRadius: 11, border: "none", cursor: "pointer", transition: "all 0.2s", background: active ? "linear-gradient(135deg,#2d5a1b,#1e4010)" : "transparent", color: active ? "white" : "#4a6a4a", boxShadow: active ? "0 2px 8px rgba(45,90,27,0.5)" : "none", fontFamily: "var(--font-body)" }}>{icon}{label}</button>;
                  })}
                </div>
                {loadingStateSpecies && (
                  <div style={{ textAlign: "center", padding: 40, color: "var(--text3)", fontSize: 14 }} className="pulse">Loading {selectedState} species...</div>
                )}
                {!loadingStateSpecies && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {(stateSpecies.length > 0 ? stateSpecies : SPECIES)
                      .filter(s => speciesFilter === "all" || s.type === speciesFilter)
                      .map(s => (
                        <button key={s.name} onClick={() => { sendMessage(`Give me a complete guide for ${s.name} — best tactics, gear, timing, and ${selectedState ? selectedState + " specific " : ""}tips.`); setTab("chat"); }} style={{ padding: "16px 8px", textAlign: "center", cursor: "pointer", background: "#0e1510", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                          <div style={{ fontSize: 28 }}>{SPECIES_ICONS[s.name] || (s.type === "hunting" ? "🦌" : "🐟")}</div>
                          <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 11, lineHeight: 1.3 }}>{s.name}</div>
                          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", padding: "2px 7px", borderRadius: 20, background: s.type === "hunting" ? "rgba(212,147,10,0.15)" : "rgba(80,140,220,0.12)", color: s.type === "hunting" ? "var(--amber)" : "#7ab0e0" }}>{s.type.toUpperCase()}</span>
                        </button>
                      ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === "gear" && (
          <div className="fade-in">
            {!selectedChecklist ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
                {Object.entries(GEAR_CHECKLISTS).map(([k, v]) => (
                  <button key={k} onClick={() => setSelectedChecklist(k)} className="card" style={{ padding: "22px 16px", textAlign: "center", cursor: "pointer", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>{v.icon}</div>
                    <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{k}</div>
                    <div style={{ color: "var(--text3)", fontSize: 12 }}>{v.items.length} items</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="fade-in">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 24 }}>{GEAR_CHECKLISTS[selectedChecklist].icon}</span>
                    <h3 style={{ color: "var(--text)", fontSize: 18, fontFamily: "var(--font-display)" }}>{selectedChecklist}</h3>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setCheckedItems({})} className="btn-ghost" style={{ padding: "7px 14px", fontSize: 12 }}>Reset</button>
                    <button onClick={() => setSelectedChecklist(null)} className="btn-ghost" style={{ padding: "7px 14px", fontSize: 12, transition: "transform 0.15s" }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>← Back</button>
                  </div>
                </div>
                <div style={{ color: "var(--text3)", fontSize: 12, marginBottom: 14 }}>{Object.values(checkedItems).filter(Boolean).length} / {GEAR_CHECKLISTS[selectedChecklist].items.length} packed</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {GEAR_CHECKLISTS[selectedChecklist].items.map((item, i) => {
                    const k = `${selectedChecklist}::${item}`; const checked = checkedItems[k];
                    return (
                      <div key={i} onClick={() => toggleCheck(selectedChecklist, item)} className={`checklist-item ${checked ? "checked" : ""}`}>
                        <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${checked ? "var(--green)" : "rgba(255,255,255,0.15)"}`, background: checked ? "var(--green)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                          {checked && <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>✓</span>}
                        </div>
                        {item}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "more" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ padding: "14px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ color: "var(--text2)", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>Your State</div>
              {detectingLocation && !selectedState ? (
                <div style={{ flex: 1, padding: "8px 12px", fontSize: 14, color: "var(--text3)", fontStyle: "italic" }}>Detecting location...</div>
              ) : (
                <select value={selectedState} onChange={e => setSelectedState(e.target.value)} style={{ flex: 1, padding: "8px 12px", borderRadius: "var(--radius-sm)", fontSize: 14 }}>
                  <option value="">Select state...</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
            </div>
            <div style={{ color: "var(--text3)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4 }}>TOOLS & FEATURES</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { id: "species", label: "Species", desc: "Hunting & fishing guides", accent: "#1a5c1a", color: "#4ade80", svg: <PawPrint size={22} /> },
                { id: "regs", label: "Regulations", desc: "State-specific rules", accent: "#0f2a5c", color: "#3b82f6", svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg> },
                { id: "trip", label: "Trip Planner", desc: "Personalized plans", accent: "#2a0a5c", color: "#a855f7", svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> },
                { id: "gear", label: "Gear", desc: "Pack checklists", accent: "#5c2a0a", color: "#f97316", svg: <Package size={22} /> },
                { id: "licenses", label: "Licenses", desc: "Buy state licenses", accent: "#1a4a0a", color: "#84cc16", svg: <IdCard size={22} /> },
                { id: "harvest", label: "Harvest Log", desc: "Track your catches", accent: "#5c0a2a", color: "#f43f5e", svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg> },
                { id: "trophy", label: "Trophies", desc: "Community verified harvests", accent: "#4a2a00", color: "#f59e0b", svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2z" /></svg> },
                { id: "ballistics", label: "Ballistics", desc: "Bullet drop calculator", accent: "#5c1a1a", color: "#ef4444", svg: <Crosshair size={22} /> },
                { id: "weather", label: "Weather", desc: "Live conditions", accent: "#0a3a5c", color: "#06b6d4", svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="M20 12h2" /><path d="m19.07 4.93-1.41 1.41" /><path d="M15.947 12.650a4 4 0 0 0-5.925-4.128" /><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6z" /></svg> },
                { id: "about", label: "About", desc: "App info & account", accent: "#3a2a1a", color: "#d4a574", svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg> },
                ...(user?.id === "user_3CKoCuA9KUvrtfrJ3ia3Bm2BH1a" ? [{ id: "admin", label: "Admin", desc: "Manage reports", accent: "#3a1a1a", color: "#d44a4a", svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg> }] : []),
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} className="more-btn" style={{ padding: "16px", textAlign: "left", cursor: "pointer", border: "1px solid #1a2a1a", borderRadius: 16, background: "linear-gradient(135deg, #0d140d, #101810)", display: "flex", alignItems: "center", gap: 14, minHeight: 80 }}>
                  <div className="more-icon" style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${t.accent}cc, ${t.accent}66)`, border: `1px solid ${t.accent}44`, display: "flex", alignItems: "center", justifyContent: "center", color: t.color, flexShrink: 0, transition: "transform 0.15s, box-shadow 0.15s" }}>
                    {t.svg}
                  </div>
                  <div>
                    <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 13 }}>{t.label}</div>
                    
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === "admin" && user?.id === "user_3CKoCuA9KUvrtfrJ3ia3Bm2BH1a" && <Suspense fallback={<div style={{ minHeight: 200 }} />}><div className="tab-fade"><AdminTab user={user} /></div></Suspense>}
        {tab === "harvest" && <Suspense fallback={<div style={{ minHeight: 200 }} />}><div className="tab-fade"><HarvestLogTab user={user} openSignIn={openSignIn} isPro={isPro} openPricingModal={openPricingModal} /></div></Suspense>}
        {tab === "ballistics" && <Suspense fallback={<div style={{ minHeight: 200 }} />}><div className="tab-fade"><BallisticsTab /></div></Suspense>}
        {tab === "trophy" && <Suspense fallback={<div style={{ minHeight: 200 }} />}><div className="tab-fade"><TrophyBoardTab user={user} openSignIn={openSignIn} selectedState={selectedState} /></div></Suspense>}
        {tab === "community" && <Suspense fallback={<div style={{ minHeight: 200 }} />}><div className="tab-fade"><CommunityTab selectedState={selectedState} user={user} openSignIn={openSignIn} externalSetUnread={setMessagesUnread} externalSetNotifUnread={setNotifUnread} isGuest={isGuest} initialMessageUserId={window._openMessageThread || null} /></div></Suspense>}
        {tab === "about" && (
          <div className="fade-in card" style={{ padding: 32 }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <img src="/logo.png" style={{ width: 88, height: 88, objectFit: "cover", borderRadius: 20, marginBottom: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.5)" }} />
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--text)", marginBottom: 8 }}>Ravlin</h2>
              <p style={{ color: "var(--green)", fontSize: 14, fontWeight: 500 }}>Built for hunters & anglers, by outdoorsmen</p>
            </div>
            <div style={{ color: "var(--text2)", fontSize: 15, lineHeight: 1.85, display: "flex", flexDirection: "column", gap: 16 }}>
              <p>Ravlin is an personalized hunting and fishing assistant designed to give you the kind of advice you'd get from a seasoned outdoorsman — specific, practical, and straight to the point.</p>
              <p>Whether you're planning your first elk hunt, figuring out what flies are working on your local river, or need to know the regulations for a new state, Ravlin has you covered.</p>
              <div style={{ padding: "16px 20px", background: "var(--amber-dim)", border: "1px solid rgba(212,147,10,0.2)", borderRadius: "var(--radius-sm)" }}>
                <p style={{ color: "rgba(212,147,10,0.9)", fontSize: 13, margin: 0 }}>Always verify current regulations with your state wildlife agency. Regulations change and Ravlin's information may not always be current.</p>
              </div>
            </div>
            <div style={{ marginTop: 28, paddingTop: 28, borderTop: "1px solid var(--border)" }}>
              {isPro && (
                <div style={{ marginTop: 16 }}>
                  <button className="btn-ghost" style={{ padding: "10px 20px", fontSize: 13 }} onClick={async () => {
                    const customerId = user?.publicMetadata?.stripeCustomerId;
                    const res = await fetch("https://wildai-server.onrender.com/customer-portal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerId }) });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                  }}>Manage Subscription →</button>
                </div>
              )}
              <button onClick={onTerms} className="btn-ghost" style={{ padding: "10px 20px", fontSize: 13 }}>View Terms & Conditions →</button>
            </div>
          </div>
        )}
      </div>

      <footer style={{ borderTop: "1px solid var(--border)", padding: "14px 20px", textAlign: "center", position: "relative", zIndex: 1, display: "none" }}>
        <span style={{ color: "var(--text3)", fontSize: 11 }}>Ravlin · Powered by AI · Always verify regulations with your state agency</span>
      </footer>
    </div>
  );
}
