import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";


export default function AdminTab({ user }) {
  const [reports, setReports] = useState([]);
  const [posts, setPosts] = useState({});
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [banning, setBanning] = useState(null);
  const [reportedUsers, setReportedUsers] = useState([]);
  const [adminTab, setAdminTab] = useState("posts");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [
        { count: userCount },
        { count: postCount },
        { count: commentCount },
        { count: likeCount },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("posts").select("*", { count: "exact", head: true }),
        supabase.from("comments").select("*", { count: "exact", head: true }),
        supabase.from("likes").select("*", { count: "exact", head: true }),
      ]);
      let stripeStats = null;
      try {
        const res = await fetch("https://wildai-server.onrender.com/admin/stats", { headers: { "x-admin-key": "somethinglong123" } });
        if (res.ok) stripeStats = await res.json();
      } catch { }
      setStats({ userCount, postCount, commentCount, likeCount, ...stripeStats });
      const { data: reportData } = await supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(50);
      if (reportData?.length) {
        const postIds = [...new Set(reportData.map(r => r.post_id))];
        const { data: postData } = await supabase.from("posts").select("*").in("id", postIds);
        const postMap = {};
        (postData || []).forEach(p => postMap[p.id] = p);
        setPosts(postMap);
      }
      setReports(reportData || []);
      const { data: userReports } = await supabase.from("reported_users").select("*").order("created_at", { ascending: false });
      const grouped = {};
      (userReports || []).forEach(r => {
        if (!grouped[r.user_id]) grouped[r.user_id] = { user_id: r.user_id, count: 0, latest: r.created_at };
        grouped[r.user_id].count += 1;
      });
      setReportedUsers(Object.values(grouped).sort((a, b) => b.count - a.count));
      setLoading(false);
    };
    load();
  }, []);

  const deletePost = async (postId) => {
    if (!window.confirm("Delete this post and all its reports?")) return;
    setDeleting(postId);
    await supabase.from("posts").delete().eq("id", postId);
    await supabase.from("reports").delete().eq("post_id", postId);
    setReports(prev => prev.filter(r => r.post_id !== postId));
    setPosts(prev => { const n = { ...prev }; delete n[postId]; return n; });
    setDeleting(null);
  };

  const dismissReport = async (postId) => {
    await supabase.from("reports").delete().eq("post_id", postId);
    setReports(prev => prev.filter(r => r.post_id !== postId));
  };

  const uniquePostIds = [...new Set(reports.map(r => r.post_id))];

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 18, fontFamily: "var(--font-display)" }}>⚙️ Admin</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setAdminTab("stats")} className={`nav-tab ${adminTab === "stats" ? "active" : "inactive"}`} style={{ padding: "7px 18px", fontSize: 13 }}>📊 Stats</button>
        <button onClick={() => setAdminTab("posts")} className={`nav-tab ${adminTab === "posts" ? "active" : "inactive"}`} style={{ padding: "7px 18px", fontSize: 13 }}>Reported Posts ({uniquePostIds.length})</button>
        <button onClick={() => setAdminTab("users")} className={`nav-tab ${adminTab === "users" ? "active" : "inactive"}`} style={{ padding: "7px 18px", fontSize: 13 }}>Reported Users ({reportedUsers.length})</button>
      </div>
      {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--text3)" }} className="pulse">Loading...</div>}
      {!loading && adminTab === "users" && reportedUsers.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text3)", fontSize: 14 }}>No reported users</div>
      )}
      {!loading && adminTab === "users" && reportedUsers.map(ru => (
        <div key={ru.user_id} className="card" style={{ padding: 16, border: "1px solid rgba(255,100,100,0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "rgba(255,100,100,0.8)", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>🚩 {ru.count} REPORT{ru.count > 1 ? "S" : ""}</div>
              <div style={{ color: "var(--text2)", fontSize: 12, fontFamily: "monospace" }}>{ru.user_id}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={async () => {
                await supabase.from("reported_users").delete().eq("user_id", ru.user_id);
                setReportedUsers(prev => prev.filter(u => u.user_id !== ru.user_id));
              }} className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}>Dismiss</button>
              <button onClick={async () => {
                if (!window.confirm(`Ban this user? This will delete all their posts.`)) return;
                await supabase.from("banned_users").upsert({ user_id: ru.user_id, reason: "Admin ban" });
                await supabase.from("posts").delete().eq("user_id", ru.user_id);
                await supabase.from("reported_users").delete().eq("user_id", ru.user_id);
                setReportedUsers(prev => prev.filter(u => u.user_id !== ru.user_id));
              }} style={{ background: "rgba(255,50,50,0.2)", border: "1px solid rgba(255,50,50,0.5)", color: "rgba(255,80,80,1)", padding: "6px 12px", borderRadius: "var(--radius-sm)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 700 }}>Ban User</button>
            </div>
          </div>
        </div>
      ))}
      {adminTab === "stats" && stats && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "Total Users", value: stats.clerkUserCount ?? stats.userCount, icon: "👤", color: "#38bdf8" },
            { label: "Total Posts", value: stats.postCount, icon: "📸", color: "var(--green)" },
            { label: "Total Comments", value: stats.commentCount, icon: "💬", color: "#a78bfa" },
            { label: "Total Likes", value: stats.likeCount, icon: "❤️", color: "#f43f5e" },
            { label: "Pro Subscribers", value: stats.proCount ?? "—", icon: "⚡", color: "#fbbf24" },
            { label: "MRR", value: stats.mrr ? `$${(stats.mrr / 100).toFixed(2)}` : "—", icon: "💰", color: "#4ade80" },
          ].map(({ label, value, icon, color }) => (
            <div key={label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "16px 20px" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
              <div style={{ color, fontWeight: 700, fontSize: 22, fontFamily: "var(--font-display)" }}>{value}</div>
              <div style={{ color: "var(--text3)", fontSize: 12, marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      )}
      {!loading && adminTab === "posts" && uniquePostIds.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text3)", fontSize: 14 }}>No reported posts</div>
      )}
      {adminTab === "posts" && uniquePostIds.map(postId => {
        const post = posts[postId];
        const postReports = reports.filter(r => r.post_id === postId);
        return (
          <div key={postId} className="card" style={{ padding: 16, border: "1px solid rgba(255,100,100,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ color: "rgba(255,100,100,0.8)", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>🚩 {postReports.length} REPORT{postReports.length > 1 ? "S" : ""}</div>
                <div style={{ color: "var(--text)", fontWeight: 600, fontSize: 14 }}>{post?.username || "Unknown"} · {post?.state}</div>
                <div style={{ color: "var(--text3)", fontSize: 11 }}>{post ? new Date(post.created_at).toLocaleDateString() : postId}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => dismissReport(postId)} className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}>Dismiss</button>
                <button onClick={() => deletePost(postId)} disabled={deleting === postId} style={{ background: "rgba(255,100,100,0.15)", border: "1px solid rgba(255,100,100,0.4)", color: "rgba(255,100,100,0.9)", padding: "6px 12px", borderRadius: "var(--radius-sm)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)" }}>
                  {deleting === postId ? "Deleting..." : "Delete Post"}
                </button>
                <button onClick={async () => {
                  const post = posts[postId];
                  if (!post?.user_id) return;
                  if (!window.confirm(`Ban ${post.username}? This will delete all their posts and reports.`)) return;
                  setBanning(postId);
                  await supabase.from("banned_users").upsert({ user_id: post.user_id, username: post.username, reason: "Admin ban" });
                  await supabase.from("posts").delete().eq("user_id", post.user_id);
                  await supabase.from("reports").delete().eq("post_id", postId);
                  setReports(prev => prev.filter(r => r.post_id !== postId));
                  setPosts(prev => { const n = { ...prev }; delete n[postId]; return n; });
                  setBanning(null);
                }} disabled={banning === postId} style={{ background: "rgba(255,50,50,0.2)", border: "1px solid rgba(255,50,50,0.5)", color: "rgba(255,80,80,1)", padding: "6px 12px", borderRadius: "var(--radius-sm)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 700 }}>
                  {banning === postId ? "Banning..." : "Ban User"}
                </button>
              </div>
            </div>
            {post?.photo && <img src={post.photo} style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: "var(--radius-sm)", marginBottom: 8 }} />}
            {post?.caption && <p style={{ color: "var(--text2)", fontSize: 13, margin: "0 0 8px" }}>{post.caption}</p>}
            <div style={{ color: "var(--text3)", fontSize: 11 }}>Reason: {postReports.map(r => r.reason).join(", ")}</div>
          </div>
        );
      })}
    </div>
  );
}
