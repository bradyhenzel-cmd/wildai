import React, { useState } from "react";
import { capName, avatarColor, toast } from "../utils";

export default function HotspotsTab({ posts, loading, user, selectedState, savedPinIds, saveToMap, openSignIn }) {
  const [filter, setFilter] = useState("all");
  const [userCoords, setUserCoords] = useState(null);
  const [locating, setLocating] = useState(false);

  const hotspots = posts.filter(p => p.lat && p.lng);

  const getDistance = (lat1, lng1, lat2, lng2) => {
    const R = 3958.8;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const handleNearMe = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(pos => {
      setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setFilter("nearme");
      setLocating(false);
    }, () => { toast("Couldn't get your location.", "error"); setLocating(false); });
  };

  const filtered = hotspots
    .filter(p => filter === "state" ? p.state === selectedState : true)
    .map(p => ({ ...p, distance: userCoords ? getDistance(userCoords.lat, userCoords.lng, p.lat, p.lng) : null }))
    .sort((a, b) => filter === "nearme" && a.distance != null ? a.distance - b.distance : new Date(b.created_at) - new Date(a.created_at));

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => {
          if (filter === "all" && selectedState) { setFilter("state"); }
          else if (filter === "state" || (filter === "all" && !selectedState)) { handleNearMe(); }
          else { setFilter("all"); }
        }}
          style={{
            padding: "8px 18px", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "1px solid", transition: "all 0.2s",
            background: filter !== "all" ? "linear-gradient(135deg, #2d5a1b, #1e4010)" : "#0e160e",
            borderColor: filter !== "all" ? "#3d7a25" : "#1c2a1c",
            color: filter !== "all" ? "white" : "#4a6a4a",
            boxShadow: filter !== "all" ? "0 4px 16px rgba(45,90,27,0.35)" : "none"
          }}>
          {filter === "all" ? "All" : filter === "state" ? `📍 ${selectedState}` : locating ? "Locating..." : "📡 Near Me"}
        </button>
      </div>
      {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--text3)", fontSize: 14 }} className="pulse">Loading hotspots...</div>}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text3)", fontSize: 14 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📍</div>
          <div style={{ color: "var(--text)", fontWeight: 600, marginBottom: 6 }}>No hotspots yet</div>
          Posts with a location show up here
        </div>
      )}
      {filtered.map(post => (
        <div key={post.id} className="card fade-in" style={{ padding: 0, overflow: "hidden" }}>
          {post.photo && (
            <div style={{ position: "relative" }}>
              <img src={post.photo} style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }} />
              {post.species && (
                <div style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(8,20,8,0.82)", border: "1px solid var(--border-accent)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "4px 12px" }}>
                  <span style={{ color: "var(--green)", fontSize: 12, fontWeight: 700 }}>{post.species}</span>
                </div>
              )}
              {post.distance != null && (
                <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(8,20,8,0.82)", backdropFilter: "blur(8px)", border: "1px solid var(--border-accent)", borderRadius: 20, padding: "4px 10px" }}>
                  <span style={{ color: "var(--green)", fontSize: 12, fontWeight: 700 }}>{Math.round(post.distance)} mi</span>
                </div>
              )}
            </div>
          )}
          <div style={{ padding: "12px 14px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${avatarColor(post.username)[0]}, ${avatarColor(post.username)[1]})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white", flexShrink: 0 }}>{(post.username || "?")[0].toUpperCase()}</div>
              <span style={{ color: "var(--text)", fontWeight: 700, fontSize: 13 }}>{capName(post.username)}</span>
              {false && post.location && <span style={{ color: "var(--text3)", fontSize: 12 }}>· 📍 {post.location}</span>}
            </div>
            {post.caption && <p style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.5, margin: "0 0 10px" }}>{post.caption}</p>}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={() => saveToMap(post)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: savedPinIds.has(post.id) ? "rgba(120,180,80,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${savedPinIds.has(post.id) ? "var(--border-accent)" : "var(--border)"}`, color: savedPinIds.has(post.id) ? "var(--green)" : "var(--text2)", padding: "9px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.2s" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill={savedPinIds.has(post.id) ? "var(--green)" : "none"} stroke={savedPinIds.has(post.id) ? "var(--green)" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                {savedPinIds.has(post.id) ? "Saved" : "Save to Map"}
              </button>
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${post.lat},${post.lng}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--text2)", padding: "9px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, textDecoration: "none", transition: "all 0.2s", lineHeight: 1 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
                Directions
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
