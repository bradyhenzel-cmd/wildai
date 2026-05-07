import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

export function DatePickerInput({ value, onChange, minDate, maxDate, placeholder = "Select date..." }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = value ? new Date(value + "T12:00:00") : undefined;
  const displayValue = selected ? selected.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <button onClick={() => setOpen(o => !o)} type="button" style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", fontSize: 13, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: displayValue ? "var(--text)" : "var(--text3)", fontFamily: "var(--font-body)", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", boxSizing: "border-box" }}>
        <span>{displayValue || placeholder}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 9999, background: "#0d1a0d", border: "1px solid var(--border)", borderRadius: "var(--radius)", boxShadow: "0 8px 32px rgba(0,0,0,0.6)", padding: 8 }}>
          <style>{`
            .rdp { --rdp-accent-color: #8bc34a; --rdp-background-color: rgba(139,195,74,0.12); --rdp-accent-color-dark: #8bc34a; --rdp-background-color-dark: rgba(139,195,74,0.12); margin: 0; font-family: var(--font-body); }
            .rdp-day { color: var(--text2); border-radius: 8px; font-size: 13px; }
            .rdp-day:hover:not([disabled]) { background: rgba(139,195,74,0.12); color: var(--green); }
            .rdp-day_selected { background: var(--green) !important; color: #050a02 !important; font-weight: 700; }
            .rdp-day_today { font-weight: 700; color: var(--green); }
            .rdp-day_disabled { color: rgba(255,255,255,0.15) !important; cursor: not-allowed; }
            .rdp-caption { color: var(--text); font-weight: 700; }
            .rdp-nav_button { color: var(--text3); border-radius: 8px; }
            .rdp-nav_button:hover { background: rgba(255,255,255,0.08); color: var(--text); }
            .rdp-head_cell { color: var(--text3); font-size: 11px; font-weight: 600; }
          `}</style>
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(date) => {
              if (date) {
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, "0");
                const d = String(date.getDate()).padStart(2, "0");
                onChange(`${y}-${m}-${d}`);
              }
              setOpen(false);
            }}
            disabled={[
              minDate ? { before: minDate } : null,
              maxDate ? { after: maxDate } : null,
            ].filter(Boolean)}
            fromMonth={minDate || new Date(new Date().getFullYear() - 10, 0)}
            toMonth={maxDate || new Date(new Date().getFullYear() + 1, 11)}
          />
          {value && (
            <button onClick={() => { onChange(""); setOpen(false); }} style={{ width: "100%", padding: "8px", background: "none", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text3)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)", marginTop: 4 }}>Clear</button>
          )}
        </div>
      )}
    </div>
  );
}

export class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error("ErrorBoundary:", error, info); }
  render() {
    if (this.state.hasError) return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--text2)" }}>
        <div style={{ marginBottom: 8, display:"flex", justifyContent:"center" }}><AlertTriangle size={32} color="rgba(255,255,255,0.3)" /></div>
        <div style={{ color: "var(--text)", fontWeight: 600, marginBottom: 4 }}>Something went wrong</div>
        <div style={{ fontSize: 13 }}>Try refreshing the page</div>
      </div>
    );
    return this.props.children;
  }
}

const _reelsStyle = document.createElement('style');
_reelsStyle.textContent = `@keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`;
if (!document.head.querySelector('#reels-style')) { _reelsStyle.id = 'reels-style'; document.head.appendChild(_reelsStyle); }

export function capName(str) { if (!str) return "Hunter"; return str.charAt(0).toUpperCase() + str.slice(1); }
export function avatarColor(username) {
  const colors = [["#e05a2b", "#7a2000"], ["#2b7be0", "#0a3a7a"], ["#9b2be0", "#4a0a7a"], ["#2bc4b4", "#0a5a52"], ["#e02b6b", "#7a0a30"], ["#e0b02b", "#7a5500"], ["#2be05a", "#0a7a28"], ["#e02bb0", "#7a0a55"]];
  if (!username) return ["#3d7a25", "#1a3a0e"];
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export async function stripExif(file) {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d").drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => resolve(new File([blob], file.name, { type: "image/jpeg" })), "image/jpeg", 0.92);
    };
    img.onerror = () => resolve(file);
    img.src = url;
  });
}

let _showToast = null;
export function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = (msg, type = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };
  _showToast = show;
  return { toasts };
}
export function toast(msg, type = "info") { _showToast?.(msg, type); }
export function ToastContainer({ toasts }) {
  return createPortal(
    <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", zIndex: 999999, display: "flex", flexDirection: "column", gap: 8, alignItems: "center", pointerEvents: "none" }}>
      {toasts.map(t => (
        <div key={t.id} className="fade-in" style={{ background: t.type === "error" ? "rgba(220,50,50,0.95)" : t.type === "success" ? "rgba(45,90,27,0.97)" : "rgba(20,30,20,0.97)", color: "white", padding: "10px 20px", borderRadius: 24, fontSize: 14, fontWeight: 600, fontFamily: "var(--font-body)", boxShadow: "0 4px 24px rgba(0,0,0,0.4)", border: t.type === "success" ? "1px solid rgba(120,180,80,0.4)" : "1px solid rgba(255,255,255,0.1)", whiteSpace: "normal", maxWidth: "85vw", textAlign: "center" }}>
          {t.msg}
        </div>
      ))}
    </div>,
    document.body
  );
}

export function TypewriterText({ text, onDone }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed(""); let i = 0;
    let cancelled = false;
    const type = () => {
      if (cancelled) return;
      if (i < text.length) {
        const chunk = Math.floor(Math.random() * 3) + 1;
        i = Math.min(i + chunk, text.length);
        setDisplayed(text.slice(0, i));
        setTimeout(type, Math.random() * 20 + 15);
      } else {
        onDone?.();
      }
    };
    setTimeout(type, 50);
    return () => { cancelled = true; };
  }, [text]);
  return <span className="msg-bubble" dangerouslySetInnerHTML={{ __html: displayed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>") }} />;
}
export const fmtMsg = (t) => <span className="msg-bubble" dangerouslySetInnerHTML={{ __html: t.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>") }} />;
