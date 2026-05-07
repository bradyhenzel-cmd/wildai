import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../supabase";
import { capName, stripExif, toast } from "../utils";

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

export default function MessagesTab({ user, openSignIn, onUnreadChange }) {
  const [view, setView] = useState("inbox");
  const [inbox, setInbox] = useState([]);
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [deletingThread, setDeletingThread] = useState(null);

  const deleteThread = (otherId) => {
    const key = `hidden_threads_${user.id}`;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(key, JSON.stringify([...existing, otherId]));
    setInbox(prev => {
      const updated = prev.filter(t => t.otherId !== otherId);
      onUnreadChange?.(updated.reduce((sum, t) => sum + (t.unread || 0), 0));
      return updated;
    });
    setDeletingThread(null);
    toast("Conversation removed.", "dark");
  };
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [drafts, setDrafts] = useState({});
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const bottomRef = useRef(null);

  const loadInbox = async () => {
    const hiddenKey = `hidden_threads_${user?.id}`;
    const hidden = new Set(JSON.parse(localStorage.getItem(hiddenKey) || "[]"));
    if (!user) return;
    setLoadingInbox(true);
    const res = await fetch(`https://wildai-server.onrender.com/messages/inbox?userId=${user.id}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      const { data: blocks } = await supabase.from("blocked_users").select("blocked_id").eq("blocker_id", user.id);
      const blockedSet = new Set((blocks || []).map(b => b.blocked_id));
      const enriched = await Promise.all(data.filter(t => !blockedSet.has(t.otherId) && !hidden.has(t.otherId)).map(async t => {
        const { data: profile } = await supabase.from("profiles").select("username, avatar_url, last_seen").eq("user_id", t.otherId).single();
        return { ...t, username: profile?.username || "Hunter", avatar: profile?.avatar_url, last_seen: profile?.last_seen };
      }));
      setInbox(enriched);
      const total = enriched.reduce((sum, t) => sum + (t.unread || 0), 0);
      onUnreadChange?.(total);
    }
    setLoadingInbox(false);
  };

  const loadConversation = async (otherId) => {
    if (!user) return;
    const res = await fetch(`https://wildai-server.onrender.com/messages/conversation/${otherId}?userId=${user.id}`);
    const data = await res.json();
    setMessages(Array.isArray(data) ? data : []);
  };

  const searchUsers = async (q) => {
    if (!q.trim()) { setSearchResults([]); return; }
    const { data } = await supabase.from("profiles").select("user_id, username, avatar_url").ilike("username", `%${q}%`).limit(10);
    setSearchResults((data || []).filter(u => u.username && u.user_id !== user?.id));
  };

  const openThread = async (otherId, username, avatar) => {
    const key = `hidden_threads_${user?.id}`;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(key, JSON.stringify(existing.filter(id => id !== otherId)));
    setDrafts(d => ({ ...d, [activeThread?.otherId]: input }));
    setInput("");
    setActiveThread({ otherId, username, avatar });
    setTimeout(() => setInput(drafts[otherId] || ""), 0);
    setView("thread");
    document.body.classList.add("dm-fullscreen");
    await loadConversation(otherId);
    if (user) {
      fetch("https://wildai-server.onrender.com/messages/mark-read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, otherId }) });
      supabase.from("messages").update({ seen_at: new Date().toISOString() }).eq("recipient_id", user.id).eq("sender_id", otherId).is("seen_at", null);
    }
  };

  const send = async () => {
    if (!input.trim() || !user || !activeThread) return;
    setSending(true);
    const res = await fetch("https://wildai-server.onrender.com/messages/send", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender_id: user.id, recipient_id: activeThread.otherId, content: input.trim() })
    });
    const msg = await res.json();
    setMessages(prev => [...prev, msg]);
    setInput("");
    setSending(false);
  };

  const sendImage = async (file) => {
    if (!file || !user || !activeThread) return;
    file = await stripExif(file);
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const { error } = await supabase.storage.from("post-photos").upload(fileName, file, { contentType: file.type });
    if (error) { toast("Image upload failed.", "error"); return; }
    const { data: urlData } = supabase.storage.from("post-photos").getPublicUrl(fileName);
    await fetch("https://wildai-server.onrender.com/messages/send", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender_id: user.id, recipient_id: activeThread.otherId, image_url: urlData.publicUrl })
    });
    await loadConversation(activeThread.otherId);
  };

  useEffect(() => { if (user) loadInbox(); }, [user]);

  useEffect(() => {
    const check = () => {
      if (window._openMessageThread && user) {
        const id = window._openMessageThread;
        window._openMessageThread = null;
        supabase.from("profiles").select("username, avatar_url").eq("user_id", id).single().then(({ data }) => {
          openThread(id, data?.username || "Hunter", data?.avatar_url);
        });
      }
    };
    check();
    const t = setTimeout(check, 300);
    return () => clearTimeout(t);
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel("inbox-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${user.id}` }, (payload) => {
        const senderId = payload.new.sender_id;
        const key = `hidden_threads_${user.id}`;
        const existing = JSON.parse(localStorage.getItem(key) || "[]");
        localStorage.setItem(key, JSON.stringify(existing.filter(id => id !== senderId)));
        loadInbox();
      }).subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  useEffect(() => {
    if (!user || !activeThread) return;
    const channel = supabase.channel("messages-" + activeThread.otherId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${user.id}` }, payload => {
        if (payload.new.sender_id === activeThread.otherId) {
          setMessages(prev => [...prev, payload.new]);
          supabase.from("messages").update({ seen_at: new Date().toISOString() }).eq("id", payload.new.id);
        }
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages" }, payload => {
        setMessages(prev => prev.filter(m => m.id !== payload.old.id));
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user, activeThread]);

  if (!user) return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text3)", fontSize: 14 }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
      <div style={{ color: "var(--text)", fontWeight: 600, marginBottom: 6 }}>Sign in to message</div>
      <button onClick={openSignIn} className="btn-primary" style={{ padding: "8px 20px", fontSize: 13 }}>Sign In</button>
    </div>
  );

  if (view === "thread" && activeThread) return createPortal(
    <div className="fade-in" style={{ position: "fixed", inset: 0, zIndex: 99999, background: "var(--bg)", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 760, display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ borderBottom: "1px solid var(--border)", padding: "12px 16px", display: "flex", alignItems: "center", position: "relative", flexShrink: 0 }}>
          <button onClick={() => { setView("inbox"); loadInbox(); document.body.classList.remove("dm-fullscreen"); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text2)", fontSize: 14, padding: 0, flexShrink: 0 }}>← Back</button>
          <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "var(--green-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "var(--green)", flexShrink: 0, overflow: "hidden", boxShadow: "0 0 0 2px #78b450" }}>
              {activeThread.avatar ? <img src={activeThread.avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : activeThread.username?.[0]?.toUpperCase()}
            </div>
            <span style={{ color: "var(--text)", fontWeight: 700, fontSize: 15 }}>{capName(activeThread.username)}</span>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 8px" }}>
          <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 8 }}>
            {messages.map(m => (
              <div key={m.id} style={{ display: "flex", justifyContent: m.sender_id === user.id ? "flex-end" : "flex-start", flexDirection: "column", alignItems: m.sender_id === user.id ? "flex-end" : "flex-start" }}>
                {m.shared_post_id ? (
                  <div onClick={(e) => { e.stopPropagation(); if (window._openPost) { window._openPost(m.shared_post_id); } else { window._pendingPost = m.shared_post_id; } }} style={{ maxWidth: "75%", borderRadius: 16, overflow: "hidden", border: "1px solid #1c2a1c", cursor: "pointer", background: "#0e1510" }}>
                    {m.shared_post_photo && <img src={m.shared_post_photo} style={{ width: "100%", maxHeight: 180, objectFit: "cover", display: "block" }} />}
                    <div style={{ padding: "10px 12px" }}>
                      <div style={{ color: "var(--green)", fontWeight: 700, fontSize: 12, marginBottom: 3 }}>{capName(m.shared_post_username)}</div>
                      {m.shared_post_caption && <div style={{ color: "var(--text2)", fontSize: 12, lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{m.shared_post_caption}</div>}
                      <div style={{ color: "var(--text3)", fontSize: 11, marginTop: 6 }}>Tap to view post</div>
                    </div>
                  </div>
                ) : m.image_url ? (
                  <img src={m.image_url} style={{ maxWidth: "70%", borderRadius: 12, maxHeight: 200, objectFit: "cover" }} />
                ) : m.pin_lat ? (
                  <div style={{ background: "linear-gradient(135deg, rgba(45,90,27,0.3), rgba(30,64,16,0.25))", border: "1px solid var(--border-accent)", borderRadius: 16, padding: "14px 16px", maxWidth: "75%", backdropFilter: "blur(8px)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(120,180,80,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--green)" stroke="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" fill="#0d1a0d" /></svg>
                      </div>
                      <div>
                        <div style={{ color: "var(--green)", fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{m.pin_name || "Shared Pin"}</div>
                        <div style={{ color: "var(--text3)", fontSize: 10, marginTop: 2 }}>Shared a pin</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <a href={`https://www.google.com/maps/dir/?api=1&destination=${m.pin_lat},${m.pin_lng}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textAlign: "center", padding: "7px 0", background: "rgba(120,180,80,0.15)", border: "1px solid rgba(120,180,80,0.25)", borderRadius: 8, color: "var(--green)", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>Directions</a>
                      {m.sender_id !== user.id && (
                        <button onClick={() => { supabase.from("saved_pins").insert({ user_id: user.id, name: m.pin_name || "Shared Pin", lat: m.pin_lat, lng: m.pin_lng, location: m.pin_name || "Shared Pin" }).then(() => toast("📍 Saved to your map!", "success")); }} style={{ flex: 1, padding: "7px 0", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "var(--text2)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" }}>Save to Map</button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: m.sender_id === user.id ? "flex-end" : "flex-start", maxWidth: "70%" }}>
                    <div style={{ background: m.sender_id === user.id ? "var(--green)" : "rgba(255,255,255,0.07)", borderRadius: m.sender_id === user.id ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "10px 14px", fontSize: 14, color: m.sender_id === user.id ? "#fff" : "var(--text)", lineHeight: 1.5, wordBreak: "break-word", overflowWrap: "break-word", cursor: m.sender_id === user.id ? "pointer" : "default" }}
                      onPointerDown={(e) => {
                        if (m.sender_id !== user.id) return;
                        const el = e.currentTarget;
                        el._pressTimer = setTimeout(() => {
                          const ageMinutes = (Date.now() - new Date(m.created_at)) / 60000;
                          if (ageMinutes > 5) { toast("You can only delete messages within 5 minutes of sending.", "error"); return; }
                          navigator.vibrate?.(40);
                          el.style.transition = "transform 0.1s ease-out, opacity 0.1s, filter 0.1s";
                          el.style.transform = "scale(1.12)";
                          el.style.filter = "brightness(1.4)";
                          setTimeout(() => {
                            el.style.transition = "transform 0.2s ease-in, opacity 0.2s";
                            el.style.transform = "scale(1.5)";
                            el.style.opacity = "0";
                            setTimeout(() => {
                              supabase.from("messages").delete().eq("id", m.id).then(() => setMessages(prev => prev.filter(msg => msg.id !== m.id)));
                            }, 200);
                          }, 100);
                        }, 500);
                      }}
                      onPointerUp={(e) => { clearTimeout(e.currentTarget._pressTimer); }}
                      onPointerLeave={(e) => { clearTimeout(e.currentTarget._pressTimer); }}>
                      {m.content}
                    </div>
                    {m.sender_id === user.id && (() => {
                      const isLast = messages.filter(msg => msg.sender_id === user.id).slice(-1)[0]?.id === m.id;
                      if (!isLast) return null;
                      return <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>{m.seen_at ? "Seen" : "Delivered"}</div>;
                    })()}
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", borderTop: "1px solid var(--border)", padding: "10px 16px 24px", flexShrink: 0, marginTop: "auto" }}>
          <label style={{ cursor: "pointer", color: "var(--text3)", fontSize: 20, lineHeight: 1 }}>
            📎<input type="file" accept="image/*" style={{ display: "none" }} onChange={e => sendImage(e.target.files[0])} />
          </label>
          <PinPicker user={user} onSelect={async (pin) => {
            await fetch("https://wildai-server.onrender.com/messages/send", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sender_id: user.id, recipient_id: activeThread.otherId, pin_lat: pin.lat, pin_lng: pin.lng, pin_name: pin.name || pin.location || "Shared Pin" })
            });
            await loadConversation(activeThread.otherId);
          }} />
          <input value={input} onChange={e => setInput(e.target.value.slice(0, 1000))} onKeyDown={e => e.key === "Enter" && send()} placeholder="Message..." style={{ flex: 1, padding: "11px 16px", borderRadius: 24, fontSize: 15, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "var(--font-body)" }} />
          <button onClick={send} disabled={!input.trim() || sending} className="btn-primary" style={{ padding: "9px 16px", fontSize: 13, borderRadius: 20, opacity: !input.trim() ? 0.5 : 1 }}>Send</button>
        </div>
      </div>
    </div>, document.body
  );

  const totalUnread = inbox.reduce((sum, t) => sum + (t.unread || 0), 0);

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>


      {!loadingInbox && inbox.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text3)", fontSize: 14 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
          <div style={{ color: "var(--text)", fontWeight: 600, marginBottom: 6 }}>No messages yet</div>
          Search for a user above to start a conversation
        </div>
      )}
      {inbox.map(t => (
        <div key={t.otherId} style={{ borderRadius: "var(--radius)", overflow: "hidden" }}>
          {deletingThread === t.otherId && createPortal(
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setDeletingThread(null)}>
              <div onClick={e => e.stopPropagation()} style={{ background: "#0d1a0d", border: "1px solid var(--border)", borderRadius: 16, padding: 24, maxWidth: 300, width: "90%", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🗑️</div>
                <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Delete conversation?</div>
                <div style={{ color: "var(--text2)", fontSize: 13, marginBottom: 20 }}>This will remove this conversation from your inbox.</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setDeletingThread(null)} style={{ flex: 1, padding: "10px", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", color: "var(--text2)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>Cancel</button>
                  <button onClick={() => deleteThread(t.otherId)} style={{ flex: 1, padding: "10px", borderRadius: 10, background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.4)", color: "#f43f5e", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>Delete</button>
                </div>
              </div>
            </div>, document.body
          )}
          <div style={{ display: "flex", transform: "translateX(0)", transition: "transform 0.2s" }}
            onTouchStart={e => { e.currentTarget._startX = e.touches[0].clientX; }}
            onTouchMove={e => { const dx = Math.min(0, Math.max(-80, e.touches[0].clientX - e.currentTarget._startX)); e.currentTarget.style.transform = `translateX(${dx}px)`; e.currentTarget.style.transition = "none"; }}
            onTouchEnd={e => { const dx = e.changedTouches[0].clientX - e.currentTarget._startX; if (dx < -40) { e.currentTarget.style.transform = "translateX(-80px)"; } else { e.currentTarget.style.transform = "translateX(0)"; } e.currentTarget.style.transition = "transform 0.2s"; }}>
            <div onClick={() => { openThread(t.otherId, t.username, t.avatar); setInbox(prev => { const updated = prev.map(i => i.otherId === t.otherId ? { ...i, unread: 0 } : i); setTimeout(() => onUnreadChange?.(updated.reduce((sum, i) => sum + (i.unread || 0), 0)), 0); return updated; }); }} style={{ flex: "0 0 100%", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }} onMouseEnter={e => e.currentTarget.style.background = "rgba(120,180,80,0.05)"} onMouseLeave={e => e.currentTarget.style.background = "var(--card)"}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--green-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "var(--green)", overflow: "hidden", boxShadow: "0 0 0 2px #78b450, 0 0 10px rgba(120,180,80,0.25)" }}>
                  {t.avatar ? <img src={t.avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : t.username?.[0]?.toUpperCase()}
                </div>
                {t.last_seen && (Date.now() - new Date(t.last_seen)) < 5 * 60 * 1000 && (
                  <div style={{ position: "absolute", bottom: -2, right: -2, width: 11, height: 11, borderRadius: "50%", background: "#4ade80", border: "2px solid #0d140d" }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 3 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "var(--text)", fontWeight: 600, fontSize: 14, lineHeight: 1 }}>{capName(t.username)}</span>
                  <span style={{ color: "var(--text3)", fontSize: 11 }}>{new Date(t.lastMessage.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                </div>
                <div style={{ color: "var(--text3)", fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1 }}>
                  {t.lastMessage.image_url ? "📷 Photo" : t.lastMessage.pin_lat ? "📍 Shared a pin" : t.lastMessage.content}
                </div>
              </div>
              {t.unread > 0 && <div style={{ background: "#f43f5e", borderRadius: 20, minWidth: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "white", padding: "0 5px", flexShrink: 0, boxShadow: "0 2px 8px rgba(244,63,94,0.4)" }}>{t.unread > 9 ? "9+" : t.unread}</div>}
            </div>
            <button onClick={() => setDeletingThread(t.otherId)} style={{ flex: "0 0 80px", background: "#f43f5e", border: "none", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, fontFamily: "var(--font-body)", borderRadius: "var(--radius)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>
              Delete
            </button>
          </div>
        </div>))}
    </div>
  );
}
