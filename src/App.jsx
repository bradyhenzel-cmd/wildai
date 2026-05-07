import React, { useState, useEffect } from "react";
import { supabase } from './supabase';
import { useUser, useClerk } from '@clerk/react';
import { Bell } from "lucide-react";
import { ErrorBoundary, ToastContainer, useToast } from './utils';
import { TermsPage } from './components/AdminTab';
import LandingPage from './components/LandingPage';
import OnboardingPage from './components/OnboardingPage';
import ChatPage from './components/ChatPage';

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');
  * { box-sizing:border-box; margin:0; padding:0; word-break:break-word; overflow-wrap:break-word; -webkit-tap-highlight-color:transparent; }
  .cl-rootBox, .cl-modalBackdrop, .cl-modalContent, [data-clerk-modal], #clerk-modal { z-index: 999999999 !important; }
  :root {
    --bg:#080c08; --bg2:#0d120d;
    --card:rgba(255,255,255,0.035); --card2:rgba(255,255,255,0.055); --card-hover:rgba(255,255,255,0.07);
    --border:rgba(255,255,255,0.09); --border-accent:rgba(139,195,74,0.35);
    --border-top:rgba(255,255,255,0.16);
    --green:#8bc34a; --green2:#6ea832; --green-light:#a5d65a; --green-dim:rgba(139,195,74,0.1);
    --amber:#c8922a; --amber-dim:rgba(200,146,42,0.12);
    --text:#eef2eb; --text2:rgba(238,242,235,0.65); --text3:rgba(238,242,235,0.38);
    --font-display:'Cinzel',Georgia,serif;
    --font-body:'DM Sans',system-ui,sans-serif;
    --radius:18px; --radius-sm:12px; --radius-xs:8px;
    --green-glow:rgba(139,195,74,0.18);
    --shadow-sm:0 1px 3px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.25);
    --shadow-md:0 4px 16px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.3);
    --shadow-lg:0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4);
    --shadow-green:0 4px 20px rgba(139,195,74,0.25), 0 1px 4px rgba(139,195,74,0.15);
  }
  body { background:var(--bg); color:var(--text); font-family:var(--font-body); font-size:15px; line-height:1.5; -webkit-font-smoothing:antialiased; }
  button { transition: transform 0.12s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.15s ease, background 0.15s ease; }
  button:active { transform: scale(0.95) !important; }

  body::before { content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
    background:
      radial-gradient(ellipse 70% 45% at 50% 0%, rgba(60,100,20,0.08) 0%, transparent 70%),
      radial-gradient(ellipse 50% 35% at 0% 50%, rgba(40,80,10,0.05) 0%, transparent 60%),
      radial-gradient(ellipse 40% 30% at 100% 60%, rgba(30,60,10,0.04) 0%, transparent 55%); }
  .grain { position:fixed; inset:0; pointer-events:none; z-index:100; opacity:0.03;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size:180px; }

  .fade-in { animation:none; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .slide-up { animation:slideUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards; opacity:0; }
  @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  .pulse { animation:pulse 2.2s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  .float { animation:float 5s ease-in-out infinite; }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes likePop { 0%{transform:scale(1)} 30%{transform:scale(1.4)} 60%{transform:scale(0.92)} 80%{transform:scale(1.1)} 100%{transform:scale(1)} }
  .like-pop { animation:likePop 0.45s cubic-bezier(0.36,0.07,0.19,0.97); }

  input, textarea, select { font-size: 16px !important; scroll-margin-bottom: 20px; }
  body.map-fullscreen header, body.map-fullscreen .bottom-nav { display: none !important; }
  body.dm-fullscreen header, body.dm-fullscreen .bottom-nav { display: none !important; }
  body.dm-fullscreen { overflow: hidden; }
  body.dm-fullscreen > div { transform: none !important; filter: none !important; will-change: auto !important; }

  @media (max-width: 480px) {
    .hide-mobile { display: none !important; }
    .card { padding: 10px !important; }
    .btn-primary, .btn-ghost { padding: 8px 13px !important; font-size: 13px !important; }
    h2 { font-size: 84% !important; }
    .fade-in { gap: 10px !important; }
    input, textarea, select { font-size: 16px !important; }
    .nav-tab { padding: 6px 13px !important; font-size: 12px !important; }
    .checklist-item { padding: 10px 13px !important; font-size: 13px !important; }
    .weather-stat { padding: 10px 8px !important; }
    .msg-bubble { font-size: 13.5px !important; }
  }

  /* ── Buttons ── */
  .btn-primary {
    background: linear-gradient(160deg, var(--green-light) 0%, var(--green) 45%, var(--green2) 100%);
    color: #050a02; border: none; border-radius: var(--radius-sm);
    font-family: var(--font-body); font-weight: 700; font-size: 14px; letter-spacing: 0.01em;
    cursor: pointer; padding: 11px 20px;
    box-shadow: var(--shadow-green), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.2);
    transition: all 180ms cubic-bezier(0.4,0,0.2,1); }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(139,195,74,0.4), 0 2px 8px rgba(139,195,74,0.2), inset 0 1px 0 rgba(255,255,255,0.25); }
  .btn-primary:active { transform: translateY(0) scale(0.97) !important; box-shadow: 0 1px 4px rgba(139,195,74,0.2), inset 0 2px 6px rgba(0,0,0,0.25); }

  .btn-ghost {
    background: rgba(255,255,255,0.04); border: 1px solid var(--border);
    color: var(--text2); border-radius: var(--radius-sm);
    font-family: var(--font-body); font-weight: 500; font-size: 14px;
    cursor: pointer; padding: 10px 18px;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
    transition: all 180ms cubic-bezier(0.4,0,0.2,1); }
  .btn-ghost:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.18); color: var(--text); transform: translateY(-1px); box-shadow: var(--shadow-sm), inset 0 1px 0 rgba(255,255,255,0.08); }
  .btn-ghost:active { transform: translateY(0) scale(0.97) !important; }

  .btn-gold {
    background: linear-gradient(160deg, #f5cc45 0%, #e8b020 50%, #c98c10 100%);
    border: none; color: #0d0800; font-family: var(--font-body); font-weight: 700; font-size: 14px;
    cursor: pointer; border-radius: var(--radius-sm); padding: 11px 20px;
    box-shadow: 0 4px 20px rgba(232,176,32,0.4), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.15);
    transition: all 180ms cubic-bezier(0.4,0,0.2,1); }
  .btn-gold:hover { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(232,176,32,0.55), inset 0 1px 0 rgba(255,255,255,0.35); }
  .btn-gold:active { transform: translateY(0) scale(0.97) !important; }

  /* ── Cards ── */
  .card {
    background: linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--border); border-top-color: rgba(255,255,255,0.14);
    border-radius: var(--radius); box-shadow: var(--shadow-md);
    transition: all 200ms cubic-bezier(0.4,0,0.2,1); }
  .card:hover { border-color: rgba(255,255,255,0.15); border-top-color: rgba(255,255,255,0.22); box-shadow: var(--shadow-lg), 0 0 24px rgba(139,195,74,0.05); transform: translateY(-1px); }

  /* ── Tags ── */
  .tag { display:inline-flex; align-items:center; padding:3px 10px; border-radius:20px; font-size:10px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; }
  .tag-hunt { background:rgba(200,146,42,0.15); color:var(--amber); border:1px solid rgba(200,146,42,0.25); }
  .tag-fish { background:rgba(80,140,220,0.15); color:#7ab0e0; border:1px solid rgba(80,140,220,0.25); }

  /* ── Inputs ── */
  select, input, textarea {
    font-family: var(--font-body); font-size: 15px;
    background: rgba(255,255,255,0.05); border: 1px solid var(--border);
    border-top-color: rgba(255,255,255,0.12);
    color: var(--text); outline: none;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
    transition: border-color 0.18s, box-shadow 0.18s; }
  select:focus, input:focus, textarea:focus {
    border-color: var(--border-accent);
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.2), 0 0 0 3px rgba(139,195,74,0.08); }
  select option { background: #0d1a0d; }
  ::placeholder { color: var(--text3); }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: rgba(139,195,74,0.18); border-radius: 4px; }

  /* ── Nav tabs ── */
  .nav-tab { padding:8px 18px; border-radius:30px; font-size:13px; font-weight:600;
    cursor:pointer; transition:all 0.18s; border:1px solid transparent;
    font-family:var(--font-body); white-space:nowrap; letter-spacing:0.01em; }
  .nav-tab.active { background:linear-gradient(135deg, var(--green-light), var(--green2)); color:#050a02; box-shadow: var(--shadow-green); }
  .nav-tab.inactive { background:rgba(255,255,255,0.04); border-color:var(--border); color:var(--text3); }
  .nav-tab.inactive:hover { color:var(--text2); border-color:rgba(255,255,255,0.16); background:rgba(255,255,255,0.07); }

  /* ── Msg bubble ── */
  .msg-bubble { line-height:1.75; font-size:14.5px; }
  .msg-bubble strong { color:var(--green-light); font-weight:600; }

  /* ── Checklist ── */
  .checklist-item { display:flex; align-items:center; gap:12px; padding:12px 16px;
    border-radius:var(--radius-sm); background:rgba(255,255,255,0.04); border:1px solid var(--border);
    border-top-color:rgba(255,255,255,0.1);
    color:var(--text2); font-size:14px; cursor:pointer; transition:all 0.15s; user-select:none;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.05); }
  .checklist-item:hover { background:rgba(139,195,74,0.08); border-color:rgba(139,195,74,0.25); color:var(--text); }
  .checklist-item.checked { background:rgba(139,195,74,0.1); border-color:rgba(139,195,74,0.3); color:var(--green); text-decoration:line-through; opacity:0.65; }

  /* ── Weather stat ── */
  .weather-stat { display:flex; flex-direction:column; align-items:center; gap:4px; padding:14px; flex:1;
    background:linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%);
    border-radius:var(--radius-sm); border:1px solid var(--border); border-top-color:rgba(255,255,255,0.12);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.07); }

  /* ── Pills ── */
  .pill { background:linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%); border:1px solid rgba(255,255,255,0.12); border-top-color:rgba(255,255,255,0.18); color:var(--text2); border-radius:20px; font-family:var(--font-body); cursor:pointer; transition:all 0.18s; box-shadow:var(--shadow-sm), inset 0 1px 0 rgba(255,255,255,0.08); }
  .pill:hover { background:rgba(255,255,255,0.1); border-color:rgba(255,255,255,0.2); color:var(--text); transform:translateY(-1px); box-shadow:var(--shadow-md), inset 0 1px 0 rgba(255,255,255,0.1); }
  .pill:active { transform:translateY(0); }
  .pill-active { background:linear-gradient(160deg, rgba(60,120,190,0.55) 0%, rgba(35,85,150,0.45) 100%); border:1px solid rgba(90,160,240,0.6); border-top-color:rgba(140,200,255,0.5); color:#b8d8ff; font-weight:700; box-shadow:0 4px 16px rgba(60,130,220,0.35), inset 0 1px 0 rgba(160,210,255,0.25); }
  .pill-active:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(60,130,220,0.45), inset 0 1px 0 rgba(160,210,255,0.25); }

  /* ── More btn ── */
  .more-btn:hover .more-icon { transform: scale(1.15); }

  /* ── Map ── */
  .mapboxgl-map { height:100%; width:100%; }
  .leaflet-container { background:#0d1a0d !important; }
  .leaflet-tile { filter:brightness(0.55) saturate(0.45) hue-rotate(55deg) !important; }
  .custom-marker { background:none !important; border:none !important; }
  .mapboxgl-ctrl-top-right { display: none !important; }
  .mapboxgl-ctrl-bottom-left { display: none !important; }
  .tab-fade { animation: tabFadeIn 0.25s cubic-bezier(0.16,1,0.3,1) forwards; }
  @keyframes tabFadeIn { from { opacity: 0; transform: translateY(14px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }

  @media (max-width: 640px) {
    .mobile-home-btn { padding:5px 10px !important; font-size:12px !important; }
    .mobile-header-badge { padding:4px 8px !important; font-size:11px !important; }
    .mobile-header-logo { font-size:15px !important; }
    .mobile-header-logo-img { width:22px !important; height:22px !important; }
    .mobile-state-select { display:none !important; }
    .mobile-header-center { position:relative !important; left:auto !important; transform:none !important; }
  }
`;

const _reelsStyle = document.createElement('style');
_reelsStyle.textContent = `@keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`;
if (!document.head.querySelector('#reels-style')) { _reelsStyle.id = 'reels-style'; document.head.appendChild(_reelsStyle); }

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const { user, isLoaded } = useUser();
  const { openUserProfile } = useClerk();
  const { toasts } = useToast();
  const [page, setPage] = useState("landing");
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem("wildai_guest") === "true");

  useEffect(() => {
    if (user && isGuest) {
      setIsGuest(false);
      localStorage.removeItem("wildai_guest");
    }
  }, [user?.id, isGuest]);

  const requireSignInForPro = () => {
    if (!user) {
      localStorage.removeItem("wildai_guest");
      setIsGuest(false);
      window._triggerSignIn?.();
      return;
    }
    setShowPricingModal(true);
  };

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      if (!isGuest) setPage("landing");
      return;
    }
    supabase.from("profiles").select("selected_state, onboarding_complete").eq("user_id", user.id).single().then(({ data }) => {
      if (data?.selected_state && !localStorage.getItem("wildai_selected_state")) {
        handleSetSelectedState(data.selected_state);
      }
      if (page === "landing") {
        if (!data?.onboarding_complete) { setPage("onboarding"); }
        else { setPage("chat"); }
      }
    });
    supabase.rpc("update_last_seen", { uid: user.id }).then(() => { });
    const interval = setInterval(() => {
      supabase.rpc("update_last_seen", { uid: user.id }).then(() => { });
    }, 60000);
    return () => clearInterval(interval);
  }, [isLoaded, user?.id, isGuest]);

  // ─── PUSH NOTIFICATIONS ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

    const registerPush = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();
        if (!sub) return; // don't auto-request, wait for user tap
        await fetch(`https://jlzbzkdhjufyjwjmdvmp.supabase.co/rest/v1/push_subscriptions?on_conflict=user_id`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsemJ6a2RoanVmeWp3am1kdm1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMDAzOTYsImV4cCI6MjA5MTY3NjM5Nn0.iGLUa4y5GqmisT3O3FIE4lc9Mr9VpsNXDYKsOeyquKE',
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify({ user_id: user.id, subscription: sub.toJSON() }),
        });
      } catch (e) {
        console.error('Push registration failed:', e);
      }
    };

    registerPush();
  }, [user?.id]);

  const [prevPage, setPrevPage] = useState("landing");
  const [notifs, setNotifs] = useState([]);
  const [notifUnread, setNotifUnread] = useState(0);
  const [messagesUnread, setMessagesUnread] = useState(0);
  const [messageCount, setMessageCount] = useState(() => {
    const saved = localStorage.getItem("wildai_message_count");
    return saved ? parseInt(saved) : 0;
  });
  const [selectedState, setSelectedState] = useState(() => {
    return localStorage.getItem("wildai_selected_state") || "";
  });

  const handleSetSelectedState = (state) => {
    setSelectedState(state);
    if (state) {
      localStorage.setItem("wildai_selected_state", state);
      if (user) supabase.from("profiles").update({ selected_state: state }).eq("user_id", user.id);
    } else {
      localStorage.removeItem("wildai_selected_state");
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "true") {
      window.history.replaceState({}, "", "/");
      setPage("chat");
    }
  }, []);

  const goTo = (p) => { setPrevPage(page); setPage(p); };

  const [showSplash, setShowSplash] = useState(true);
  const [showPushBanner, setShowPushBanner] = useState(false);
  useEffect(() => { setTimeout(() => setShowSplash(false), 2000); }, []);

  useEffect(() => {
    if (isLoaded && !showSplash) {
      const splashEl = document.getElementById('splash');
      if (splashEl) {
        splashEl.style.transition = 'opacity 0.3s ease';
        splashEl.style.opacity = '0';
        setTimeout(() => { splashEl.style.display = 'none'; }, 300);
      }
    }
  }, [isLoaded, showSplash]);

  useEffect(() => {
    if (!user) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (localStorage.getItem('wildai_push_dismissed')) return;
    if (Notification.permission === 'granted') return;
    const t = setTimeout(() => setShowPushBanner(true), 3000);
    return () => clearTimeout(t);
  }, [user?.id]);

  if (!isLoaded && !showSplash) return null;

  const enablePush = async () => {
    setShowPushBanner(false);
    try {
      const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY });
      await fetch(`https://jlzbzkdhjufyjwjmdvmp.supabase.co/rest/v1/push_subscriptions?on_conflict=user_id`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsemJ6a2RoanVmeWp3am1kdm1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMDAzOTYsImV4cCI6MjA5MTY3NjM5Nn0.iGLUa4y5GqmisT3O3FIE4lc9Mr9VpsNXDYKsOeyquKE', 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({ user_id: user.id, subscription: sub.toJSON() }),
      });
    } catch (e) { console.error('Push enable failed:', e); }
  };

  return (
    <>
      <style>{css}</style>
      <ToastContainer toasts={toasts} />

      {showPushBanner && (
        <div style={{ position: 'fixed', bottom: 80, left: 16, right: 16, zIndex: 9000, background: '#1a2a1a', border: '1px solid var(--border-accent)', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          <Bell size={24} color="var(--green)" />
          <div style={{ flex: 1 }}>
            <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 14 }}>Enable Notifications</div>
            <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>Get notified for messages, likes & follows</div>
          </div>
          <button onClick={enablePush} className="btn-primary" style={{ padding: '8px 14px', fontSize: 13, flexShrink: 0 }}>Enable</button>
          <button onClick={() => { setShowPushBanner(false); localStorage.setItem('wildai_push_dismissed', '1'); }} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 18, cursor: 'pointer', padding: 0, flexShrink: 0 }}>✕</button>
        </div>
      )}

      <ErrorBoundary>
        {page === "terms" && <TermsPage onBack={() => setPage(prevPage === "chat" ? "chat" : "landing")} />}
        {page === "landing" && <LandingPage onStart={() => goTo("chat")} onSignIn={() => { window._triggerSignIn?.(); }} onGuest={() => { localStorage.setItem("wildai_guest", "true"); setIsGuest(true); goTo("chat"); }} selectedState={selectedState} setSelectedState={handleSetSelectedState} onTerms={() => goTo("terms")} />}
        {page === "onboarding" && <OnboardingPage user={user} onComplete={() => goTo("chat")} setSelectedState={handleSetSelectedState} />}
        {page === "chat" && <ChatPage onBack={() => { localStorage.removeItem("wildai_selected_state"); setSelectedState(""); goTo("landing"); }} messageCount={messageCount} setMessageCount={setMessageCount} selectedState={selectedState} setSelectedState={handleSetSelectedState} onTerms={() => goTo("terms")} messagesUnread={messagesUnread} setMessagesUnread={setMessagesUnread} notifUnread={notifUnread} setNotifUnread={setNotifUnread} openPricingModal={requireSignInForPro} isGuest={isGuest} onSignIn={() => { localStorage.removeItem("wildai_guest"); setIsGuest(false); window._triggerSignIn?.(); }} />}
      </ErrorBoundary>
      {showPricingModal && user && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99999999, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setShowPricingModal(false)}>
          <div style={{ background: "#070e07", borderRadius: 24, padding: 24, width: "100%", maxWidth: 480, maxHeight: "90dvh", overflowY: "auto", position: "relative" }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowPricingModal(false)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "var(--text3)", fontSize: 20, cursor: "pointer", zIndex: 1 }}>✕</button>
            <stripe-pricing-table pricing-table-id="prctbl_1TQ1qWE7yi7ZXXNUs0Tsz3tx" publishable-key="pk_live_51TLSHhE7yi7ZXXNUtATahGMSzvluem99FP2Daos8zyIlzmTVUOcGQjBvPYqbaxCLHyfHfEVXFt2nff2vAaLKvO0j009ZOXhB2U" client-reference-id={user?.id} />
          </div>
        </div>
      )}
    </>
  );
}
