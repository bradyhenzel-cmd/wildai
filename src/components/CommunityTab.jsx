import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Bell } from "lucide-react";
import { supabase } from "../supabase";
import { capName, avatarColor, stripExif, toast } from "../utils";
import { STATES } from "../constants";
import UserProfilePage from "./UserProfilePage";
import HotspotsTab from "./HotspotsTab";
import PostDetailPage, { PostComments } from "./PostDetailPage";
import MessagesTab from "./MessagesTab";
import GlobalChatTab from "./GlobalChatTab";

function PinPicker({ user, onSelect }) {
  const [pins, setPins] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("saved_pins").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setPins(data || []));
  }, [user]);

  if (!user) return null;

  return (
    <>
      <button onClick={() => setOpen(o => !o)} title="Attach a pin" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "50%", color: "var(--text3)", fontSize: 13, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        📍
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.5)" }} />
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 201, background: "#0d140d", borderTop: "1px solid #2a3a2a", borderRadius: "20px 20px 0 0", maxHeight: "50vh", overflowY: "auto", padding: "8px 0" }}>
            <div style={{ width: 36, height: 4, background: "#2a3a2a", borderRadius: 2, margin: "8px auto 16px" }} />
            <div style={{ padding: "0 16px 8px", color: "var(--text3)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em" }}>SELECT A PIN</div>
            {pins.length === 0 && <div style={{ padding: "16px", fontSize: 13, color: "var(--text3)" }}>No saved pins yet — drop a pin on the Map tab first</div>}
            {pins.map(pin => (
              <div key={pin.id} onClick={() => { onSelect(pin); setOpen(false); }} style={{ padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid var(--border)", fontSize: 13, color: "var(--text)", display: "flex", alignItems: "center", gap: 10 }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(120,180,80,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                📍 {pin.name || pin.location || "Unnamed pin"}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

export default function CommunityTab({ selectedState, user, openSignIn, onPinSaved, externalSetUnread, externalSetNotifUnread, isGuest }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [confirmDeletePost, setConfirmDeletePost] = useState(null);
  const [sharingPost, setSharingPost] = useState(null);
  const [shareOptionsPost, setShareOptionsPost] = useState(null);
  const [postMenu, setPostMenu] = useState(null);
  const [expandedCaptions, setExpandedCaptions] = useState(new Set());
  const [reelsIndex, setReelsIndex] = useState(null);
  const [reelsComments, setReelsComments] = useState(false);
  const [reelsDragY, setReelsDragY] = useState(0);
  const reelsRef = React.useRef(null);
  const reelsLocked = React.useRef(false);
  useEffect(() => {
    if (reelsIndex === null) {
      document.body.style.overflow = "";
      document.body.style.position = "";
      return;
    }
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    const el = reelsRef.current;
    if (!el) return;
    let startY = 0, startX = 0, dragging = false;
    const onStart = (e) => {
      if (reelsLocked.current) return;
      startY = e.touches[0].clientY; startX = e.touches[0].clientX; dragging = true;
    };
    const onMove = (e) => {
      if (!dragging || reelsLocked.current) return;
      const dy = e.touches[0].clientY - startY;
      const dx = e.touches[0].clientX - startX;
      if (Math.abs(dy) > Math.abs(dx)) { e.preventDefault(); setReelsDragY(dy); }
    };
    const onEnd = (e) => {
      if (!dragging || reelsLocked.current) return;
      dragging = false;
      const dy = e.changedTouches[0].clientY - startY;
      const dx = e.changedTouches[0].clientX - startX;
      setReelsDragY(0);
      if (Math.abs(dy) > Math.abs(dx)) {
        if (dy < -40 && reelsIndex < posts.length - 1) {
          reelsLocked.current = true;
          setReelsIndex(i => i + 1); setReelsComments(false);
          setTimeout(() => { reelsLocked.current = false; }, 250);
        } else if (dy > 40 && reelsIndex > 0) {
          reelsLocked.current = true;
          setReelsIndex(i => i - 1); setReelsComments(false);
          setTimeout(() => { reelsLocked.current = false; }, 250);
        } else if (dy > 100 && reelsIndex === 0) {
          setReelsIndex(null); setReelsComments(false);
        }
      }
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [reelsIndex, posts.length]);
  const timeAgo = (date) => {
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };
  useEffect(() => {
    if (reelsIndex === null) return;
    const handler = (e) => {
      if (e.key === 'ArrowUp') { setReelsIndex(i => Math.max(0, i - 1)); setReelsComments(false); }
      if (e.key === 'ArrowDown') { setReelsIndex(i => { const next = i + 1; return next < posts.length ? next : i; }); setReelsComments(false); }
      if (e.key === 'Escape') { setReelsIndex(null); setReelsComments(false); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [reelsIndex, posts.length]);
  const [shareSearch, setShareSearch] = useState("");
  const [shareUsers, setShareUsers] = useState([]);
  const [pullY, setPullY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const pullStartY = useRef(0);
  const [stateFilter, setStateFilter] = useState(selectedState || "all");
  const [sortBy, setSortBy] = useState("newest");
  const [form, setForm] = useState({ species: "", location: "", caption: "", photo: "", pinLat: null, pinLng: null });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [savedPinIds, setSavedPinIds] = useState(new Set());
  const [likedPostIds, setLikedPostIds] = useState(new Set());
  const [likeCounts, setLikeCounts] = useState({});
  const [commentCounts, setCommentCounts] = useState({});
  const [expandedComments, setExpandedComments] = useState(new Set());
  const [communityTab, setCommunityTab] = useState("feed");
  const [notifs, setNotifs] = useState([]);
  const [notifUnread, setNotifUnread] = useState(0);

  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const loadNotifs = async () => {
    if (!user) return;
    if (notifs.length === 0) setLoadingNotifs(true);
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const myPostIds = (await supabase.from("posts").select("id").eq("user_id", user.id)).data?.map(p => p.id) || [];
    // Get my comment IDs so we can find replies and likes on them
    const myCommentIds = (await supabase.from("comments").select("id").eq("user_id", user.id)).data?.map(c => c.id) || [];
    const [{ data: followData }, { data: realLikes }, { data: realComments }, { data: commentLikesData }, { data: commentRepliesData }] = await Promise.all([
      supabase.from("follows").select("follower_id, created_at").eq("following_id", user.id).gte("created_at", since).order("created_at", { ascending: false }).limit(30),
      myPostIds.length ? supabase.from("likes").select("post_id, user_id, created_at").in("post_id", myPostIds).neq("user_id", user.id).gte("created_at", since).order("created_at", { ascending: false }).limit(30) : { data: [] },
      myPostIds.length ? supabase.from("comments").select("post_id, user_id, username, content, created_at").in("post_id", myPostIds).neq("user_id", user.id).is("parent_id", null).gte("created_at", since).order("created_at", { ascending: false }).limit(30) : { data: [] },
      myCommentIds.length ? supabase.from("comment_likes").select("comment_id, user_id, created_at, comments(post_id)").in("comment_id", myCommentIds).neq("user_id", user.id).gte("created_at", since).order("created_at", { ascending: false }).limit(20) : { data: [] },
      myCommentIds.length ? supabase.from("comments").select("id, post_id, user_id, username, content, created_at, parent_id").in("parent_id", myCommentIds).neq("user_id", user.id).gte("created_at", since).order("created_at", { ascending: false }).limit(20) : { data: [] },
    ]);
    // Fetch profiles for all unique user ids
    const userIds = [...new Set([
      ...(followData || []).map(f => f.follower_id),
      ...(realLikes || []).map(l => l.user_id),
      ...(realComments || []).map(c => c.user_id),
      ...(commentLikesData || []).map(l => l.user_id),
      ...(commentRepliesData || []).map(r => r.user_id),
    ])].filter(Boolean);
    const { data: profilesData } = userIds.length ? await supabase.from("profiles").select("user_id, username, avatar_url").in("user_id", userIds) : { data: [] };
    const profileMap = {};
    (profilesData || []).forEach(p => { profileMap[p.user_id] = p; });
    const rawAll = [
      ...(realLikes || []).map(l => ({ type: "like", username: profileMap[l.user_id]?.username || "Someone", avatar: profileMap[l.user_id]?.avatar_url, created_at: l.created_at, post_id: l.post_id })),
      ...(realComments || []).map(c => ({ type: "comment", username: c.username || profileMap[c.user_id]?.username || "Someone", avatar: profileMap[c.user_id]?.avatar_url, created_at: c.created_at, post_id: c.post_id, content: c.content })),
      ...(followData || []).map(f => ({ type: "follow", username: profileMap[f.follower_id]?.username || "Someone", avatar: profileMap[f.follower_id]?.avatar_url, created_at: f.created_at, follower_id: f.follower_id })),
      ...(commentLikesData || []).map(l => ({ type: "comment_like", username: profileMap[l.user_id]?.username || "Someone", avatar: profileMap[l.user_id]?.avatar_url, created_at: l.created_at, post_id: l.comments?.post_id })),
      ...(commentRepliesData || []).map(r => ({ type: "reply", username: r.username || profileMap[r.user_id]?.username || "Someone", avatar: profileMap[r.user_id]?.avatar_url, created_at: r.created_at, post_id: r.post_id, content: r.content })),
    ];
    // Group notifications by type+post_id
    const groupKey = n => `${n.type}__${n.post_id || n.follower_id || ""}`;
    const groups = {};
    rawAll.forEach(n => {
      const key = groupKey(n);
      if (!groups[key]) groups[key] = { ...n, count: 1, others: [] };
      else { groups[key].count++; groups[key].others.push(n.username); }
    });
    const all = Object.values(groups).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setNotifs(all);
    const lastSeen = localStorage.getItem("wildai_notifs_seen") || "0";
    setNotifUnread(all.filter(n => new Date(n.created_at) > new Date(lastSeen)).length);
    setLoadingNotifs(false);
  };
  useEffect(() => {
    if (!user) return;
    loadNotifs();
    const interval = setInterval(loadNotifs, 60000);
    // Realtime subscription for instant badge updates
    const channel = supabase.channel('notifs-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'likes' }, () => loadNotifs())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, () => loadNotifs())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'follows' }, () => loadNotifs())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comment_likes' }, () => loadNotifs())
      .subscribe();
    return () => { clearInterval(interval); supabase.removeChannel(channel); };
  }, [user]);
  const [messagesUnread, setMessagesUnread] = useState(0);
  useEffect(() => {
    if (!user) return;
    const loadUnread = () => {
      fetch(`https://wildai-server.onrender.com/messages/inbox?userId=${user.id}`)
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setMessagesUnread(data.reduce((sum, t) => sum + (t.unread || 0), 0)); })
        .catch(() => { });
    };
    loadUnread();
    const channel = supabase.channel('messages-unread')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient_id=eq.${user.id}` }, () => loadUnread())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `recipient_id=eq.${user.id}` }, () => loadUnread())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);
  useEffect(() => { externalSetUnread?.(messagesUnread); }, [messagesUnread]);
  useEffect(() => { externalSetNotifUnread?.(notifUnread); }, [notifUnread]);
  const [feedFilter, setFeedFilter] = useState("all");
  const [followingIds, setFollowingIds] = useState(new Set());
  const [blockedIds, setBlockedIds] = useState(new Set());

  useEffect(() => {
    if (!user) return;
    supabase.from("blocked_users").select("blocked_id").eq("blocker_id", user.id).then(({ data }) => {
      if (data) setBlockedIds(new Set(data.map(b => b.blocked_id)));
    });
  }, [user]);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(() => !localStorage.getItem("wildai_community_welcomed"));
  const [viewingProfile, setViewingProfile] = useState(null);
  const [viewingPost, setViewingPost] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const loadPosts = async () => {
    setLoading(true);
    let query = supabase.from("posts").select("*").order("created_at", { ascending: false });

    const { data } = await query.limit(50);
    if (data?.length) {
      const userIds = [...new Set(data.map(p => p.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, avatar_url, last_seen").in("user_id", userIds);
      const profileMap = {};
      (profiles || []).forEach(p => { profileMap[p.user_id] = { avatar_url: p.avatar_url, last_seen: p.last_seen }; });
      setPosts(data.map(p => ({ ...p, avatar_url: profileMap[p.user_id]?.avatar_url || null, last_seen: profileMap[p.user_id]?.last_seen || null })));
    } else {
      setPosts([]);
    }
    setLoading(false);
  };

  const loadLikes = async (postList) => {
    if (!postList?.length) return;
    const ids = postList.map(p => p.id);
    const { data } = await supabase.from("likes").select("post_id, user_id").in("post_id", ids);
    if (!data) return;
    const counts = {};
    ids.forEach(id => counts[id] = 0);
    data.forEach(l => { counts[l.post_id] = (counts[l.post_id] || 0) + 1; });
    setLikeCounts(counts);
    if (user) setLikedPostIds(new Set(data.filter(l => l.user_id === user.id).map(l => l.post_id)));
    const { data: commentData } = await supabase.from("comments").select("post_id").in("post_id", ids);
    if (commentData) {
      const cc = {};
      ids.forEach(id => cc[id] = 0);
      commentData.forEach(c => { cc[c.post_id] = (cc[c.post_id] || 0) + 1; });
      setCommentCounts(cc);
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await supabase.from("profiles").select("user_id, username, avatar_url").ilike("username", `%${query}%`).limit(5);
    if (data) setSearchResults(data.filter(u => u.username));
    setSearching(false);
  };

  const loadSavedPins = async () => {
    if (!user) return;
    const { data } = await supabase.from("saved_pins").select("post_id").eq("user_id", user.id);
    setSavedPinIds(new Set((data || []).map(p => p.post_id)));
  };

  useEffect(() => { loadPosts(); }, [stateFilter]);

  useEffect(() => { if (posts.length) loadLikes(posts); }, [posts, user]);
  useEffect(() => {
    const channel = supabase
      .channel("posts-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, async (payload) => {
        const newPost = payload.new;
        const { data: prof } = await supabase.from("profiles").select("avatar_url").eq("user_id", newPost.user_id).single();
        newPost.avatar_url = prof?.avatar_url || null;
        if (stateFilter !== "all" && newPost.state !== stateFilter) return;
        setPosts(prev => prev.some(p => p.id === newPost.id) ? prev : [newPost, ...prev]);
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "posts" }, (payload) => {
        setPosts(prev => prev.filter(p => p.id !== payload.old.id));
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [stateFilter]);
  useEffect(() => {
    if (window._sharePinToComm) {
      const pin = window._sharePinToComm;
      setForm(f => ({ ...f, location: pin.name || pin.location || "", species: pin.species || "", pinLat: pin.lat, pinLng: pin.lng }));
      setShowForm(true);
      window._sharePinToComm = null;
    }
  }, []);
  useEffect(() => { loadSavedPins(); }, [user]);
  useEffect(() => {
    if (!user) return;
    supabase.from("follows").select("following_id").eq("follower_id", user.id).then(({ data }) => {
      if (data) {
        setFollowingIds(new Set(data.map(f => f.following_id)));
        window._updateFollowing = (id, add) => setFollowingIds(prev => { const n = new Set(prev); add ? n.add(id) : n.delete(id); return n; });
        window._openPost = (postId) => { setCommunityTab("notifs"); setViewingPost(postId); };
      }
    });
  }, [user]);

  const toggleLike = async (post) => {
    if (!user || isGuest) { openSignIn(); return; }
    const liked = likedPostIds.has(post.id);
    // Optimistic update — instant UI response
    if (liked) {
      setLikedPostIds(prev => { const n = new Set(prev); n.delete(post.id); return n; });
      setLikeCounts(prev => ({ ...prev, [post.id]: Math.max(0, (prev[post.id] || 1) - 1) }));
      supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", user.id).then(({ error }) => {
        if (error) { // revert on fail
          setLikedPostIds(prev => new Set([...prev, post.id]));
          setLikeCounts(prev => ({ ...prev, [post.id]: (prev[post.id] || 0) + 1 }));
        }
      });
    } else {
      setLikedPostIds(prev => new Set([...prev, post.id]));
      setLikeCounts(prev => ({ ...prev, [post.id]: (prev[post.id] || 0) + 1 }));
      supabase.from("likes").insert({ post_id: post.id, user_id: user.id }).then(({ error }) => {
        if (error) { // revert on fail
          setLikedPostIds(prev => { const n = new Set(prev); n.delete(post.id); return n; });
          setLikeCounts(prev => ({ ...prev, [post.id]: Math.max(0, (prev[post.id] || 1) - 1) }));
        }
      });
      if (post.user_id !== user.id) {
        fetch("https://wildai-server.onrender.com/push/like", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ post_owner_id: post.user_id, liker_username: user.username || user.firstName || "Someone" }) }).catch(() => { });
      }
    }
  };

  const submitPost = async () => {
    if (!form.photo && !form.caption) { toast("Please add a photo and description.", "error"); return; }
    if (!form.photo) { toast("Please add a photo to your post.", "error"); return; }
    if (!form.caption) { toast("Please add a description to your post.", "error"); return; }
    if (!user) { openSignIn(); return; }
    setSubmitting(true); setError(null);
    const { data: banned } = await supabase.from("banned_users").select("id").eq("user_id", user.id).maybeSingle();
    if (banned) { setError("Your account has been suspended."); setSubmitting(false); return; }
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentPost } = await supabase.from("posts").select("id").eq("user_id", user.id).gte("created_at", fiveMinutesAgo).maybeSingle();
    if (recentPost) { setError("Please wait 5 minutes between posts."); setSubmitting(false); return; }
    let lat = null, lng = null;
    if (form.pinLat && form.pinLng) {
      lat = form.pinLat; lng = form.pinLng;
    }
    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      username: user.username || user.firstName || "Hunter",
      state: form.location || selectedState || "Unknown",
      species: form.species,
      location: form.location,
      caption: form.caption,
      photo: form.photo,
      lat, lng,
    });
    if (error) { setError("Failed to post. Try again."); }
    else {
      const { data: newPost } = await supabase.from("posts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single();
      if (newPost) {
        const { data: myProfile } = await supabase.from("profiles").select("avatar_url").eq("user_id", user.id).single();
        const postWithAvatar = { ...newPost, avatar_url: myProfile?.avatar_url || null };
        setPosts(prev => prev.some(p => p.id === postWithAvatar.id) ? prev : [postWithAvatar, ...prev]);
      }
      setForm({ species: "", location: "", caption: "", photo: "", pinLat: null, pinLng: null }); setShowForm(false);
    }
    setSubmitting(false);
  };

  const saveToMap = async (post) => {
    if (!user) { openSignIn(); return; }
    if (savedPinIds.has(post.id)) {
      const { error } = await supabase.from("saved_pins").delete().eq("user_id", user.id).eq("post_id", post.id);
      if (error) { console.error("Delete pin error:", error); toast("Failed to remove pin.", "error"); return; }
      setSavedPinIds(prev => { const n = new Set(prev); n.delete(post.id); return n; });
      window._removePinFromMap?.(post.id);
      toast("Pin removed from your map.", "dark");
      return;
    }
    if (!post.lat || !post.lng) { toast("This post doesn't have a location pin.", "error"); return; }
    const { error: insertError } = await supabase.from("saved_pins").insert({
      user_id: user.id, post_id: post.id,
      name: post.location || post.species || "Saved Spot",
      location: post.location, species: post.species,
      photo: post.photo, lat: post.lat, lng: post.lng, state: post.state,
    });
    if (insertError) { console.error("Save pin error:", insertError); toast("Failed to save pin.", "error"); return; }
    setSavedPinIds(prev => new Set([...prev, post.id]));
    window._addPinToMap?.({ user_id: user.id, post_id: post.id, name: post.location || post.species || "Saved Spot", location: post.location, species: post.species, photo: post.photo, lat: post.lat, lng: post.lng, state: post.state });
    onPinSaved?.();
    toast("📍 Saved to your map!", "success");
  };

  const reportPost = async (postId) => {
    if (!user) { openSignIn(); return; }
    const { data: existing } = await supabase.from("reports").select("id").eq("post_id", postId).eq("reported_by", user.id).single();
    if (existing) { toast("You've already reported this post."); return; }
    await supabase.from("reports").insert({ post_id: postId, reason: "User reported", reported_by: user.id });
    toast("Post reported. Thank you.", "success");
  };

  const deletePost = async (postId) => {
    setConfirmDeletePost(postId);
  };
  const doDeletePost = async (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    await supabase.from("posts").delete().eq("id", postId);
    setConfirmDeletePost(null);
    toast("Post deleted.", "success");
  };

  const filteredByFollow = feedFilter === "following"
    ? posts.filter(p => followingIds.has(p.user_id) && !blockedIds.has(p.user_id))
    : posts.filter(p => !blockedIds.has(p.user_id));
  const sortedPosts = [...filteredByFollow].sort((a, b) => {
    if (sortBy === "top") return (likeCounts[b.id] || 0) - (likeCounts[a.id] || 0);
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return (
    <div key={communityTab} className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14, overflow: "visible" }}
      onTouchStart={e => { pullStartY.current = e.touches[0].clientY; setIsPulling(true); }}
      onTouchMove={e => {
        if (!isPulling) return;
        const dy = e.touches[0].clientY - pullStartY.current;
        if (dy > 0 && window.scrollY === 0 && communityTab === "feed") setPullY(Math.min(dy * 0.4, 80));
      }}
      onTouchEnd={() => {
        setIsPulling(false);
        if (pullY > 50 && !refreshing) {
          setRefreshing(true);
          loadPosts().finally(() => { setRefreshing(false); setPullY(0); });
        } else {
          setPullY(0);
        }
      }}
    >


      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", color: "var(--green)", textTransform: "uppercase", marginBottom: 2 }}>Community</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.3px" }}>Ravlin Feed</div>
        </div>

      </div>

      {/* Search */}
      <div style={{ position: "relative" }}>
        <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#4a6a4a", pointerEvents: "none" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        <input
          placeholder="Search users..."
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); searchUsers(e.target.value); }}
          style={{ width: "100%", padding: "12px 14px 12px 38px", borderRadius: 16, fontSize: 13, background: "#111a11", border: "1px solid #1c2a1c", color: "var(--text)", fontFamily: "var(--font-body)", boxSizing: "border-box" }}
        />
        {searchResults.length > 0 && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: "#0d140d", border: "1px solid #2a3a2a", borderRadius: 12, overflow: "hidden", zIndex: 50 }}>
            {searchResults.map(u => (
              <div key={u.user_id} onClick={() => { setViewingProfile(u.user_id); setSearchQuery(""); setSearchResults([]); }} style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", color: "var(--text)", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 10 }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(120,180,80,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ width: 32, height: 32, borderRadius: 10, overflow: "hidden", background: `linear-gradient(135deg, ${avatarColor(u.username)[0]}, ${avatarColor(u.username)[1]})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 0 2px #78b450, 0 0 10px rgba(120,180,80,0.25)" }}>
                  {u.avatar_url ? <img src={u.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 14, fontFamily: "var(--font-display)", color: "white", fontWeight: 700 }}>{u.username?.[0]?.toUpperCase()}</span>}
                </div>
                {capName(u.username)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tab Nav */}
      <div style={{ display: "flex", borderRadius: 16, padding: 4, gap: 2, background: "#0e160e", border: "1px solid #192019" }}>
        {[
          { id: "feed", label: "Feed", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg> },
          { id: "chat", label: "Chat", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg> },
          { id: "notifs", label: "Activity", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg> },
          { id: "messages", label: "Messages", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg> },
          { id: "profile", label: "Profile", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> },
        ].map(t => (
          <button key={t.id} onClick={() => { setCommunityTab(t.id); setViewingProfile(null); if (t.id === "notifs") { loadNotifs(); localStorage.setItem("wildai_notifs_seen", new Date().toISOString()); setNotifUnread(0); } }} style={{
            flex: 1, padding: "9px 0", fontSize: 10, fontWeight: 700, borderRadius: 12, border: "none", cursor: "pointer", transition: "all 0.2s",
            background: communityTab === t.id ? "linear-gradient(135deg, #2d5a1b, #1e4010)" : "transparent",
            color: communityTab === t.id ? "white" : "#4a6a4a",
            boxShadow: communityTab === t.id ? "0 4px 16px rgba(45,90,27,0.4)" : "none"
          }}>
            <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <span style={{ position: "relative", width: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                {t.icon}
                {t.id === "messages" && messagesUnread > 0 && (
                  <span style={{ position: "absolute", top: -3, right: -3, background: "#f43f5e", borderRadius: "50%", width: 11, height: 11, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 800, color: "white" }}>
                    {messagesUnread > 9 ? "9+" : messagesUnread}
                  </span>
                )}
                {t.id === "notifs" && notifUnread > 0 && (
                  <span style={{ position: "absolute", top: -3, right: -3, background: "#f43f5e", borderRadius: "50%", width: 11, height: 11, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 800, color: "white" }}>
                    {notifUnread > 9 ? "9+" : notifUnread}
                  </span>
                )}
              </span>
              {(communityTab === t.id || window.innerWidth > 600) && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.03em" }}>{t.label}</span>}
            </span>
          </button>
        ))}
      </div>
      {confirmDeletePost && createPortal(
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setConfirmDeletePost(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#0d1a0d", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 28, maxWidth: 320, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🗑️</div>
            <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, fontFamily: "var(--font-display)", marginBottom: 8 }}>Delete this post?</div>
            <div style={{ color: "var(--text3)", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>This can't be undone.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmDeletePost(null)} className="btn-ghost" style={{ flex: 1, padding: "10px 0", fontSize: 14 }}>Cancel</button>
              <button onClick={() => doDeletePost(confirmDeletePost)} style={{ flex: 1, padding: "10px 0", fontSize: 14, background: "rgba(255,60,60,0.15)", border: "1px solid rgba(255,60,60,0.3)", borderRadius: "var(--radius-sm)", color: "rgba(255,100,100,0.9)", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {communityTab === "notifs" && !viewingProfile && viewingPost && (
        <PostDetailPage postId={viewingPost} user={user} openSignIn={openSignIn} onBack={() => setViewingPost(null)} onViewUser={(id) => { setViewingProfile(id); setViewingPost(null); }} />
      )}
      {communityTab === "notifs" && !viewingProfile && !viewingPost && (
        <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 2 }}>

          {!loadingNotifs && notifs.length === 0 && (
            <div style={{ textAlign: "center", padding: 48, color: "var(--text3)", fontSize: 14 }}>
              <div style={{ marginBottom: 12, display: "flex", justifyContent: "center" }}><Bell size={40} color="rgba(255,255,255,0.15)" /></div>
              <div style={{ color: "var(--text)", fontWeight: 600, marginBottom: 6 }}>No activity yet</div>
              Post something to start getting likes and follows!
            </div>
          )}
          {notifs.map((n, i) => (
            <div key={i} onClick={() => {
              if (n.type === "follow" && n.follower_id) { setViewingProfile(n.follower_id); }
              else if (n.post_id) { setViewingPost(n.post_id); }
            }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 4px", borderBottom: "1px solid var(--border)", cursor: "pointer", borderRadius: 8, transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(120,180,80,0.05)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: `linear-gradient(135deg, ${avatarColor(n.username)[0]}, ${avatarColor(n.username)[1]})`, overflow: "hidden", flexShrink: 0, boxShadow: "0 0 0 2px #78b450" }}>
                {n.avatar ? <img src={n.avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 15 }}>{n.username[0].toUpperCase()}</div>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ color: "var(--text)", fontWeight: 700, fontSize: 13 }}>{capName(n.username)}</span>
                <span style={{ color: "var(--text2)", fontSize: 13 }}>
                  {(() => {
                    const others = n.count > 1 ? ` and ${n.count - 1} other${n.count > 2 ? "s" : ""}` : "";
                    if (n.type === "like") return `${others} liked your post`;
                    if (n.type === "comment") return n.count > 1 ? `${others} commented on your post` : ` commented: "${n.content?.slice(0, 40)}${n.content?.length > 40 ? "..." : ""}"`;
                    if (n.type === "comment_like") return `${others} liked your comment`;
                    if (n.type === "reply") return n.count > 1 ? `${others} replied to your comment` : ` replied: "${n.content?.slice(0, 40)}${n.content?.length > 40 ? "..." : ""}"`;
                    return " followed you";
                  })()}
                </span>
                <div style={{ color: "var(--text3)", fontSize: 11, marginTop: 3 }}>{(() => { const diff = (Date.now() - new Date(n.created_at)) / 1000; if (diff < 60) return "just now"; if (diff < 3600) return `${Math.floor(diff / 60)}m ago`; if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`; return `${Math.floor(diff / 86400)}d ago`; })()}</div>
              </div>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: n.type === "like" ? "rgba(244,63,94,0.15)" : n.type === "comment" ? "rgba(120,180,80,0.15)" : "rgba(80,140,220,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                {n.type === "like" ? "❤️" : n.type === "comment" ? "💬" : n.type === "comment_like" ? "❤️" : n.type === "reply" ? "↩️" : "➕"}
              </div>
            </div>
          ))}
        </div>
      )}
      {communityTab === "messages" && !viewingProfile && (
        <MessagesTab user={user} openSignIn={openSignIn} supabase={supabase} onUnreadChange={setMessagesUnread} />
      )}
      {communityTab === "chat" && !viewingProfile && (
        <GlobalChatTab user={user} openSignIn={openSignIn} />
      )}
      {communityTab === "profile" && !viewingProfile && (
        !user ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text3)", fontSize: 14 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🦌</div>
            <div style={{ color: "var(--text)", fontWeight: 600, marginBottom: 6 }}>Sign in to view your profile</div>
            <button onClick={openSignIn} className="btn-primary" style={{ padding: "8px 20px", fontSize: 13 }}>Sign In</button>
          </div>
        ) : createPortal(
          <div className="fade-in" style={{ position: "fixed", inset: 0, zIndex: 99998, background: "var(--bg)", overflowY: "auto", padding: "0 0 80px" }}>
            <div style={{ maxWidth: 760, margin: "0 auto" }}>
              <UserProfilePage
                userId={user.id}
                currentUser={user}
                onBack={() => setCommunityTab("feed")}
                openSignIn={openSignIn}
                onViewUser={(id) => { setViewingProfile(id); }}
                onPost={() => { setShowForm(true); setCommunityTab("feed"); }}
                onBlock={(id, unblock) => { setBlockedIds(prev => { const n = new Set(prev); unblock ? n.delete(id) : n.add(id); return n; }); }}
                openUserProfile={() => window._clerkOpenProfile?.()}
              />
            </div>
          </div>,
          document.body
        )
      )}
      {viewingProfile && createPortal(
        <div className="fade-in" style={{ position: "fixed", inset: 0, zIndex: 99998, background: "var(--bg)", overflowY: "auto", padding: "0 0 80px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <UserProfilePage
              userId={viewingProfile}
              currentUser={user}
              isGuest={isGuest}
              onBack={() => setViewingProfile(null)}
              openSignIn={openSignIn}
              onViewUser={(id) => setViewingProfile(id)}
              onMessage={(id) => { setViewingProfile(null); setCommunityTab("messages"); setTimeout(() => { window._openMessageThread = id; }, 100); }}
              onBlock={(id, unblock) => { setBlockedIds(prev => { const n = new Set(prev); unblock ? n.delete(id) : n.add(id); return n; }); if (!unblock) setViewingProfile(null); }}
            />
          </div>
        </div>,
        document.body
      )}
      {communityTab === "feed" && !viewingProfile && <>

        {/* Toggles */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", background: "#0a110a", border: "1px solid #1c2a1c", borderRadius: 14, padding: 3, gap: 2 }}>
            {[["all", "For You"], ["following", "Following"], ["top", "Top"]].map(([val, label]) => {
              const isActive = val === "top" ? sortBy === "top" : feedFilter === val && sortBy !== "top";
              return (
                <button key={val} onClick={() => {
                  if (val === "following" && !user) { openSignIn(); return; }
                  if (val === "top") { setFeedFilter("all"); setSortBy("top"); }
                  else { setFeedFilter(val); setSortBy("newest"); }
                }} style={{
                  padding: "6px 14px", borderRadius: 11, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", transition: "all 0.2s",
                  background: isActive ? "linear-gradient(135deg, #2d5a1b, #1a3a0e)" : "transparent",
                  color: isActive ? "white" : "#4a6a4a",
                  boxShadow: isActive ? "0 2px 8px rgba(45,90,27,0.4)" : "none"
                }}>{label}</button>
              );
            })}
          </div>
          <div style={{ flex: 1 }} />
          {user && <button onClick={() => { if (showForm) { setShowForm(false); setForm({ species: "", location: "", caption: "", photo: "", pinLat: null, pinLng: null }); } else { setShowForm(true); } }} style={{ width: 32, height: 32, borderRadius: "50%", background: showForm ? "rgba(255,100,100,0.15)" : "linear-gradient(135deg, #2d5a1b, #1e4010)", border: "none", color: "white", fontSize: showForm ? 16 : 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{showForm ? "✕" : "+"}</button>}
        </div>
      </>}

      {(communityTab === "feed" || communityTab === "profile") && !viewingProfile && showForm && createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "#0e1510", display: "flex", flexDirection: "column" }} onClick={() => { setShowForm(false); setForm({ species: "", location: "", caption: "", photo: "", pinLat: null, pinLng: null }); }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#0e1510", width: "100%", height: "100%", display: "flex", flexDirection: "column", animation: "slideUp 0.3s cubic-bezier(0.32,0.72,0,1)" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 12px", flexShrink: 0 }}>
              <span style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, fontFamily: "var(--font-display)" }}>New Post</span>
              <button onClick={() => { setShowForm(false); setForm({ species: "", location: "", caption: "", photo: "", pinLat: null, pinLng: null }); }} style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 13, fontFamily: "var(--font-body)", fontWeight: 600, padding: "4px 8px" }}>Cancel</button>
            </div>

            {/* Photo — grows to fill space */}
            <label style={{ display: "block", cursor: "pointer", position: "relative", margin: "0 16px", borderRadius: 16, overflow: "hidden", flex: 1 }}>
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={async e => {
                const file = e.target.files[0];
                if (!file) return;
                const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
                toast("Uploading photo...", "info");
                const stripped = await stripExif(file);
                const { data, error } = await supabase.storage.from("post-photos").upload(fileName, stripped, { contentType: "image/jpeg" });
                if (error) { toast("Photo upload failed. Try again.", "error"); return; }
                const { data: urlData } = supabase.storage.from("post-photos").getPublicUrl(fileName);
                setForm(f => ({ ...f, photo: urlData.publicUrl }));
                toast("Photo added!", "success");
              }} />
              {form.photo ? (
                <div style={{ position: "relative", height: "100%" }}>
                  <img src={form.photo} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.55)", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "white", backdropFilter: "blur(8px)" }}>Change</div>
                </div>
              ) : (
                <div style={{ height: "100%", minHeight: 260, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: "linear-gradient(135deg, rgba(45,90,27,0.12), rgba(30,64,16,0.06))", border: "1.5px dashed rgba(120,180,80,0.2)", borderRadius: 16 }}>
                  <div style={{ width: 60, height: 60, borderRadius: 16, background: "rgba(120,180,80,0.08)", border: "1px solid rgba(120,180,80,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(120,180,80,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 15, fontWeight: 600 }}>Add a photo</div>
                    <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, marginTop: 4 }}>Tap to choose from your library</div>
                  </div>
                </div>
              )}
            </label>

            {/* Fields — pinned to bottom */}
            <div style={{ padding: "14px 16px 40px", display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
              <textarea placeholder="Share your experience..." value={form.caption} onChange={e => setForm(f => ({ ...f, caption: e.target.value.slice(0, 500) }))} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 14, minHeight: 70, resize: "none", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text)", fontFamily: "var(--font-body)", outline: "none", boxSizing: "border-box", lineHeight: 1.6 }} />
              <select value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} style={{ width: "100%", padding: "11px 14px", borderRadius: 12, fontSize: 13, background: "#0e1510", border: "1px solid rgba(255,255,255,0.08)", color: form.location ? "var(--text)" : "rgba(255,255,255,0.3)", fontFamily: "var(--font-body)", boxSizing: "border-box" }}>
                <option value="">State (optional)</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {error && <span style={{ color: "var(--amber)", fontSize: 12 }}>{error}</span>}
              <button onClick={() => { if (!form.photo || !form.caption) { if (!form.photo && !form.caption) { toast("Please add a photo and description.", "error"); } else if (!form.photo) { toast("Please add a photo to your post.", "error"); } else { toast("Please add a description to your post.", "error"); } return; } submitPost(); }} disabled={submitting} className="btn-primary" style={{ width: "100%", padding: "14px", fontSize: 14, fontWeight: 700, borderRadius: 14, opacity: submitting ? 0.5 : (!form.photo || !form.caption) ? 0.6 : 1 }}>
                {submitting ? "Posting..." : "Share Post"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {communityTab === "feed" && !viewingProfile && loading && <div style={{ minHeight: 300 }} />}

      {reelsIndex !== null && createPortal(
        (() => {
          const renderReelsPost = (idx) => {
            const p = sortedPosts[idx];
            if (!p) return <div style={{ width: "100%", height: "100vh", background: "#000" }} />;
            const pLiked = likedPostIds.has(p.id);
            const pLikeCount = likeCounts[p.id] || 0;
            const post = p; const isLiked = pLiked; const likeCount = pLikeCount;
            return (
              <div key={p.id} style={{ width: "100%", height: "100vh", position: "relative", overflow: "hidden", flexShrink: 0 }}>
                {/* Photo fullscreen */}
                <div style={{ position: "absolute", inset: 0 }}>
                  {post.photo && <img src={post.photo} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(20px)", transform: "scale(1.1)", opacity: 0.6 }} />}
                  {post.photo && <img src={post.photo} style={{ position: "relative", width: "100%", height: "100%", objectFit: "contain", zIndex: 1 }} />}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 25%, transparent 50%, rgba(0,0,0,0.75) 100%)", zIndex: 2, pointerEvents: "none" }} />
                  {/* Close button */}
                  <button onClick={() => { setReelsIndex(null); setReelsComments(false); }} style={{ position: "absolute", top: 16, left: 16, background: "rgba(0,0,0,0.4)", border: "none", color: "white", width: 36, height: 36, borderRadius: "50%", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)", zIndex: 3 }}>✕</button>
                  {/* Nav arrows */}


                  {/* Three-dot top right */}
                  <div style={{ position: "absolute", top: 16, right: 12, zIndex: 3 }}>
                    <button onClick={() => setPostMenu(postMenu === post.id ? null : post.id)} style={{ background: "rgba(0,0,0,0.4)", border: "none", cursor: "pointer", color: "white", padding: "6px 8px", borderRadius: 8, backdropFilter: "blur(6px)", lineHeight: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
                    </button>
                    {postMenu === post.id && (
                      <div style={{ position: "absolute", top: 36, right: 0, background: "rgba(15,22,15,0.97)", border: "1px solid #1c2a1c", borderRadius: 12, overflow: "hidden", minWidth: 150, backdropFilter: "blur(12px)", zIndex: 10 }}>
                        {(user?.id === post.user_id || user?.id === "user_3CKoCuA9KUvrtfrJ3ia3Bm2BH1a") && (
                          <button onClick={() => { deletePost(post.id); setPostMenu(null); setReelsIndex(null); }} style={{ width: "100%", padding: "12px 16px", background: "none", border: "none", color: "rgba(255,100,100,0.9)", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left", fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: 10 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
                            Delete post
                          </button>
                        )}
                        <button onClick={() => { if (!user || isGuest) { openSignIn(); setPostMenu(null); return; } reportPost(post.id); setPostMenu(null); }} style={{ width: "100%", padding: "12px 16px", background: "none", border: "none", color: "rgba(220,180,60,0.9)", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left", fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: 10, borderTop: user?.id === post.user_id ? "1px solid #1c2a1c" : "none" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>
                          Report post
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Vertical action buttons */}
                  <div style={{ position: "absolute", right: 12, bottom: reelsComments ? "64%" : 80, display: "flex", flexDirection: "column", alignItems: "center", gap: 20, transition: "bottom 0.3s", zIndex: 3 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                      <button onClick={(e) => { toggleLike(post); const svg = e.currentTarget.querySelector('svg'); if (svg) { svg.classList.remove('like-pop'); requestAnimationFrame(() => svg.classList.add('like-pop')); } }} style={{ background: "none", border: "none", cursor: "pointer", color: isLiked ? "#f43f5e" : "white", padding: 0, lineHeight: 0, filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.8))" }}>
                        <svg width="30" height="30" viewBox="0 0 24 24" fill={isLiked ? "#f43f5e" : "none"} stroke={isLiked ? "#f43f5e" : "currentColor"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                      </button>
                      <span style={{ color: "white", fontSize: 11, fontWeight: 700, textShadow: "0 1px 4px rgba(0,0,0,0.9)", height: 14, display: "block", textAlign: "center" }}>{likeCount > 0 ? likeCount : ""}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                      <button onClick={() => { if (!user || isGuest) { openSignIn(); return; } setReelsComments(c => !c); }} style={{ background: "none", border: "none", cursor: "pointer", color: reelsComments ? "var(--green)" : "white", padding: 0, lineHeight: 0, filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.8))" }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                      </button>
                      <span style={{ color: "white", fontSize: 11, fontWeight: 700, textShadow: "0 1px 4px rgba(0,0,0,0.9)", height: 14, display: "block", textAlign: "center" }}>{commentCounts[post.id] > 0 ? commentCounts[post.id] : ""}</span>
                    </div>
                    <button onClick={() => { if (!user || isGuest) { openSignIn(); return; } setShareOptionsPost(post); }} style={{ background: "none", border: "none", cursor: "pointer", color: "white", padding: 0, lineHeight: 0, filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.8))" }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
                    </button>
                  </div>

                </div>
                {/* Comments slide-up sheet */}
                {/* Time ago bottom left */}
                <div style={{ position: "absolute", bottom: 80, left: 16, display: "flex", alignItems: "center", gap: 10, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(10px)", padding: "8px 12px 8px 8px", borderRadius: 20, zIndex: 3 }}>
                  <div onClick={() => { setViewingProfile(post.user_id); setReelsIndex(null); }} style={{ width: 38, height: 38, borderRadius: 12, background: `linear-gradient(135deg, ${avatarColor(post.username)[0]}, ${avatarColor(post.username)[1]})`, overflow: "hidden", cursor: "pointer", flexShrink: 0, boxShadow: "0 0 0 2px rgba(120,180,80,0.9)" }}>
                    {post.avatar_url ? <img src={post.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: "white", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontFamily: "var(--font-display)" }}>{(post.username || "H")[0].toUpperCase()}</span>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "white", textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}>{capName(post.username)}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.65)" }}>{timeAgo(post.created_at)}</span>
                      {post.state && <><span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>·</span><span style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", gap: 3 }}><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#78b450" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>{post.state}</span></>}
                    </div>
                  </div>
                </div>
              </div>
            );
          };
          const post = sortedPosts[reelsIndex];
          if (!post) return null;
          return (
            <div ref={reelsRef} style={{ position: "fixed", inset: 0, zIndex: 999998, background: "#000", overflow: "hidden" }}>
              <div style={{ display: "flex", flexDirection: "column", transform: `translateY(calc(${-reelsIndex * 100}vh + ${reelsDragY * 0.5}px))`, transition: reelsDragY === 0 ? "transform 0.4s cubic-bezier(0.32,0.72,0,1)" : "none", willChange: "transform" }}>
                {sortedPosts.map((_, i) => {
                  if (Math.abs(i - reelsIndex) > 1) return <div key={i} style={{ width: "100%", height: "100vh", flexShrink: 0, background: "#000" }} />;
                  return renderReelsPost(i);
                })}
              </div>
              {reelsComments && (
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "62%", background: "rgba(10,16,10,0.97)", borderRadius: "20px 20px 0 0", border: "1px solid #1c2a1c", backdropFilter: "blur(12px)", display: "flex", flexDirection: "column", animation: "slideUp 0.35s cubic-bezier(0.32, 0.72, 0, 1)" }}>
                  <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2a3a2a", margin: "12px auto 0" }} />
                  {post.caption && (
                    <div style={{ padding: "12px 16px 8px", borderBottom: "1px solid #192019" }}>
                      <p style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.55, margin: 0 }}>
                        <span style={{ fontWeight: 700, color: "white" }}>{capName(post.username)}</span> {post.caption}
                      </p>
                    </div>
                  )}
                  <div style={{ flex: 1, overflowY: "auto" }}>
                    <PostComments postId={post.id} postOwnerId={post.user_id} user={user} openSignIn={openSignIn} onCommentAdded={(delta = 1) => setCommentCounts(prev => ({ ...prev, [post.id]: Math.max(0, (prev[post.id] || 0) + delta) }))} onViewUser={(id) => { setViewingProfile(id); setReelsIndex(null); }} />
                  </div>
                </div>
              )}
            </div>
          );
        })(),
        document.body
      )}
      {shareOptionsPost && createPortal(
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 999999, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setShareOptionsPost(null)}>
          <div style={{ background: "#0e1510", border: "1px solid #1c2a1c", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, padding: "20px 16px 36px", display: "flex", flexDirection: "column", gap: 12 }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2a3a2a", margin: "0 auto 8px" }} />
            <button onClick={() => { setSharingPost(shareOptionsPost); setShareOptionsPost(null); }} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, background: "#131f13", border: "1px solid #1c2a1c", cursor: "pointer", color: "white", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 1 0-16 0" /><path d="M16 19h6" /><path d="M19 16v6" /></svg>
              Send to a friend
            </button>
            <button onClick={() => { navigator.share ? navigator.share({ title: "Ravlin", text: shareOptionsPost.caption, url: window.location.href }) : toast("Sharing not supported on this device.", "error"); setShareOptionsPost(null); }} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, background: "#131f13", border: "1px solid #1c2a1c", cursor: "pointer", color: "white", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
              Share via...
            </button>
          </div>
        </div>,
        document.body
      )}
      {sharingPost && createPortal(
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 999999, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => { setSharingPost(null); setShareSearch(""); setShareUsers([]); }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 760, background: "#0d1a0d", border: "1px solid var(--border)", borderRadius: "20px 20px 0 0", padding: 24, maxHeight: "70vh", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, fontFamily: "var(--font-display)" }}>Share to Messages</div>
            <input
              placeholder="Search users..."
              value={shareSearch}
              autoFocus
              onChange={async e => {
                setShareSearch(e.target.value);
                if (e.target.value.length < 2) { setShareUsers([]); return; }
                const { data } = await supabase.from("profiles").select("user_id, username, avatar_url").ilike("username", `%${e.target.value}%`).neq("user_id", user.id).limit(10);
                setShareUsers(data || []);
              }}
              style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)", fontSize: 14, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "var(--font-body)" }}
            />
            <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {shareUsers.map(u => (
                <div key={u.user_id} onClick={async () => {
                  await fetch("https://wildai-server.onrender.com/messages/send", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      sender_id: user.id,
                      recipient_id: u.user_id,
                      content: "📸 Shared a post",
                      shared_post_id: sharingPost.id,
                      shared_post_photo: sharingPost.photo,
                      shared_post_caption: sharingPost.caption,
                      shared_post_username: sharingPost.username,
                    })
                  });
                  setSharingPost(null); setShareSearch(""); setShareUsers([]);
                  toast(`Post shared to ${capName(u.username)}!`, "success");
                }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: "var(--radius-sm)", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", cursor: "pointer" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--green-dim)", overflow: "hidden", flexShrink: 0 }}>
                    {u.avatar_url ? <img src={u.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700 }}>{u.username[0].toUpperCase()}</div>}
                  </div>
                  <span style={{ color: "var(--text)", fontWeight: 600, fontSize: 14 }}>{capName(u.username)}</span>
                </div>
              ))}
              {shareSearch.length >= 2 && shareUsers.length === 0 && (
                <div style={{ color: "var(--text3)", fontSize: 13, textAlign: "center", padding: 20 }}>No users found</div>
              )}
              {shareSearch.length < 2 && (
                <div style={{ color: "var(--text3)", fontSize: 13, textAlign: "center", padding: 20 }}>Type a username to search</div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
      {communityTab === "feed" && !viewingProfile && pullY > 0 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: pullY, overflow: "hidden", transition: pullY < 50 ? "none" : "height 0.3s", color: "var(--text3)", fontSize: 12 }}>
          {pullY > 50 || refreshing ? <div style={{ width: 20, height: 20, border: "2px solid var(--green)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> : <span style={{ opacity: pullY / 50 }}>↓ Pull to refresh</span>}
        </div>
      )}
      {communityTab === "feed" && !viewingProfile && !loading && posts.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text3)", fontSize: 14 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌲</div>
          <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No posts yet</div>
          Be the first to share a spot in {stateFilter === "all" ? "your state" : stateFilter}!
        </div>
      )}

      {communityTab === "feed" && !viewingProfile && <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "8px 10px" }}>{sortedPosts.map(post => {
        const likeCount = likeCounts[post.id] || 0;
        const isLiked = likedPostIds.has(post.id);
        const isHot = likeCount >= 5;
        const timeAgo = (date) => {
          const diff = (Date.now() - new Date(date)) / 1000;
          if (diff < 60) return "just now";
          if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
          if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
          return `${Math.floor(diff / 86400)}d ago`;
        };
        return (
          <div key={post.id} className="fade-in" style={{ borderRadius: 16, overflow: "hidden", border: isHot ? "1px solid rgba(255,150,0,0.3)" : "1px solid rgba(255,255,255,0.06)", background: "#0e1510", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>

            {/* Photo with overlaid header and actions */}
            {post.photo ? (
              <div style={{ position: "relative", margin: 0, borderRadius: 0, overflow: "hidden", height: 480, background: "#000", borderRadius: "16px 16px 0 0" }}>
                <img src={post.photo} onClick={() => setReelsIndex(sortedPosts.findIndex(p => p.id === post.id))} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", cursor: "pointer" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 30%, transparent 50%, rgba(0,0,0,0.7) 100%)", pointerEvents: "none" }} />
                {/* Header overlay top-left */}
                <div style={{ position: "absolute", top: 12, left: 12, right: 52, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div onClick={() => setViewingProfile(post.user_id)} style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${avatarColor(post.username)[0]}, ${avatarColor(post.username)[1]})`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", boxShadow: "0 0 0 2px rgba(120,180,80,0.9)" }}>
                      {post.avatar_url ? <img src={post.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: "white", fontWeight: 700, fontSize: 15, fontFamily: "var(--font-display)" }}>{(post.username || "H")[0].toUpperCase()}</span>}
                    </div>
                    {post.last_seen && (Date.now() - new Date(post.last_seen)) < 5 * 60 * 1000 && (
                      <div style={{ position: "absolute", bottom: -1, right: -1, width: 11, height: 11, borderRadius: "50%", background: "#4ade80", border: "2px solid #0d140d" }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span onClick={() => setViewingProfile(post.user_id)} style={{ color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "block", textAlign: "left", textShadow: "0 1px 6px rgba(0,0,0,0.9)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{capName(post.username)}</span>
                    <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, display: "flex", alignItems: "center", gap: 3 }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#78b450" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                      {post.state}
                    </span>
                  </div>
                </div>
                {/* Three-dot menu */}
                <div style={{ position: "absolute", top: 12, right: 10 }}>
                  <button onClick={() => setPostMenu(postMenu === post.id ? null : post.id)} style={{ background: "rgba(0,0,0,0.4)", border: "none", cursor: "pointer", color: "white", padding: "6px 8px", borderRadius: 8, backdropFilter: "blur(6px)", lineHeight: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
                  </button>
                  {postMenu === post.id && (
                    <div style={{ position: "absolute", top: 36, right: 0, background: "rgba(15,22,15,0.97)", border: "1px solid #1c2a1c", borderRadius: 12, overflow: "hidden", minWidth: 150, backdropFilter: "blur(12px)", zIndex: 10 }}>
                      {(user?.id === post.user_id || user?.id === "user_3CKoCuA9KUvrtfrJ3ia3Bm2BH1a") && (
                        <button onClick={() => { deletePost(post.id); setPostMenu(null); }} style={{ width: "100%", padding: "12px 16px", background: "none", border: "none", color: "rgba(255,100,100,0.9)", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left", fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: 10 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
                          Delete post
                        </button>
                      )}
                      <button onClick={() => { if (!user || isGuest) { openSignIn(); setPostMenu(null); return; } reportPost(post.id); setPostMenu(null); }} style={{ width: "100%", padding: "12px 16px", background: "none", border: "none", color: "rgba(220,180,60,0.9)", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left", fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: 10, borderTop: user?.id === post.user_id ? "1px solid #1c2a1c" : "none" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>
                        Report post
                      </button>
                    </div>
                  )}
                </div>
                {/* Right side vertical action buttons */}
                <div style={{ position: "absolute", right: 12, bottom: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                  <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <button onClick={(e) => { toggleLike(post); const svg = e.currentTarget.querySelector('svg'); if (svg) { svg.classList.remove('like-pop'); requestAnimationFrame(() => svg.classList.add('like-pop')); } }} style={{ background: "none", border: "none", cursor: "pointer", color: isLiked ? "#f43f5e" : "white", padding: 0, lineHeight: 0, filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.8))" }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill={isLiked ? "#f43f5e" : "none"} stroke={isLiked ? "#f43f5e" : "currentColor"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                    </button>
                    <span style={{ color: "white", fontSize: 10, fontWeight: 700, textShadow: "0 1px 4px rgba(0,0,0,0.9)", marginTop: 3, minHeight: 14 }}>{likeCount > 0 ? likeCount : ""}</span>
                  </div>
                  <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <button onClick={() => { if (!user || isGuest) { openSignIn(); return; } setExpandedComments(prev => { const n = new Set(prev); if (n.has(post.id)) { n.delete(post.id); } else { n.add(post.id); } return n; }); }} style={{ background: "none", border: "none", cursor: "pointer", color: expandedComments.has(post.id) ? "var(--green)" : "white", padding: 0, lineHeight: 0, filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.8))", transition: "all 0.15s" }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                    </button>
                    <span style={{ color: "white", fontSize: 10, fontWeight: 700, textShadow: "0 1px 4px rgba(0,0,0,0.9)", marginTop: 3, minHeight: 14 }}>{commentCounts[post.id] > 0 ? commentCounts[post.id] : ""}</span>
                  </div>
                  <button onClick={() => { if (!user || isGuest) { openSignIn(); return; } setShareOptionsPost(post); }} style={{ background: "none", border: "none", cursor: "pointer", color: "white", padding: 0, lineHeight: 0, filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.8))", transition: "all 0.15s" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
                  </button>
                </div>
                <div style={{ position: "absolute", bottom: 12, left: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.55)", background: "rgba(0,0,0,0.4)", padding: "3px 8px", borderRadius: 20, backdropFilter: "blur(6px)" }}>{timeAgo(post.created_at)}</span>
                  {isHot && <span style={{ fontSize: 11, fontWeight: 600, padding: "5px 10px", borderRadius: 10, background: "rgba(30,20,10,0.9)", border: "1px solid rgba(200,100,20,0.4)", color: "#ff9500", backdropFilter: "blur(4px)" }}>🔥</span>}
                </div>
              </div>
            ) : (
              <>
                {/* Header for no-photo posts */}
                <div style={{ padding: "14px 16px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div onClick={() => setViewingProfile(post.user_id)} style={{ width: 44, height: 44, borderRadius: 14, background: `linear-gradient(135deg, ${avatarColor(post.username)[0]}, ${avatarColor(post.username)[1]})`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", boxShadow: "0 0 0 2px #78b450, 0 0 12px rgba(120,180,80,0.3)" }}>
                      {post.avatar_url ? <img src={post.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: "white", fontWeight: 700, fontSize: 17, fontFamily: "var(--font-display)" }}>{(post.username || "H")[0].toUpperCase()}</span>}
                    </div>
                    {post.last_seen && (Date.now() - new Date(post.last_seen)) < 5 * 60 * 1000 && (
                      <div style={{ position: "absolute", bottom: -1, right: -1, width: 13, height: 13, borderRadius: "50%", background: "#4ade80", border: "2px solid #0d140d" }} />
                    )}
                  </div>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <span onClick={() => setViewingProfile(post.user_id)} style={{ color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "block" }}>{capName(post.username)}</span>
                    <span style={{ color: "#4a6a4a", fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3d7a25" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                      {post.state}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#3a5a3a", background: "#111a11", border: "1px solid #1c2c1c", padding: "3px 8px", borderRadius: 20 }}>{timeAgo(post.created_at)}</span>
                    {(user?.id === post.user_id || user?.id === "user_3CKoCuA9KUvrtfrJ3ia3Bm2BH1a") && <button onClick={() => deletePost(post.id)} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,60,60,0.12)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"} style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,100,100,0.5)", padding: "4px 6px", borderRadius: 8, transition: "all 0.15s" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg></button>}
                    <button onClick={() => { if (!user || isGuest) { openSignIn(); return; } reportPost(post.id); }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,180,0,0.1)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"} style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(180,140,40,0.6)", padding: "4px 6px", borderRadius: 8, transition: "all 0.15s" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg></button>
                  </div>
                </div>
                {post.species && <div style={{ padding: "0 16px 6px" }}><span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 10, background: "rgba(45,90,27,0.5)", border: "1px solid rgba(61,122,37,0.4)", color: "var(--green)", display: "inline-block" }}>{post.species}</span></div>}
                <div style={{ padding: "8px 14px 12px", display: "flex", alignItems: "center", gap: 14 }}>
                  <button onClick={(e) => { toggleLike(post); const svg = e.currentTarget.querySelector('svg'); if (svg) { svg.classList.remove('like-pop'); requestAnimationFrame(() => svg.classList.add('like-pop')); } }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: isLiked ? "#f43f5e" : "#6a8a6a", padding: "4px 0", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill={isLiked ? "#f43f5e" : "none"} stroke={isLiked ? "#f43f5e" : "currentColor"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                    {likeCount > 0 && <span>{likeCount}</span>}
                  </button>
                  <button onClick={() => { if (!user || isGuest) { openSignIn(); return; } setExpandedComments(prev => { const n = new Set(prev); if (n.has(post.id)) { n.delete(post.id); } else { n.add(post.id); } return n; }); }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: expandedComments.has(post.id) ? "var(--green)" : "#6a8a6a", padding: "4px 0", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, transition: "all 0.15s" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                    {commentCounts[post.id] > 0 && <span>{commentCounts[post.id]}</span>}
                  </button>
                  <button onClick={() => { if (!user || isGuest) { openSignIn(); return; } setShareOptionsPost(post); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#6a8a6a", padding: "4px 0", transition: "all 0.15s" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
                  </button>
                  <div style={{ flex: 1 }} />
                </div>
              </>
            )}

            {/* Caption */}
            {post.caption && (
              <div style={{ padding: "10px 16px 14px" }}>
                <p style={{ color: "#b8ccb8", fontSize: 13, lineHeight: 1.55, margin: 0, textAlign: "left" }}>
                  <span style={{ fontWeight: 700, color: "white" }}>{capName(post.username)}</span>{" "}
                  {expandedCaptions.has(post.id) ? <>{post.caption}<span onClick={() => setExpandedCaptions(prev => { const n = new Set(prev); n.delete(post.id); return n; })} style={{ color: "rgba(255,255,255,0.4)", cursor: "pointer" }}> hide</span></> : post.caption.length > 100 ? <>{post.caption.slice(0, 100)}<span onClick={() => setExpandedCaptions(prev => { const n = new Set(prev); n.add(post.id); return n; })} style={{ color: "rgba(255,255,255,0.4)", cursor: "pointer" }}> ...more</span></> : post.caption}
                </p>
              </div>
            )}

            {expandedComments.has(post.id) && (
              <div style={{ borderTop: "1px solid #192019" }}>
                <PostComments postId={post.id} postOwnerId={post.user_id} user={user} openSignIn={openSignIn} onCommentAdded={(delta = 1) => setCommentCounts(prev => ({ ...prev, [post.id]: Math.max(0, (prev[post.id] || 0) + delta) }))} onViewUser={(id) => setViewingProfile(id)} />
              </div>
            )}
          </div>
        );
      })}</div>}
    </div>
  );
}
