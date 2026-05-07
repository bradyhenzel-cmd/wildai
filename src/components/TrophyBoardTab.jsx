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
      <div style={{ background: "linear-gradient(135deg, rgba(212,147,10,0.12), rgba(180,120,5,0.06))", border: "1px solid rgba(212,147,10,0.2)", borderRadius: "var(--radius)", padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 24 }}>🏆</span>
          <span style={{ color: "var(--text)", fontWeight: 700, fontSize: 20, fontFamily: "var(--font-display)" }}>Trophy Board</span>
        </div>
        <div style={{ color: "var(--text3)", fontSize: 12, marginBottom: 14 }}>Community-verified harvests — upvote to confirm legit catches</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button onClick={() => setFilter("all")} className={`nav-tab ${filter === "all" ? "active" : "inactive"}`} style={{ padding: "4px 12px", fontSize: 11 }}>All States</button>
          {selectedState && <button onClick={() => setFilter(selectedState)} className={`nav-tab ${filter === selectedState ? "active" : "inactive"}`} style={{ padding: "4px 12px", fontSize: 11 }}>📍 {selectedState}</button>}
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <button onClick={() => setTypeFilter("all")} className={`nav-tab ${typeFilter === "all" ? "active" : "inactive"}`} style={{ padding: "4px 12px", fontSize: 11 }}>All</button>
            <button onClick={() => setTypeFilter("hunting")} className={`nav-tab ${typeFilter === "hunting" ? "active" : "inactive"}`} style={{ padding: "4px 12px", fontSize: 11 }}>🎯</button>
            <button onClick={() => setTypeFilter("fishing")} className={`nav-tab ${typeFilter === "fishing" ? "active" : "inactive"}`} style={{ padding: "4px 12px", fontSize: 11 }}>🎣</button>
          </div>
        </div>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--text3)" }} className="pulse">Loading trophy board...</div>}

      {!loading && entries.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text3)", fontSize: 14 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
          <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No trophies yet</div>
          <div style={{ fontSize: 13 }}>Submit a harvest from your Harvest Log to get on the board!</div>
        </div>
      )}

      {sortedEntries.map((e, i) => {
        const votes = voteCounts[e.id] || 0;
        const isVoted = votedIds.has(e.id);
        const isOwn = user?.id === e.user_id;
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
        return (
          <div key={e.id} className="card fade-in" style={{ padding: 0, overflow: "hidden", border: i < 3 ? "1px solid rgba(212,147,10,0.25)" : "1px solid var(--border)" }}>
            {i < 3 && <div style={{ background: "linear-gradient(90deg, rgba(212,147,10,0.12), transparent)", padding: "5px 14px", fontSize: 11, color: "var(--amber)", fontWeight: 700, letterSpacing: "0.05em" }}>{medal} #{i + 1} MOST VERIFIED</div>}
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
                    <button onClick={() => toggleVote(e.id)} style={{ display: "flex", alignItems: "center", gap: 6, background: isVoted ? "rgba(120,180,80,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${isVoted ? "var(--border-accent)" : "var(--border)"}`, borderRadius: "var(--radius-sm)", padding: "6px 14px", cursor: "pointer", color: isVoted ? "var(--green)" : "var(--text3)", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, transition: "all 0.15s" }}>
                      👍 {isVoted ? "Vouched" : "Vouch"} {votes > 0 && <span style={{ background: isVoted ? "var(--green-dim)" : "rgba(255,255,255,0.06)", padding: "1px 8px", borderRadius: 20, fontSize: 11 }}>{votes}</span>}
                    </button>
                    <button onClick={async () => {
                      if (!user) { openSignIn(); return; }
                      await supabase.from("reports").insert({ post_id: e.id, user_id: user.id, reason: "trophy_fake" });
                      toast("Thanks for reporting — we'll review this entry.", "success");
                    }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", fontSize: 12, padding: "4px 8px", fontFamily: "var(--font-body)" }}>🚩</button>
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
