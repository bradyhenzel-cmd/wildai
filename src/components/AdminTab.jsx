import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";

export function TermsPage({ onBack }) {
  const sections = [
    ["1. Acceptance of Terms", "By accessing or using Ravlin, you agree to be bound by these Terms and Conditions. Ravlin reserves the right to update these terms at any time, and continued use constitutes acceptance of any changes. You must be at least 13 years of age to use Ravlin. By using this service you represent that you are 13 years of age or older."],
    ["2. Nature of Service", "Ravlin is an AI-powered informational assistant for hunters and anglers. It is not a licensed guide, outfitter, or wildlife agency. All information is for general educational purposes only."],
    ["3. Regulatory Disclaimer", "Hunting and fishing regulations change frequently. Ravlin makes no guarantee that information on seasons, bag limits, or license requirements is current. You are solely responsible for verifying regulations with your state wildlife agency."],
    ["4. Accuracy of Information", "Ravlin strives to provide accurate information but may make errors or provide outdated advice. Always apply your own judgment and consult licensed professionals for decisions involving safety or legality."],
    ["5. Safety and Personal Responsibility", "Hunting and fishing involve inherent risks. Ravlin accepts no liability for any injury, death, or loss resulting from acting on information provided. Users engage in all outdoor activities at their own risk."],
    ["6. Free Tier and Paid Services", "Ravlin offers limited free messages per session. Additional use may require a paid subscription. Ravlin reserves the right to modify or discontinue any tier of service with reasonable notice."],
    ["7. User Conduct", "You agree not to use Ravlin to facilitate illegal hunting or fishing, poaching, or violations of wildlife protection laws. You agree not to post content that is illegal, threatening, harassing, defamatory, obscene, or otherwise objectionable. Ravlin may remove content and terminate access for users who violate these terms without prior notice."],
    ["8. User-Generated Content", "Ravlin hosts user-generated content including posts, photos, messages, and location pins. Ravlin is not responsible for the accuracy, legality, or appropriateness of user-generated content. By posting content, you grant Ravlin a non-exclusive license to display and distribute that content within the platform. You represent that you own or have the right to share any content you post. Ravlin reserves the right to remove any content at its sole discretion."],
    ["9. Community Guidelines", "Users must not post content depicting illegal take of wildlife, trespassing on private property, animal cruelty, or any activity that violates federal, state, or local law. Users must not impersonate other individuals or post private information about others without consent. Violation of community guidelines may result in immediate account termination."],
    ["10. Reporting and Moderation", "Ravlin provides a reporting mechanism for users to flag content that violates these terms. Ravlin reviews reported content and takes action at its discretion. Ravlin is not obligated to monitor all content but will act in good faith upon receiving reports. To report content, use the report button available on each post."],
    ["11. Private Messaging", "Ravlin provides a private messaging feature between users. Messages are stored securely and are not reviewed by Ravlin unless reported. Users are solely responsible for the content of their messages. Ravlin may access message content if required by law or to investigate reports of abuse."],
    ["12. Location Data", "Ravlin may request access to your device location to provide location-based features. Location data is used solely within the app and is not sold to third parties. Location pins you share publicly are visible to other users."],
    ["13. Intellectual Property", "All content, design, and functionality of Ravlin is protected by applicable intellectual property laws. Reproduction without express written permission is prohibited."],
    ["14. Limitation of Liability", "To the fullest extent permitted by law, Ravlin and its affiliates shall not be liable for any direct, indirect, or consequential damages arising from use of the service, including damages arising from user-generated content posted by third parties."],
    ["15. Indemnification", "You agree to indemnify and hold harmless Ravlin and its affiliates from any claims, damages, or expenses arising from your use of the service, your violation of these terms, or your violation of any third-party rights."],
    ["16. Contact", "Questions about these Terms or to report content violations may be directed to Ravlin through the website. We respond to reasonable inquiries in a timely manner."],
  ];
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font-body)" }}>
      <nav style={{ padding: "20px 32px", display: "flex", alignItems: "center", gap: 16, borderBottom: "1px solid var(--border)" }}>
        <button onClick={onBack} className="btn-ghost" style={{ padding: "8px 16px", fontSize: 13 }}>← Back</button>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--text)" }}>Ravlin · Terms & Conditions</span>
      </nav>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 900, color: "var(--text)", marginBottom: 8 }}>Terms & Conditions</h1>
        <p style={{ color: "var(--text3)", fontSize: 13, marginBottom: 40 }}>Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        {sections.map(([title, body], i) => (
          <div key={i} style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>{title}</h2>
            <p style={{ color: "var(--text2)", fontSize: 15, lineHeight: 1.8 }}>{body}</p>
          </div>
        ))}
        <div style={{ marginTop: 40, padding: "20px 24px", background: "var(--green-dim)", border: "1px solid var(--border-accent)", borderRadius: "var(--radius)" }}>
          <p style={{ color: "var(--green)", fontSize: 14, lineHeight: 1.7 }}>🦌 Always check your state's current hunting and fishing regulations before heading out. Your state wildlife agency is the definitive source.</p>
        </div>
        <button onClick={onBack} className="btn-primary" style={{ marginTop: 36, padding: "14px 32px", fontSize: 15 }}>← Back to Ravlin</button>
      </div>
    </div>
  );
}

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
