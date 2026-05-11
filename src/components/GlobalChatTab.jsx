import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";
import { capName } from "../utils";

export default function GlobalChatTab({ user, openSignIn }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("global_chat").select("*, profiles(username, avatar_url)").order("created_at", { ascending: true }).limit(100);
      setMessages(data || []);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };
    load();
    const sub = supabase.channel("global_chat").on("postgres_changes", { event: "INSERT", schema: "public", table: "global_chat" }, async payload => {
      const { data } = await supabase.from("profiles").select("username, avatar_url").eq("user_id", payload.new.user_id).single();
      setMessages(prev => [...prev, { ...payload.new, profiles: data }]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }).subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  const send = async () => {
    if (!user) { openSignIn(); return; }
    if (!input.trim() || sending) return;
    setSending(true);
    await supabase.from("global_chat").insert({ user_id: user.id, message: input.trim() });
    setInput("");
    setSending(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100dvh - 160px)" }}>
      <div style={{ padding: "12px 16px 6px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)", fontFamily: "var(--font-display)" }}>Global Chat</div>
        <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>Chat with hunters & anglers across Ravlin</div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map(msg => {
          const isMe = user && msg.user_id === user.id;
          return (
            <div key={msg.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", flexDirection: isMe ? "row-reverse" : "row" }}>
              {!isMe && <div className="avatar-img" style={{ width: 30, height: 30, background: "var(--card)" }}>
                {msg.profiles?.avatar_url ? <img src={msg.profiles.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "var(--text3)" }}>{capName(msg.profiles?.username || "?")[0]}</div>}
              </div>}
              <div style={{ maxWidth: "70%" }}>
                {!isMe && <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 2, fontWeight: 600 }}>{capName(msg.profiles?.username || "Hunter")}</div>}
                <div style={{ background: isMe ? "linear-gradient(135deg, #2d5a1b, #1e4010)" : "var(--card)", border: `1px solid ${isMe ? "rgba(120,180,80,0.3)" : "var(--border)"}`, borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "8px 12px", fontSize: 14, color: "var(--text)", lineHeight: 1.5 }}>{msg.message}</div>
                <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 3, textAlign: isMe ? "right" : "left" }}>{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, alignItems: "center" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder={user ? "Say something..." : "Sign in to chat"}
          style={{ flex: 1, padding: "10px 14px", borderRadius: 20, fontSize: 14, background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "var(--font-body)", outline: "none" }}
        />
        <button onClick={send} disabled={!input.trim() || sending} style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #3a7020, #2d5a1a)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: !input.trim() ? 0.4 : 1, transition: "opacity 0.2s" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
        </button>
      </div>
    </div>
  );
}
