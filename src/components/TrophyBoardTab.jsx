import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { capName, toast } from "../utils";

export default function TrophyBoardTab({ user, openSignIn, selectedState }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votedIds, setVotedIds] = useState(new Set());
  const [voteCounts, setVoteCounts] = useState({});
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const loadEntries = async () => {
    setLoading(true);
    let query = supabase.from("trophy_board").select("*").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("state", filter);
    if (typeFilter !== "all") query = query.eq("species", typeFilter);
    const { data } = await query.limit(50);
    setEntries(data || []);
    if (data?.length) {
      const ids = data.map(e => e.id);
      const { data: voteData } = await supabase.from("trophy_votes").select("trophy_id, user_id").in("trophy_id", ids);
      if (voteData) {
        const counts = {};
        ids.forEach(id => counts[id] = 0);
        voteData.forEach(v => { counts[v.trophy_id] = (counts[v.trophy_id] || 0) + 1; });
        setVoteCounts(counts);
        if (user) setVotedIds(new Set(voteData.filter(v => v.user_id === user.id).map(v => v.trophy_id)));
      }
    }
    setLoading(false);
  };

  useEffect(() => { loadEntries(); }, [filter, typeFilter]);

  const toggleVote = async (id) => {
    if (!user) { openSignIn(); return; }
    if (votedIds.has(id)) {
      await supabase.from("trophy_votes").delete().eq("trophy_id", id).eq("user_id", user.id);
      setVotedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      setVoteCounts(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 1) - 1) }));
    } else {
      await supabase.from("trophy_votes").insert({ trophy_id: id, user_id: user.id });
      setVotedIds(prev => new Set([...prev, id]));
      setVoteCounts(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    }
  };

  const deleteEntry = async (id) => {
    await supabase.from("trophy_board").delete().eq("id", id);
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const sortedEntries = [...entries].sort((a, b) => (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0));

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ background: "linear-gradient(160deg, #0c1c0c 0%, #071007 100%)", border: "1px solid rgba(139,195,74,0.15)", borderTop: "1px solid rgba(139,195,74,0.25)", borderRadius: 16, padding: "16px 18px", boxShadow: "0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(212,147,10,0.1)", border: "1px solid rgba(212,147,10,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(212,147,10,0.9)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>
          </div>
          <div>
            <div style={{ color: "#ffffff", fontWeight: 800, fontSize: 18, fontFamily: "var(--font-display)", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>Trophy Board</div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 2 }}>Community-verified harvests</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {[["all", "All States"], selectedState ? [selectedState, selectedState] : null].filter(Boolean).map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)} style={{ padding: "6px 14px", fontSize: 11, fontWeight: 700, borderRadius: 20, border: `1px solid ${filter === val ? "rgba(139,195,74,0.5)" : "rgba(255,255,255,0.08)"}`, background: filter === val ? "rgba(139,195,74,0.15)" : "rgba(255,255,255,0.04)", color: filter === val ? "var(--green)" : "rgba(255,255,255,0.4)", cursor: "pointer", fontFamily: "var(--font-body)" }}>{label}</button>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {[["all", "All"], ["hunting", <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/></svg>], ["fishing", <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="m17.586 11.414-5.93 5.93a1 1 0 0 1-8-8l3.137-3.137a.707.707 0 0 1 1.207.5V10"/><path d="M20.414 8.586 22 7"/><circle cx="19" cy="10" r="2"/></svg>]].map(([val, label]) => (
              <button key={val} onClick={() => setTypeFilter(val)} style={{ width: 32, height: 32, borderRadius: 10, border: `1px solid ${typeFilter === val ? "rgba(139,195,74,0.5)" : "rgba(255,255,255,0.08)"}`, background: typeFilter === val ? "rgba(139,195,74,0.15)" : "rgba(255,255,255,0.04)", color: typeFilter === val ? "var(--green)" : "rgba(255,255,255,0.4)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--text3)" }} className="pulse">Loading trophy board...</div>}

      {!loading && entries.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text3)", fontSize: 14 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>
          <div style={{ color: "#ffffff", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No trophies yet</div>
          <div style={{ fontSize: 13 }}>Submit a harvest from your Harvest Log to get on the board!</div>
        </div>
      )}

      {sortedEntries.map((e, i) => {
        const votes = voteCounts[e.id] || 0;
        const isVoted = votedIds.has(e.id);
        const isOwn = user?.id === e.user_id;
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
        return (
          <div key={e.id} className="fade-in" style={{ padding: 0, overflow: "hidden", background: "linear-gradient(160deg, #0c1c0c 0%, #071007 100%)", border: i < 3 ? "1px solid rgba(212,147,10,0.25)" : "1px solid rgba(139,195,74,0.1)", borderTop: i < 3 ? "1px solid rgba(212,147,10,0.35)" : "1px solid rgba(139,195,74,0.18)", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)" }}>
            {i < 3 && <div style={{ background: "linear-gradient(90deg, rgba(212,147,10,0.1), transparent)", padding: "6px 16px", fontSize: 10, color: "rgba(212,147,10,0.8)", fontWeight: 700, letterSpacing: "0.08em" }}>{medal} #{i + 1} MOST VERIFIED</div>}
            {e.photo && <img src={e.photo} style={{ width: "100%", maxHeight: 420, objectFit: "contain", background: "rgba(0,0,0,0.3)" }} />}
            <div style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <span style={{ color: "var(--text)", fontWeight: 700, fontSize: 15 }}>{e.species}</span>
                  <span style={{ color: "var(--text3)", fontSize: 12, marginLeft: 8 }}>{capName(e.username)}</span>
                  {e.state && <span style={{ color: "var(--text3)", fontSize: 12, marginLeft: 8 }}>· {e.state}</span>}
                </div>
                {isOwn && <button onClick={() => deleteEntry(e.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,100,100,0.5)", fontSize: 12, padding: 0, fontFamily: "var(--font-body)" }}>Delete</button>}
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                {e.weight && <span style={{ color: "var(--text2)", fontSize: 12 }}>⚖️ {e.weight} lbs</span>}
                {e.size && <span style={{ color: "var(--text2)", fontSize: 12 }}>📏 {e.size}</span>}
                {e.location && <span style={{ color: "var(--text2)", fontSize: 12 }}>📍 {e.location}</span>}
                {e.date && <span style={{ color: "var(--text3)", fontSize: 12 }}>{new Date(e.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
              </div>
              {e.notes && <p style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.6, margin: "0 0 10px" }}>{e.notes}</p>}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {!isOwn ? (
                  <>
                    <button onClick={() => toggleVote(e.id)} style={{ display: "flex", alignItems: "center", gap: 6, background: isVoted ? "rgba(139,195,74,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${isVoted ? "rgba(139,195,74,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: 10, padding: "7px 14px", cursor: "pointer", color: isVoted ? "var(--green)" : "rgba(255,255,255,0.4)", fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, transition: "all 0.15s" }}>
                      {isVoted ? "Vouched" : "Vouch"} {votes > 0 && <span style={{ background: isVoted ? "rgba(139,195,74,0.15)" : "rgba(255,255,255,0.06)", padding: "1px 8px", borderRadius: 20, fontSize: 11 }}>{votes}</span>}
                    </button>
                    <button onClick={async () => {
                      if (!user) { openSignIn(); return; }
                      await supabase.from("reports").insert({ post_id: e.id, user_id: user.id, reason: "trophy_fake" });
                      toast("Thanks for reporting — we'll review this entry.", "success");
                    }} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.2)", fontSize: 12, padding: "4px 8px", fontFamily: "var(--font-body)" }}>Report</button>
                  </>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text3)", fontSize: 12 }}>
                    👍 {votes} {votes === 1 ? "vouch" : "vouches"}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
