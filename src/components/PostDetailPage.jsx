import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../supabase";
import { capName, avatarColor, toast } from "../utils";

export function PostComments({ postId, postOwnerId, user, openSignIn, onCommentAdded, onViewUser }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [avatars, setAvatars] = useState({});
  const [commentLikes, setCommentLikes] = useState({});
  const [replyTo, setReplyTo] = useState(null); // { id, username }
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const inputRef = useRef(null);

  const loadComments = async () => {
    setLoading(true);
    const { data } = await supabase.from("comments").select("*").eq("post_id", postId).order("created_at", { ascending: true });
    setComments(data || []);
    if (data?.length) {
      const userIds = [...new Set(data.map(c => c.user_id))];
      const [{ data: profiles }, { data: likes }] = await Promise.all([
        supabase.from("profiles").select("user_id, avatar_url").in("user_id", userIds),
        supabase.from("comment_likes").select("comment_id, user_id").in("comment_id", data.map(c => c.id))
      ]);
      const avatarMap = {};
      (profiles || []).forEach(p => { avatarMap[p.user_id] = p.avatar_url; });
      setAvatars(avatarMap);
      const likeMap = {};
      (likes || []).forEach(l => {
        if (!likeMap[l.comment_id]) likeMap[l.comment_id] = [];
        likeMap[l.comment_id].push(l.user_id);
      });
      setCommentLikes(likeMap);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadComments();
    if (user?.id) {
      supabase.from("profiles").select("avatar_url").eq("user_id", user.id).single().then(({ data }) => {
        if (data?.avatar_url) setAvatars(prev => ({ ...prev, [user.id]: data.avatar_url }));
      });
    }
  }, [postId]);

  const submit = async () => {
    if (!text.trim()) return;
    if (!user) { openSignIn(); return; }
    setSubmitting(true);
    await supabase.from("comments").insert({
      post_id: postId,
      user_id: user.id,
      username: user.username || user.firstName || "Hunter",
      content: text.trim(),
      parent_id: replyTo?.id || null,
    });
    if (postOwnerId && postOwnerId !== user.id) {
      fetch("https://wildai-server.onrender.com/push/comment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ post_owner_id: postOwnerId, commenter_username: user.username || user.firstName || "Someone", comment: text.trim() }) }).catch(() => { });
    }
    if (replyTo?.id) setExpandedReplies(prev => new Set([...prev, replyTo.id]));
    setText("");
    setReplyTo(null);
    await loadComments();
    onCommentAdded?.();
    setSubmitting(false);
  };

  const deleteComment = async (id) => {
    await supabase.from("comments").delete().eq("id", id);
    setComments(prev => prev.filter(c => c.id !== id));
    onCommentAdded?.(-1);
  };

  const toggleCommentLike = async (commentId) => {
    if (!user) { openSignIn(); return; }
    const liked = commentLikes[commentId]?.includes(user.id);
    if (liked) {
      await supabase.from("comment_likes").delete().eq("comment_id", commentId).eq("user_id", user.id);
      setCommentLikes(prev => ({ ...prev, [commentId]: (prev[commentId] || []).filter(id => id !== user.id) }));
    } else {
      await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: user.id });
      setCommentLikes(prev => ({ ...prev, [commentId]: [...(prev[commentId] || []), user.id] }));
    }
  };

  const timeAgo = (date) => {
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  const topLevel = comments.filter(c => !c.parent_id);
  const replies = comments.filter(c => c.parent_id);
  const repliesFor = (id) => replies.filter(r => r.parent_id === id);

  const CommentRow = ({ c, isReply = false }) => {
    const liked = commentLikes[c.id]?.includes(user?.id);
    const likeCount = commentLikes[c.id]?.length || 0;
    const replyList = repliesFor(c.id);
    const expanded = expandedReplies.has(c.id);
    const canDelete = user?.id === c.user_id || user?.id === postOwnerId;
    const [expanded2, setExpanded2] = useState(false);
    const TRUNCATE = 120;
    const long = c.content?.length > TRUNCATE;
    const displayText = long && !expanded2 ? c.content.slice(0, TRUNCATE) + "…" : c.content;

    return (
      <div style={{ display: "flex", gap: 10, marginBottom: isReply ? 8 : 16, alignItems: "flex-start", paddingLeft: isReply ? 28 : 0 }}>
        {/* Avatar */}
        <div onClick={() => onViewUser?.(c.user_id)} className="avatar-img" style={{ width: isReply ? 26 : 32, height: isReply ? 26 : 32, background: `linear-gradient(135deg, ${avatarColor(c.username)[0]}, ${avatarColor(c.username)[1]})`, cursor: "pointer" }}>
          {avatars[c.user_id] ? <img src={avatars[c.user_id]} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: isReply ? 9 : 11 }}>{(c.username || "H")[0].toUpperCase()}</div>}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name + time + heart row */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span onClick={() => onViewUser?.(c.user_id)} style={{ color: "white", fontWeight: 700, fontSize: 12.5, cursor: onViewUser ? "pointer" : "default", lineHeight: 1 }}>{capName(c.username || "Hunter")}</span>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10.5, lineHeight: 1 }}>{timeAgo(c.created_at)}</span>
            {canDelete && (
              <button onClick={() => deleteComment(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.2)", padding: "0 2px", lineHeight: 0 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            )}
            <button onClick={() => toggleCommentLike(c.id)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, color: liked ? "#f43f5e" : "rgba(255,255,255,0.25)", padding: 0, flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill={liked ? "#f43f5e" : "none"} stroke={liked ? "#f43f5e" : "currentColor"} strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
              {likeCount > 0 && <span style={{ fontSize: 9, fontWeight: 700 }}>{likeCount}</span>}
            </button>
          </div>

          {/* Comment text */}
          <div style={{ flex: 1, textAlign: "left" }}>
            <span style={{ color: "rgba(238,245,232,0.8)", fontSize: 13, lineHeight: 1.55 }}>{displayText}</span>
            {long && !expanded2 && <button onClick={() => setExpanded2(true)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)", padding: "0 0 0 4px" }}>more</button>}
          </div>

          {/* Reply + expand row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 5 }}>
            {!isReply && replyList.length === 0 && (
              <button onClick={() => { setReplyTo({ id: c.id, username: c.username }); setText(`@${c.username} `); inputRef.current?.focus(); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", padding: 0 }}>Reply</button>
            )}
            {!isReply && replyList.length > 0 && (
              <button onClick={() => setExpandedReplies(prev => { const n = new Set(prev); n.has(c.id) ? n.delete(c.id) : n.add(c.id); return n; })} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}><polyline points="6 9 12 15 18 9" /></svg>
                {expanded ? "Hide replies" : `${replyList.length} repl${replyList.length === 1 ? "y" : "ies"}`}
              </button>
            )}
            {!isReply && replyList.length > 0 && expanded && (
              <button onClick={() => { setReplyTo({ id: c.id, username: c.username }); setText(`@${c.username} `); inputRef.current?.focus(); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", padding: 0 }}>Reply</button>
            )}
          </div>

          {/* Replies */}
          {!isReply && expanded && (
            <div style={{ marginTop: 8, borderLeft: "1.5px solid rgba(255,255,255,0.08)", paddingLeft: 0 }}>
              {replyList.map(r => <CommentRow key={r.id} c={r} isReply />)}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: "16px 16px 4px", background: "rgba(0,0,0,0.15)" }}>
      {loading && comments.length === 0 && (
        <div style={{ paddingBottom: 8 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "flex-start" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.05) 75%)", backgroundSize: "200% 100%", animation: `shimmer 1.4s ease-in-out ${i * 0.15}s infinite` }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 9, width: "35%", borderRadius: 6, marginBottom: 7, backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.05) 75%)", backgroundSize: "200% 100%", animation: `shimmer 1.4s ease-in-out ${i * 0.15}s infinite` }} />
                <div style={{ height: 9, width: "72%", borderRadius: 6, backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.05) 75%)", backgroundSize: "200% 100%", animation: `shimmer 1.4s ease-in-out ${i * 0.15 + 0.08}s infinite` }} />
              </div>
            </div>
          ))}
        </div>
      )}
      {topLevel.map(c => <CommentRow key={c.id} c={c} />)}
      {topLevel.length === 0 && !loading && <div style={{ color: "var(--text3)", fontSize: 12, marginBottom: 12 }}>No comments yet</div>}
      {replyTo && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", background: "var(--green-dim)", borderRadius: 8, marginBottom: 6 }}>
          <span style={{ color: "var(--green)", fontSize: 11 }}>Replying to {capName(replyTo.username)}</span>
          <button onClick={() => { setReplyTo(null); setText(""); }} style={{ background: "none", border: "none", color: "var(--text3)", fontSize: 12, cursor: "pointer", marginLeft: "auto" }}>✕</button>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, alignItems: "center", paddingBottom: 12, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
        <div className="avatar-img" style={{ width: 24, height: 24, background: `linear-gradient(135deg, ${avatarColor(user?.username)[0]}, ${avatarColor(user?.username)[1]})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 10 }}>
          {avatars[user?.id] ? <img src={avatars[user?.id]} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : user?.imageUrl ? <img src={user.imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (user?.username || user?.firstName || "?")[0].toUpperCase()}
        </div>
        <input
          ref={inputRef}
          placeholder={replyTo ? `Reply to ${capName(replyTo.username)}...` : "Add a comment..."}
          value={text}
          onChange={e => setText(e.target.value.slice(0, 300))}
          onKeyDown={e => { if (e.key === "Enter") submit(); }}
          style={{ flex: 1, padding: "9px 16px", borderRadius: 24, fontSize: 13, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text)", outline: "none" }}
        />
        <button onClick={submit} disabled={!text.trim() || submitting} style={{ background: text.trim() ? "var(--green)" : "transparent", border: "none", cursor: "pointer", color: text.trim() ? "white" : "var(--text3)", padding: "7px 8px", borderRadius: "50%", transition: "all 0.15s", lineHeight: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
        </button>
      </div>
    </div>
  );
}

export default function PostDetailPage({ postId, user, openSignIn, onBack, onViewUser }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase.from("posts").select("*").eq("id", postId).single();
      if (data) {
        // Fetch latest avatar from profiles in case post has stale avatar
        const { data: profile } = await supabase.from("profiles").select("avatar_url, username").eq("user_id", data.user_id).single();
        setPost({ ...data, avatar_url: profile?.avatar_url || data.avatar_url, username: profile?.username || data.username });
      }
      const { count } = await supabase.from("likes").select("*", { count: "exact", head: true }).eq("post_id", postId);
      setLikeCount(count || 0);
      if (user) {
        const { data: liked } = await supabase.from("likes").select("id").eq("post_id", postId).eq("user_id", user.id).single();
        setIsLiked(!!liked);
      }
      const { count: cc } = await supabase.from("comments").select("*", { count: "exact", head: true }).eq("post_id", postId);
      setCommentCount(cc || 0);
      setLoading(false);
    };
    load();
  }, [postId]);

  const toggleLike = async () => {
    if (!user) { openSignIn(); return; }
    if (isLiked) {
      await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", user.id);
      setIsLiked(false); setLikeCount(c => c - 1);
    } else {
      await supabase.from("likes").insert({ post_id: postId, user_id: user.id });
      setIsLiked(true); setLikeCount(c => c + 1);
    }
  };

  const shimmerBar = (w, mb = 0, delay = "0s") => ({
    height: 10, width: w, borderRadius: 6, marginBottom: mb,
    backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.05) 75%)",
    backgroundSize: "200% 100%",
    animation: `shimmer 1.4s ease-in-out ${delay} infinite`,
  });
  if (loading) return createPortal(
    <div className="fade-in" style={{ position: "fixed", inset: 0, zIndex: 99999, background: "var(--bg)", overflowY: "auto", padding: "0 0 80px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "16px 16px 0" }}>
        <div style={{ height: 44, marginBottom: 8 }} />
        <div style={{ borderRadius: 16, overflow: "hidden", background: "#0e1510", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ height: 480, backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.04) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s ease-in-out infinite" }} />
          <div style={{ padding: "14px 16px 20px" }}>
            <div style={shimmerBar("40%", 10)} />
            <div style={shimmerBar("75%")} />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
  if (!post) return <div style={{ textAlign: "center", padding: 60, color: "var(--text3)" }}>Post not found.</div>;

  const timeAgo = (date) => {
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return createPortal(
    <div className="fade-in" style={{ position: "fixed", inset: 0, zIndex: 99999, background: "var(--bg)", overflowY: "auto", padding: "0 0 80px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "16px 16px 0" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--green)", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, padding: "4px 0 16px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
          Back
        </button>
        <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", background: "#0e1510", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
          {post.photo ? (
            <div style={{ position: "relative", overflow: "hidden", borderRadius: "16px 16px 0 0" }}>
              <img src={post.photo} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(20px)", transform: "scale(1.1)", opacity: 0.6 }} />
              <img src={post.photo} style={{ position: "relative", width: "100%", height: 480, objectFit: "contain", display: "block", zIndex: 1 }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 30%, transparent 50%, rgba(0,0,0,0.7) 100%)", zIndex: 2, pointerEvents: "none" }} />
              <div style={{ position: "absolute", top: 12, left: 12, right: 52, display: "flex", alignItems: "center", gap: 10, zIndex: 3 }}>
                <div onClick={() => onViewUser(post.user_id)} className="avatar-img" style={{ width: 40, height: 40, background: `linear-gradient(135deg, ${avatarColor(post.username)[0]}, ${avatarColor(post.username)[1]})`, cursor: "pointer" }}>
                  {post.avatar_url ? <img src={post.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: "white", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontFamily: "var(--font-display)" }}>{(post.username || "H")[0].toUpperCase()}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span onClick={() => onViewUser(post.user_id)} style={{ color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "block", textShadow: "0 1px 6px rgba(0,0,0,0.9)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{capName(post.username)}</span>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, display: "flex", alignItems: "center", gap: 3 }}><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#78b450" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>{post.state}</span>
                </div>
              </div>
              <div style={{ position: "absolute", right: 12, bottom: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, zIndex: 3 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <button onClick={(e) => { toggleLike(); const svg = e.currentTarget.querySelector("svg"); svg.classList.remove("like-pop"); void svg.offsetWidth; svg.classList.add("like-pop"); }} style={{ background: "none", border: "none", cursor: "pointer", color: isLiked ? "#f43f5e" : "white", padding: 0, lineHeight: 0, filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.8))" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill={isLiked ? "#f43f5e" : "none"} stroke={isLiked ? "#f43f5e" : "currentColor"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                  </button>
                  <span style={{ color: "white", fontSize: 10, fontWeight: 700, textShadow: "0 1px 4px rgba(0,0,0,0.9)", height: 14, display: "block" }}>{likeCount > 0 ? likeCount : ""}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <span style={{ color: "white", padding: 0, lineHeight: 0, filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.8))" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  </span>
                  <span style={{ color: "white", fontSize: 10, fontWeight: 700, textShadow: "0 1px 4px rgba(0,0,0,0.9)", height: 14, display: "block" }}>{commentCount > 0 ? commentCount : ""}</span>
                </div>
                <span style={{ color: "white", padding: 0, lineHeight: 0, filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.8))" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
                </span>
              </div>
              <div style={{ position: "absolute", bottom: 20, left: 12, zIndex: 3 }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.55)", background: "rgba(0,0,0,0.4)", padding: "3px 8px", borderRadius: 20, backdropFilter: "blur(6px)" }}>{timeAgo(post.created_at)}</span>
              </div>
            </div>
          ) : (
            <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "center", gap: 12 }}>
              <div onClick={() => onViewUser(post.user_id)} className="avatar-img" style={{ width: 44, height: 44, background: `linear-gradient(135deg, ${avatarColor(post.username)[0]}, ${avatarColor(post.username)[1]})`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                {post.avatar_url ? <img src={post.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: "white", fontWeight: 700, fontSize: 17 }}>{(post.username || "H")[0].toUpperCase()}</span>}
              </div>
              <div style={{ flex: 1 }}>
                <span onClick={() => onViewUser(post.user_id)} style={{ color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "block" }}>{capName(post.username)}</span>
                <span style={{ color: "#4a6a4a", fontSize: 11 }}>{post.state}</span>
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#3a5a3a", background: "#111a11", border: "1px solid #1c2c1c", padding: "3px 8px", borderRadius: 20 }}>{timeAgo(post.created_at)}</span>
            </div>
          )}
          {post.caption && (
            <div style={{ padding: "10px 16px 14px" }}>
              <p style={{ color: "#b8ccb8", fontSize: 13, lineHeight: 1.55, margin: 0 }}>
                <span style={{ fontWeight: 700, color: "white" }}>{capName(post.username)}</span> {post.caption}
              </p>
            </div>
          )}
        </div>
        <div className="slide-up" style={{ marginTop: 12, borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)", background: "#0e1510", animationDelay: "0.15s" }}>
          <PostComments postId={postId} postOwnerId={post.user_id} user={user} openSignIn={openSignIn} onCommentAdded={(delta = 1) => setCommentCount(c => c + delta)} onViewUser={onViewUser} />
        </div>
      </div>
    </div>,
    document.body
  );
}
