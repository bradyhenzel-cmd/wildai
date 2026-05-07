import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../supabase";
import { capName, avatarColor, stripExif, toast } from "../utils";
import PostDetailPage from "./PostDetailPage";

export default function UserProfilePage({ userId, currentUser, onBack, openSignIn, onViewUser, onMessage, onPost, onBlock, isGuest }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState("");
  const [savingBio, setSavingBio] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileTab, setProfileTab] = useState("posts");
  const [viewingProfilePost, setViewingProfilePost] = useState(null);
  const [spotRatings, setSpotRatings] = useState({});
  const [userRatings, setUserRatings] = useState({});
  const [savedPinIds, setSavedPinIds] = useState(new Set());
  const [showFollowList, setShowFollowList] = useState(null); // 'followers' or 'following'
  const [isBlocked, setIsBlocked] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [followList, setFollowList] = useState([]);
  const [loadingFollowList, setLoadingFollowList] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: postData } = await supabase.from("posts").select("*").eq("user_id", userId).order("created_at", { ascending: false });
      let { data: profileData } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
      if (!profileData && currentUser?.id === userId) {
        const username = currentUser?.username || currentUser?.firstName || "Hunter";
        await supabase.from("profiles").insert({ user_id: userId, username });
        profileData = { user_id: userId, username };
      }
      const { data: followers } = await supabase.from("follows").select("id").eq("following_id", userId);
      const { data: following } = await supabase.from("follows").select("id").eq("follower_id", userId);
      setProfile(profileData);
      setPosts(postData || []);
      setFollowerCount(followers?.length || 0);
      setFollowingCount(following?.length || 0);
      if (currentUser && currentUser.id !== userId) {
        const { data: followCheck } = await supabase.from("follows").select("id").eq("follower_id", currentUser.id).eq("following_id", userId).maybeSingle();
        setIsFollowing(!!followCheck);
        const { data: blockCheck } = await supabase.from("blocked_users").select("id").eq("blocker_id", currentUser.id).eq("blocked_id", userId).maybeSingle();
        setIsBlocked(!!blockCheck);
      }
      const spotPosts = (postData || []).filter(p => p.lat && p.lng);
      if (spotPosts.length) {
        const ids = spotPosts.map(p => p.id);
        const { data: ratingData } = await supabase.from("spot_ratings").select("post_id, rating, user_id").in("post_id", ids);
        if (ratingData) {
          const avgRatings = {};
          const myRatings = {};
          ids.forEach(id => avgRatings[id] = { sum: 0, count: 0 });
          ratingData.forEach(r => {
            avgRatings[r.post_id].sum += r.rating;
            avgRatings[r.post_id].count += 1;
            if (currentUser && r.user_id === currentUser.id) myRatings[r.post_id] = r.rating;
          });
          setSpotRatings(avgRatings);
          setUserRatings(myRatings);
        }
      }
      if (currentUser) {
        const { data: savedData } = await supabase.from("saved_pins").select("post_id").eq("user_id", currentUser.id);
        setSavedPinIds(new Set((savedData || []).map(p => p.post_id)));
      }
      setLoading(false);
    };
    load();
  }, [userId]);

  const openFollowList = async (type) => {
    setShowFollowList(type);
    setLoadingFollowList(true);
    let userIds = [];
    if (type === 'followers') {
      const { data } = await supabase.from("follows").select("follower_id").eq("following_id", userId);
      userIds = (data || []).map(r => r.follower_id);
    } else {
      const { data } = await supabase.from("follows").select("following_id").eq("follower_id", userId);
      userIds = (data || []).map(r => r.following_id);
    }
    if (userIds.length) {
      const { data: profiles } = await supabase.from("profiles").select("user_id, username, avatar_url").in("user_id", userIds);
      setFollowList(profiles || []);
    } else {
      setFollowList([]);
    }
    setLoadingFollowList(false);
  };

  const toggleFollow = async () => {
    if (!currentUser || isGuest) { openSignIn(); return; }
    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", currentUser.id).eq("following_id", userId);
      setIsFollowing(false);
      setFollowerCount(c => c - 1);
      window._updateFollowing?.(userId, false);
    } else {
      await supabase.from("follows").insert({ follower_id: currentUser.id, following_id: userId });
      setIsFollowing(true);
      setFollowerCount(c => c + 1);
      window._updateFollowing?.(userId, true);
      fetch("https://wildai-server.onrender.com/push/follow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ followed_id: userId, follower_username: currentUser.username || currentUser.firstName || "Someone" }) }).catch(() => { });
    }
  };

  const saveBio = async () => {
    setSavingBio(true);
    await supabase.from("profiles").update({ bio: bioInput }).eq("user_id", userId);
    setProfile(p => ({ ...p, bio: bioInput }));
    setEditingBio(false);
    setSavingBio(false);
  };

  const uploadAvatar = async (file) => {
    if (!file) return;
    file = await stripExif(file);
    setUploadingAvatar(true);
    const fileName = `avatar-${userId}-${Date.now()}`;
    const { error } = await supabase.storage.from("post-photos").upload(fileName, file, { contentType: file.type, upsert: true });
    if (error) { setUploadingAvatar(false); return; }
    const { data: urlData } = supabase.storage.from("post-photos").getPublicUrl(fileName);
    await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("user_id", userId);
    setProfile(p => ({ ...p, avatar_url: urlData.publicUrl }));
    setUploadingAvatar(false);
  };

  const saveToMap = async (post) => {
    if (!currentUser) { openSignIn(); return; }
    if (savedPinIds.has(post.id)) return;
    await supabase.from("saved_pins").insert({
      user_id: currentUser.id, post_id: post.id,
      name: post.location || post.species || "Saved Spot",
      location: post.location, species: post.species,
      photo: post.photo, lat: post.lat, lng: post.lng, state: post.state,
    });
    setSavedPinIds(prev => new Set([...prev, post.id]));
  };

  const deletePost = async (postId) => {
    await supabase.from("posts").delete().eq("id", postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const rateSpot = async (postId, rating) => {
    if (!currentUser) { openSignIn(); return; }
    await supabase.from("spot_ratings").upsert({ post_id: postId, user_id: currentUser.id, rating });
    setUserRatings(prev => ({ ...prev, [postId]: rating }));
    setSpotRatings(prev => {
      const cur = prev[postId] || { sum: 0, count: 0 };
      const wasRated = userRatings[postId];
      const newSum = wasRated ? cur.sum - wasRated + rating : cur.sum + rating;
      const newCount = wasRated ? cur.count : cur.count + 1;
      return { ...prev, [postId]: { sum: newSum, count: newCount } };
    });
  };

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "var(--text3)" }} className="pulse">Loading profile...</div>;

  const displayName = profile?.username || posts[0]?.username || "Hunter";
  const isOwnProfile = currentUser?.id === userId;

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* Banner */}
      <div style={{ height: 110, position: "relative", overflow: "hidden", background: "#0a0f0a" }}>
        <img src="/banner.png" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%", opacity: 0.7 }} crossOrigin="anonymous" />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 0%, rgba(8,13,8,0.4) 50%, rgba(8,13,8,1) 100%)" }} />
        {onBack && <button onClick={onBack} style={{ position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 20, color: "white", fontSize: 13, padding: "5px 14px", cursor: "pointer", fontFamily: "var(--font-body)", WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)" }}>← Back</button>}
      </div>

      {/* Profile card */}
      <div style={{ background: "#080d08", padding: "0 16px 16px", borderBottom: "1px solid var(--border)" }}>
        {/* Avatar + info row — IG style */}
        <div style={{ display: "flex", gap: 16, alignItems: "flex-end", marginBottom: 12 }}>
          {/* Avatar */}
          <div style={{ position: "relative", marginTop: -36, flexShrink: 0 }}>
            <label style={{ cursor: isOwnProfile ? "pointer" : "default", display: "block" }}>
              {isOwnProfile && <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => uploadAvatar(e.target.files[0])} />}
              <div style={{ width: 90, height: 90, borderRadius: 20, background: `linear-gradient(135deg, ${avatarColor(profile?.username)[0]}, ${avatarColor(profile?.username)[1]})`, border: "4px solid #080d08", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", boxShadow: "0 0 0 2.5px var(--green), 0 4px 16px rgba(0,0,0,0.5)" }}>
                {uploadingAvatar
                  ? <span style={{ color: "var(--text3)", fontSize: 11 }}>...</span>
                  : profile?.avatar_url
                    ? <img src={`${profile.avatar_url}?t=${profile.avatar_updated_at || 0}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: 32, fontFamily: "var(--font-display)", color: "white", fontWeight: 700 }}>{displayName[0]?.toUpperCase()}</span>
                }
              </div>
              {isOwnProfile && <div style={{ position: "absolute", bottom: 2, right: 2, background: "var(--green)", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, border: "2px solid #080d08" }}>✏️</div>}
            </label>
          </div>
          {/* Name + stats */}
          <div style={{ flex: 1, paddingBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 17, fontFamily: "var(--font-display)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{capName(displayName)}</div>
              {profile?.is_pro && <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" style={{ flexShrink: 0, filter: "drop-shadow(0 0 4px rgba(232,176,32,0.8))", animation: "proShine 1.2s ease-out forwards", marginLeft: -4 }}><defs><radialGradient id="goldStar" cx="38%" cy="32%" r="65%"><stop offset="0%" stopColor="#fffaaa" /><stop offset="35%" stopColor="#f5c430" /><stop offset="100%" stopColor="#8a5500" /></radialGradient><style>{`@keyframes proShine { 0% { filter: drop-shadow(0 0 2px rgba(232,176,32,0.3)); transform: scale(0.8) rotate(-180deg); opacity: 0; } 60% { filter: drop-shadow(0 0 8px rgba(232,176,32,1)); transform: scale(1.15) rotate(10deg); opacity: 1; } 100% { filter: drop-shadow(0 0 4px rgba(232,176,32,0.8)); transform: scale(1) rotate(0deg); opacity: 1; } }`}</style></defs><path d="M11.051 7.616a1 1 0 0 1 1.909.024l.737 1.452a1 1 0 0 0 .737.535l1.634.256a1 1 0 0 1 .588 1.806l-1.172 1.168a1 1 0 0 0-.282.866l.259 1.613a1 1 0 0 1-1.541 1.134l-1.465-.75a1 1 0 0 0-.912 0l-1.465.75a1 1 0 0 1-1.539-1.133l.258-1.613a1 1 0 0 0-.282-.867l-1.156-1.152a1 1 0 0 1 .572-1.822l1.633-.256a1 1 0 0 0 .737-.535z" fill="url(#goldStar)" /></svg>}
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              {[["Posts", posts.length, null], ["Followers", followerCount, "followers"], ["Following", followingCount, "following"]].map(([label, val, type], i) => (
                <div key={i} onClick={() => type && openFollowList(type)} style={{ cursor: type ? "pointer" : "default", textAlign: "center" }}>
                  <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 15 }}>{val}</div>
                  <div style={{ color: "var(--text3)", fontSize: 11 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bio */}
        <div style={{ marginBottom: 10, contain: "layout" }}>
          {!editingBio && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ color: profile?.bio ? "var(--text2)" : "var(--text3)", fontSize: 13, fontStyle: profile?.bio ? "normal" : "italic", lineHeight: 1.5, width: "100%", overflowWrap: "break-word" }}>
                {profile?.bio || (isOwnProfile ? "Add a bio..." : "")}
              </div>
              {isOwnProfile && <button onClick={() => { setEditingBio(true); setBioInput(profile?.bio || ""); }} style={{ background: "none", border: "none", color: "var(--text3)", fontSize: 11, cursor: "pointer", padding: 0, flexShrink: 0 }}>✏️</button>}
            </div>
          )}
          {editingBio && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <textarea value={bioInput} onChange={e => setBioInput(e.target.value)} placeholder="Write a short bio..." maxLength={150} style={{ width: "100%", padding: "6px 10px", borderRadius: "var(--radius-sm)", fontSize: 13, minHeight: 60, resize: "none", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "var(--font-body)", boxSizing: "border-box" }} />
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={saveBio} disabled={savingBio} className="btn-primary" style={{ padding: "5px 14px", fontSize: 12 }}>{savingBio ? "Saving..." : "Save"}</button>
                <button onClick={() => setEditingBio(false)} className="btn-ghost" style={{ padding: "5px 14px", fontSize: 12 }}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Buttons row */}
        {!isOwnProfile && (
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <button onClick={toggleFollow} className={isFollowing ? "btn-ghost" : "btn-primary"} style={{ flex: 1, padding: "8px 0", fontSize: 13, borderRadius: 20 }}>
              {isFollowing ? "Following" : "Follow"}
            </button>
            <button onClick={() => { if (!currentUser) { openSignIn(); return; } onMessage?.(userId); }} className="btn-ghost" style={{ flex: 1, padding: "8px 0", fontSize: 13, borderRadius: 20 }}>Message</button>
          </div>
        )}
        {isOwnProfile && (
          <button onClick={() => onPost?.()} className="btn-primary" style={{ width: "100%", padding: "8px 0", fontSize: 13, borderRadius: 20, marginBottom: 10 }}>+ New Post</button>
        )}

        {!isOwnProfile && (
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={async () => {
              if (!currentUser || isGuest) { openSignIn(); return; }
              const { data: existing } = await supabase.from("reported_users").select("id").eq("user_id", userId).eq("reported_by", currentUser.id).single();
              if (existing) { toast("You've already reported this user."); return; }
              await supabase.from("reported_users").insert({ user_id: userId, reported_by: currentUser.id });
              toast("User reported. Thank you.", "success");
            }} style={{ background: "none", border: "none", color: "var(--text3)", fontSize: 11, cursor: "pointer", fontFamily: "var(--font-body)", padding: 0 }}>Report user</button>
            {confirmBlock && createPortal(
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setConfirmBlock(false)}>
                <div onClick={e => e.stopPropagation()} style={{ background: "#0d1a0d", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 28, maxWidth: 320, width: "100%", textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🚫</div>
                  <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, fontFamily: "var(--font-display)", marginBottom: 8 }}>Block this user?</div>
                  <div style={{ color: "var(--text3)", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>You won't see their posts or messages and they won't be able to interact with you.</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setConfirmBlock(false)} className="btn-ghost" style={{ flex: 1, padding: "10px 0", fontSize: 14 }}>Cancel</button>
                    <button onClick={async () => {
                      await supabase.from("blocked_users").upsert({ blocker_id: currentUser.id, blocked_id: userId });
                      setIsBlocked(true); setConfirmBlock(false);
                      onBlock?.(userId, false);
                      toast("User blocked.", "success");
                      onBack?.();
                    }} style={{ flex: 1, padding: "10px 0", fontSize: 14, background: "rgba(255,60,60,0.15)", border: "1px solid rgba(255,60,60,0.3)", borderRadius: "var(--radius-sm)", color: "rgba(255,100,100,0.9)", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>Block</button>
                  </div>
                </div>
              </div>,
              document.body
            )}
            <button onClick={async () => {
              if (!currentUser || isGuest) { openSignIn(); return; }
              if (isBlocked) {
                await supabase.from("blocked_users").delete().eq("blocker_id", currentUser.id).eq("blocked_id", userId);
                setIsBlocked(false);
                onBlock?.(userId, true);
                toast("User unblocked.", "success");
              } else {
                setConfirmBlock(true);
              }
            }} style={{ background: "none", border: "none", color: isBlocked ? "var(--text3)" : "rgba(255,100,100,0.5)", fontSize: 11, cursor: "pointer", fontFamily: "var(--font-body)", padding: 0 }}>{isBlocked ? "Unblock user" : "Block user"}</button>
          </div>
        )}
      </div>

      {/* Follow list modal */}
      {showFollowList && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "flex-end" }} onClick={() => setShowFollowList(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxHeight: "70vh", background: "#0d1a0d", borderRadius: "20px 20px 0 0", padding: 24, overflowY: "auto", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, fontFamily: "var(--font-display)" }}>{showFollowList === "followers" ? "Followers" : "Following"}</div>
              <button onClick={() => setShowFollowList(null)} style={{ background: "none", border: "none", color: "var(--text3)", fontSize: 20, cursor: "pointer", padding: 0 }}>✕</button>
            </div>
            {loadingFollowList && <div style={{ textAlign: "center", padding: 20, color: "var(--text3)" }} className="pulse">Loading...</div>}
            {!loadingFollowList && followList.length === 0 && <div style={{ textAlign: "center", padding: 20, color: "var(--text3)", fontSize: 13 }}>No {showFollowList} yet</div>}
            {followList.map(u => (
              <div key={u.user_id} onClick={() => { setShowFollowList(null); onViewUser(u.user_id); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(120,180,80,0.05)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${avatarColor(u.username)[0]}, ${avatarColor(u.username)[1]})`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, boxShadow: "0 0 0 2px #78b450" }}>
                  {u.avatar_url ? <img src={u.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 16, fontFamily: "var(--font-display)", color: "white", fontWeight: 700 }}>{u.username?.[0]?.toUpperCase()}</span>}
                </div>
                <span style={{ color: "var(--text)", fontWeight: 600, fontSize: 14 }}>{capName(u.username)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 12 }}>
        <button onClick={() => setProfileTab("posts")} style={{ flex: 1, background: "none", border: "none", borderBottom: profileTab === "posts" ? "2px solid var(--green)" : "2px solid transparent", color: profileTab === "posts" ? "var(--text)" : "var(--text3)", padding: "10px 0", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.2s" }}>Posts</button>
        {false && <button onClick={() => setProfileTab("spots")} style={{ flex: 1, background: "none", border: "none", borderBottom: profileTab === "spots" ? "2px solid var(--green)" : "2px solid transparent", color: profileTab === "spots" ? "var(--text)" : "var(--text3)", padding: "10px 0", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.2s" }}>📍 Spots</button>}
      </div>

      {viewingProfilePost && createPortal(
        <div className="fade-in" style={{ position: "fixed", inset: 0, zIndex: 99999, background: "var(--bg)", overflowY: "auto", padding: "0 0 80px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "16px 16px 0" }}>
            <PostDetailPage postId={viewingProfilePost} user={currentUser} openSignIn={openSignIn} onBack={() => setViewingProfilePost(null)} onViewUser={onViewUser} />
          </div>
        </div>,
        document.body
      )}
      {profileTab === "posts" && (
        posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px", minHeight: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(120,180,80,0.08)", border: "1px solid rgba(120,180,80,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(120,180,80,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
            </div>
            <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 15, marginBottom: 6, fontFamily: "var(--font-display)" }}>{isOwnProfile ? "No posts yet" : `${displayName} hasn't posted yet`}</div>
            {isOwnProfile && <div style={{ color: "var(--text3)", fontSize: 13, lineHeight: 1.6 }}>Share your first hunt or catch</div>}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, background: "rgba(255,255,255,0.03)" }}>
            {posts.map(post => (
              <div key={post.id} className="fade-in" onClick={() => setViewingProfilePost(post.id)} style={{ position: "relative", aspectRatio: "1", overflow: "hidden", cursor: "pointer", background: "#0e1510" }}>
                {post.photo
                  ? <img src={post.photo} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: 12, padding: 8, textAlign: "center" }}>{post.caption?.slice(0, 60)}</div>
                }
                {post.species && <div style={{ position: "absolute", bottom: 6, left: 6, background: "rgba(8,20,8,0.85)", borderRadius: 10, padding: "2px 8px", fontSize: 10, fontWeight: 700, color: "var(--green)" }}>{post.species}</div>}
                {isOwnProfile && <button onClick={e => { e.stopPropagation(); deletePost(post.id); }} style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", color: "rgba(255,100,100,0.8)", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>}
              </div>
            ))}
          </div>
        )
      )}

      {profileTab === "spots" && (() => {
        const spots = posts.filter(p => p.lat && p.lng);
        if (spots.length === 0) return (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text3)", fontSize: 14, minHeight: 200 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📍</div>
            <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{isOwnProfile ? "No public spots yet" : `${displayName} hasn't shared any spots`}</div>
            {isOwnProfile && <div style={{ color: "var(--text3)", fontSize: 13 }}>Share a post with a location to add it here!</div>}
          </div>
        );
        return spots.map(post => {
          const ratingInfo = spotRatings[post.id] || { sum: 0, count: 0 };
          const avgRating = ratingInfo.count > 0 ? (ratingInfo.sum / ratingInfo.count).toFixed(1) : null;
          const myRating = userRatings[post.id] || 0;
          return (
            <div key={post.id} className="card fade-in" style={{ padding: 0, overflow: "hidden" }}>
              {post.photo && <img src={post.photo} style={{ width: "100%", maxHeight: 240, objectFit: "cover" }} />}
              <div style={{ padding: "14px 16px" }}>
                {(post.species || post.location) && (
                  <div style={{ display: "flex", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                    {post.species && <span style={{ background: "var(--green-dim)", border: "1px solid var(--border-accent)", color: "var(--green)", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{post.species}</span>}
                    {false && post.location && <span style={{ color: "var(--text2)", fontSize: 12 }}>📍 {post.location}</span>}
                  </div>
                )}
                {post.caption && <p style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.6, margin: 0, marginBottom: 10 }}>{post.caption}</p>}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "flex", gap: 2 }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} onClick={() => !isOwnProfile && rateSpot(post.id, star)} style={{ fontSize: 18, cursor: isOwnProfile ? "default" : "pointer", color: star <= myRating ? "#e8b020" : "rgba(255,255,255,0.2)", transition: "color 0.1s" }}>★</span>
                      ))}
                    </div>
                    {avgRating ? (
                      <span style={{ color: "var(--text3)", fontSize: 12 }}>{avgRating} · {ratingInfo.count} {ratingInfo.count === 1 ? "rating" : "ratings"}</span>
                    ) : (
                      <span style={{ color: "var(--text3)", fontSize: 12 }}>{isOwnProfile ? "No ratings yet" : "Be the first to rate"}</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <button onClick={() => saveToMap(post)} style={{ background: "none", border: "none", cursor: savedPinIds.has(post.id) ? "default" : "pointer", color: savedPinIds.has(post.id) ? "var(--text3)" : "var(--green)", fontSize: 12, fontWeight: 600, padding: 0, fontFamily: "var(--font-body)" }}>
                      {savedPinIds.has(post.id) ? "✓ Saved" : "Save to Map"}
                    </button>
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${post.lat},${post.lng}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)", fontSize: 12, fontWeight: 600 }}>Directions →</a>
                    {isOwnProfile && <button onClick={() => deletePost(post.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,100,100,0.5)", fontSize: 12, padding: 0, fontFamily: "var(--font-body)" }}>Delete</button>}
                  </div>
                </div>
              </div>
            </div>
          );
        });
      })()}
    </div>
  );
}
