import React, { useState, useEffect } from "react";
import { useClerk } from '@clerk/react';

export default function LandingPage({ onStart, onSignIn, onGuest, selectedState, setSelectedState, onTerms }) {
  const { openSignIn } = useClerk();

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS] = useState(() => /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone);
  const [isInstalled] = useState(() => window.navigator.standalone === true);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
  };

  return (
    <div style={{ minHeight: "100dvh", fontFamily: "var(--font-body)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: `url(/bg.jpg)`, backgroundSize: "cover", backgroundPosition: "center 30%", backgroundRepeat: "no-repeat", zIndex: 0 }} />
      <div style={{ position: "fixed", inset: 0, background: "linear-gradient(to bottom, rgba(5,10,5,0.0) 0%, rgba(5,10,5,0.15) 40%, rgba(5,10,5,0.75) 100%)", zIndex: 1 }} />

      <div style={{ position: "relative", zIndex: 2, minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px 80px", textAlign: "center" }}>
        <div style={{ background: "rgba(5,10,5,0.25)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.12)", borderTop: "1px solid rgba(255,255,255,0.2)", borderRadius: 28, padding: "40px 32px 32px", width: "100%", maxWidth: 380, position: "relative", overflow: "hidden" }}>
          <img src="/badge1.png" style={{ width: "100%", height: "100%", objectFit: "contain", opacity: 0.16, position: "absolute", top: window.innerWidth < 500 ? "18%" : "22%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 0, pointerEvents: "none" }} />
          <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 8, zIndex: 1 }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(42px,8vw,64px)", fontWeight: 700, lineHeight: 1.0, color: "white", letterSpacing: "0.02em", marginBottom: 8 }}>Ravlin</h1>
            <p style={{ color: "rgba(238,245,232,0.6)", fontSize: 13, lineHeight: 1.5, marginBottom: 12, fontFamily: "var(--font-display)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>Hunt. Fish. Connect.</p>
          </div>

          <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            {["Your spots stay private — always", "Get answers for your exact state", "Weather, solunar & species guides", "Drop private pins on your best spots", "Community for hunters & anglers"].map((text) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", flexShrink: 0 }} />
                <span style={{ color: "rgba(238,245,232,0.7)", fontSize: 13, fontWeight: 400, lineHeight: 1.4 }}>{text}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={() => openSignIn()} style={{ padding: "15px 32px", fontSize: 16, fontWeight: 700, borderRadius: 14, background: "linear-gradient(135deg, #3a7020, #2d5a1a)", border: "1px solid rgba(120,180,80,0.5)", color: "white", cursor: "pointer", fontFamily: "var(--font-body)", boxShadow: "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(120,180,80,0.2)", transition: "transform 0.15s, box-shadow 0.15s" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(60,140,30,0.5)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.4)"; }} onMouseDown={e => e.currentTarget.style.transform = "scale(0.96)"} onMouseUp={e => e.currentTarget.style.transform = "translateY(-2px)"} onTouchStart={e => e.currentTarget.style.transform = "scale(0.96)"} onTouchEnd={e => { const el = e.currentTarget; el.style.transform = "scale(1.02)"; setTimeout(() => { if (el) el.style.transform = "scale(1)"; }, 150); }}>Sign In / Sign Up</button>

            <button
              onClick={onGuest}
              style={{ padding: "12px 24px", fontSize: 14, fontWeight: 600, borderRadius: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(238,245,232,0.82)", cursor: "pointer", fontFamily: "var(--font-body)" }}
            >
              Continue as Guest
            </button>

          </div>
          <button onClick={onTerms} style={{ background: "none", border: "none", color: "rgba(238,245,232,0.15)", fontSize: 11, cursor: "pointer", fontFamily: "var(--font-body)", marginTop: 16 }}>Terms & Conditions</button>
        </div>
      </div>
    </div>
  );
}
