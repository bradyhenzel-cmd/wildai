import { useState, useRef, useEffect } from "react";

const SUGGESTIONS = [
  "Best elk hunting setup for Montana?",
  "What's the best rod for trout fishing?",
  "How do I field dress a deer?",
  "Best time to hunt whitetail in the rut?",
  "What flies work best for fly fishing in fall?",
  "How do I plan a solo backcountry hunt?",
];

const CATEGORIES = ["All", "Hunting", "Fishing", "Gear", "Regulations", "Trip Planning"];
const FREE_LIMIT = 3;

function LandingPage({ onStart }) {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0f1f0f 0%, #1a3a1a 40%, #0f2a0f 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🦌</div>
        <h1 style={{ color: "#e8f5e8", fontSize: 52, fontWeight: 900, margin: 0, letterSpacing: "-2px", lineHeight: 1 }}>WildAI</h1>
        <p style={{ color: "#7ab87a", fontSize: 18, margin: "12px 0 0", fontWeight: 500 }}>Your expert hunting & fishing assistant</p>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: "8px 0 0", maxWidth: 400 }}>Get instant answers on gear, tactics, regulations, trip planning, and more — powered by AI.</p>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 48, flexWrap: "wrap", justifyContent: "center", maxWidth: 600 }}>
        {[
          { icon: "🎯", title: "Hunting Tactics", desc: "Species-specific strategies" },
          { icon: "🎣", title: "Fishing Tips", desc: "Gear, rigs & techniques" },
          { icon: "🗺️", title: "Trip Planning", desc: "Public land & logistics" },
          { icon: "📋", title: "Regulations", desc: "State-by-state rules" },
        ].map((f, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "20px 24px", textAlign: "center", minWidth: 120, flex: 1 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{f.icon}</div>
            <div style={{ color: "#e8f5e8", fontWeight: 700, fontSize: 14 }}>{f.title}</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 4 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      <button onClick={onStart} style={{ background: "linear-gradient(135deg, #5a9a5a, #2d6a2d)", color: "white", border: "none", padding: "18px 48px", borderRadius: 16, fontSize: 18, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 32px rgba(45,106,45,0.4)" }}>
        Start Asking →
      </button>
      <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, marginTop: 16 }}>Free to try · No account needed</p>
    </div>
  );
}

function ChatPage({ onBack, messageCount, setMessageCount }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hey! I'm WildAI — your hunting and fishing assistant. Ask me anything about gear, tactics, seasons, regulations, or trip planning. What are you after?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const bottomRef = useRef(null);
  const hitLimit = messageCount >= FREE_LIMIT;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const formatMessage = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br/>");
  };

  const sendMessage = async (text) => {
    const msg = text || input;
    if (!msg.trim() || hitLimit) return;
    const newMessages = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setMessageCount(messageCount + 1);

    const response = await fetch("http://localhost:3001/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages.map((m) => ({ role: m.role, content: m.content })) }),
    });
    const data = await response.json();
    setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0f1f0f 0%, #1a3a1a 40%, #0f2a0f 100%)", display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 16px", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{ width: "100%", maxWidth: 720, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontSize: 13 }}>← Back</button>
        <span style={{ color: "#e8f5e8", fontWeight: 800, fontSize: 20 }}>🦌 WildAI</span>
        <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "6px 14px", color: hitLimit ? "#ff6b6b" : "#7ab87a", fontSize: 13, fontWeight: 600 }}>
          {hitLimit ? "Limit reached" : `${FREE_LIMIT - messageCount} free left`}
        </div>
      </div>

      {/* Category Pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", justifyContent: "center", width: "100%", maxWidth: 720 }}>
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setActiveCategory(c)} style={{ background: activeCategory === c ? "linear-gradient(135deg, #5a9a5a, #2d6a2d)" : "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: activeCategory === c ? "white" : "rgba(255,255,255,0.5)", padding: "6px 16px", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
            {c}
          </button>
        ))}
      </div>

      {/* Chat Box */}
      <div style={{ width: "100%", maxWidth: 720, background: "rgba(255,255,255,0.04)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.4)", display: "flex", flexDirection: "column" }}>

        {/* Messages */}
        <div style={{ overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16, minHeight: 400, maxHeight: 480 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 10 }}>
              {m.role === "assistant" && (
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #5a9a5a, #2d6a2d)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>🦌</div>
              )}
              <div
                dangerouslySetInnerHTML={{ __html: formatMessage(m.content) }}
                style={{ background: m.role === "user" ? "linear-gradient(135deg, #5a9a5a, #2d6a2d)" : "rgba(255,255,255,0.07)", color: "#e8f5e8", padding: "12px 16px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", maxWidth: "75%", fontSize: 15, lineHeight: 1.7, border: m.role === "assistant" ? "1px solid rgba(255,255,255,0.08)" : "none" }}
              />
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #5a9a5a, #2d6a2d)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🦌</div>
              <div style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)", padding: "12px 16px", borderRadius: "18px 18px 18px 4px", color: "#7ab87a", fontSize: 15 }}>Thinking...</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length < 3 && !hitLimit && (
          <div style={{ padding: "0 24px 16px", display: "flex", gap: 8, flexWrap: "wrap" }}>
            {SUGGESTIONS.slice(0, 3).map((s, i) => (
              <button key={i} onClick={() => sendMessage(s)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontSize: 13 }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Paywall */}
        {hitLimit && (
          <div style={{ margin: "0 24px 16px", background: "linear-gradient(135deg, rgba(90,154,90,0.15), rgba(45,106,45,0.15))", border: "1px solid rgba(90,154,90,0.3)", borderRadius: 16, padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
            <div style={{ color: "#e8f5e8", fontWeight: 700, fontSize: 18, marginBottom: 6 }}>You've used your 3 free messages</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginBottom: 16 }}>Upgrade to WildAI Pro for unlimited hunting & fishing advice</div>
            <button style={{ background: "linear-gradient(135deg, #5a9a5a, #2d6a2d)", color: "white", border: "none", padding: "14px 32px", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
              Upgrade for $9.99/month →
            </button>
          </div>
        )}

        {/* Input */}
        {!hitLimit && (
          <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: 12 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask anything about hunting or fishing..."
              style={{ flex: 1, padding: "13px 18px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.07)", color: "white", fontSize: 15, outline: "none" }}
            />
            <button onClick={() => sendMessage()} style={{ background: "linear-gradient(135deg, #5a9a5a, #2d6a2d)", color: "white", border: "none", padding: "13px 24px", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              Send →
            </button>
          </div>
        )}
      </div>

      <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, marginTop: 16 }}>Powered by AI · Built for hunters & anglers</p>
    </div>
  );
}

function App() {
  const [page, setPage] = useState("landing");
  const [messageCount, setMessageCount] = useState(0);

  return page === "landing"
    ? <LandingPage onStart={() => setPage("chat")} />
    : <ChatPage onBack={() => setPage("landing")} messageCount={messageCount} setMessageCount={setMessageCount} />;
}

export default App;