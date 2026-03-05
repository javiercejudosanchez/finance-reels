import { useState, useEffect, useRef, useCallback } from "react";
import { API_BASE } from "./config";

function loadJSON(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

const KNOWLEDGE_BASE = [
  {
    id: 1, category: "TOKENIZATION", emoji: "⛓️",
    title: "Debt Tokenization Is Rewriting the Rules",
    hook: "Banking hasn't changed in 500 years. Until now.",
    body: "Tokenizing debt converts a corporate bond into digital tokens on blockchain. Instead of a $100K minimum, you buy a $100 fraction. 24/7 liquidity. No gatekeepers. No impossible minimums. The $16T debt market is finally opening up to everyone.",
    stat: { value: "$16T", label: "tokenizable global debt market" },
    keyInsight: "From ownership to access — tokens represent continuous rights, not paper certificates.",
    visualPrompt: "Abstract corporate bonds dissolving into glowing blockchain tokens, dark navy void, financial data streams, cinematic 4K render",
    color: ["#050510", "#0d0a2e", "#1a1240"], accent: "#6366f1", textAccent: "#a5b4fc",
    tag: "🔥 DeFi Meets TradFi"
  },
  {
    id: 2, category: "GLOBAL LIQUIDITY", emoji: "🌊",
    title: "The Dollar System Controls Everything",
    hook: "When the Fed moves, every market on Earth feels it.",
    body: "Global liquidity is hierarchical. The Fed sits at the top. G-SIBs access it directly. Everyone else pays a premium — visible in FX swap deviations from Covered Interest Parity. This is not a market anomaly. It's a structural feature of the Eurodollar architecture that determines funding costs for every institution on Earth.",
    stat: { value: "CIP", label: "deviation reveals your place in the hierarchy" },
    keyInsight: "Proximity to the Fed is the single variable that determines your true funding cost.",
    visualPrompt: "Network visualization of global dollar flows from Federal Reserve outward, glowing hierarchical nodes, pulsing light streams, dark cinematic background",
    color: ["#010b14", "#02182b", "#032d4a"], accent: "#06b6d4", textAccent: "#67e8f9",
    tag: "🌍 Macro Architecture"
  },
  {
    id: 3, category: "SMART CONTRACTS", emoji: "📜",
    title: "Replace Lawyers With Immutable Code",
    hook: "What if covenants enforced themselves automatically?",
    body: "In the decentralized liquidity architecture, smart contracts replace discretionary human intervention. Haircuts adjust algorithmically. Liquidations become structurally unnecessary. The system governs itself — transparently, auditably, without political bias or enforcement delay. This is the paradigm shift from discretion to algorithmic governance.",
    stat: { value: "0", label: "forced liquidations in mutualized buffer model" },
    keyInsight: "Covenants programmed into smart contracts replace political intervention with transparent, self-executing rules.",
    visualPrompt: "Glowing smart contract code transforming into dissolving legal documents, clean blockchain network replacing them, futuristic dark aesthetic, cinematic",
    color: ["#050a05", "#091809", "#0f2e10"], accent: "#22c55e", textAccent: "#86efac",
    tag: "⚡ Algorithmic Governance"
  },
  {
    id: 4, category: "INTERMEDIATION", emoji: "🏦",
    title: "The Hidden Plumbing of Capital Markets",
    hook: "You think banks lend money. They don't. They move risk.",
    body: "Prime brokers, money market funds, global custodians, dealers — these are the transmission nodes of global capital. When any node seizes up due to balance sheet constraints or risk aversion, liquidity evaporates. The Fed's real job isn't stimulating the economy — it's maintaining this plumbing so global capital can flow.",
    stat: { value: "2008", label: "when the plumbing failed globally" },
    keyInsight: "Systemic stability depends on node interconnections, not the solvency of individual agents.",
    visualPrompt: "Cross-section of complex financial plumbing, glowing pipes carrying different colored liquidity flows, some blocked, dramatic chiaroscuro lighting",
    color: ["#0f0500", "#1f0a00", "#2d1200"], accent: "#f97316", textAccent: "#fdba74",
    tag: "🔧 Financial Plumbing"
  },
  {
    id: 5, category: "COLLATERAL", emoji: "💎",
    title: "Collateral Is the New Money",
    hook: "In modern finance, collateral travels faster than cash.",
    body: "Since 2008, collateral has become the engine of intermediation. But individual enforcement creates procyclicality — falling prices trigger forced sales which crash prices further. The mutualized buffer model breaks this doom loop: systemic haircuts replace individual enforcement, maintaining functional liquidity even as assets partially deteriorate.",
    stat: { value: "β < 1", label: "investor recovery cost without specialist skills" },
    keyInsight: "Mutualized buffers absorb volatility that individual collateral enforcement amplifies into crises.",
    visualPrompt: "Diverse assets deposited into glowing communal vault, algorithmic governance nodes surrounding it, smooth liquidity flows emerging, dark luxury aesthetic",
    color: ["#0a0718", "#150d2e", "#1e1040"], accent: "#a855f7", textAccent: "#d8b4fe",
    tag: "💡 Collateral Innovation"
  },
  {
    id: 6, category: "PRIVATE CREDIT", emoji: "💸",
    title: "Direct Lending Is Eating Banking's Lunch",
    hook: "Private credit funds are replacing banks. Quietly. Permanently.",
    body: "Direct lending bypasses banks entirely. Funds lend straight to companies — faster, more confidential, more flexible. The covenant risk premium isn't about default risk or interest rate risk. It's entirely about bespoke contract structures that give lenders unique control over borrower behavior. Europe's market grew 400%+ since 2015.",
    stat: { value: "+400%", label: "European direct lending growth since 2015" },
    keyInsight: "Yield differential in private credit comes from covenant structure and capital velocity, not just default probability.",
    visualPrompt: "Private capital flowing directly between two entities, bypassing a bank that dissolves into smoke, sleek dark financial district setting",
    color: ["#0c0c0c", "#181818", "#222222"], accent: "#eab308", textAccent: "#fde047",
    tag: "💼 Alternative Credit"
  },
  {
    id: 7, category: "STABLECOINS", emoji: "🪙",
    title: "The Mutualized Stablecoin Nobody Knows About",
    hook: "Not Tether. Not USDC. Something fundamentally different.",
    body: "The proposed architecture redefines stablecoins as endogenous, mutualized cash-for-collateral swaps. Tokens represent continuous access rights to collective buffer value — not claims on specific assets. Unlike Tether's leveraged structure, this model smooths volatility internally through collective risk sharing. No liquidation spirals. By design.",
    stat: { value: "ETF", label: "the operational model that inspired the architecture" },
    keyInsight: "Token value = stable collective right to funding backed by mutualized buffer. Not enforced collateral claim.",
    visualPrompt: "Stable glowing coin hovering above a mutualized pool of diverse assets, warm collective light, contrasted against chaotic liquidation spiral in background",
    color: ["#001a10", "#002d1a", "#003d22"], accent: "#10b981", textAccent: "#6ee7b7",
    tag: "🔮 Future of Money"
  },
  {
    id: 8, category: "FINANCIAL INCLUSION", emoji: "🌐",
    title: "Half the World Is Locked Out of Dollar Liquidity",
    hook: "No Fed access. No swap lines. No cheap funding. By design.",
    body: "Jurisdictions without central bank reserve access or bilateral swap lines pay structural premiums — not because they're risky, but because the system excludes them architecturally. A neutral tokenized buffer with open participation eliminates this asymmetry. Any eligible collateral, any jurisdiction, equal technical standards.",
    stat: { value: "∞", label: "jurisdictions that could access neutral liquidity" },
    keyInsight: "Inclusion based on technical standards and risk management, not geopolitical privilege.",
    visualPrompt: "Globe with privileged regions glowing (dollar system) and others in darkness, then new decentralized network of equal light spreading to all continents",
    color: ["#050515", "#0a0a28", "#0f0f3d"], accent: "#818cf8", textAccent: "#c7d2fe",
    tag: "🌍 Financial Inclusion"
  },
  {
    id: 9, category: "REPO MARKETS", emoji: "🔄",
    title: "Repo Markets: The Heartbeat of Global Finance",
    hook: "Most people have never heard of repo. It funds everything.",
    body: "Repo is where institutions borrow short-term cash against collateral. SOFR, TGCR, OBFR signal systemic health. When repo strains — rising Treasury issuance + tax season + high demand — a collateral trap emerges: pyramids of reused internal collateral build until confidence cracks. Then everything seizes simultaneously.",
    stat: { value: "SOFR", label: "the rate that signals systemic stress before it's visible" },
    keyInsight: "Apparent reserve abundance doesn't equal functional liquidity. Only dealer willingness to intermediate does.",
    visualPrompt: "Financial heartbeat monitor showing repo transaction pulse, dramatic flatline moment representing 2008, recovery with Fed intervention, dark cinematic",
    color: ["#0f0a00", "#1f1400", "#2d1e00"], accent: "#f59e0b", textAccent: "#fcd34d",
    tag: "❤️ Market Microstructure"
  }
];

const VIDEO_STATUS = { NONE: "none", SCRIPT: "script", RENDERING: "rendering", READY: "ready" };

async function callClaude(topic, style) {
  const res = await fetch(`${API_BASE}/api/claude`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      max_tokens: 1000,
      system: `You are a world-class financial content creator for FinanceReels — the TikTok of global finance. Global audience: sophisticated investors, fintech founders, finance professionals aged 25-45. Platform context: a debt tokenization platform bridging companies to blockchain infrastructure. Expert knowledge: Eurodollar system, CIP deviations, dealer balance sheets, mutualized collateral buffers, algorithmic governance via smart contracts, tokenized debt, private credit covenant risk premium, repo markets, project finance, credit ratings.`,
      messages: [{ role: "user", content: `Generate a FinanceReels video card about: "${topic}"\nStyle: ${style}\n\nRespond ONLY with valid JSON, no markdown:\n{"category":"CAPS 2 words","emoji":"one emoji","title":"punchy title max 8 words","hook":"scroll-stopping line max 15 words","body":"3-4 sentences with concrete data, real mechanisms, sticky analogies","stat":{"value":"impactful number or term","label":"what it measures"},"keyInsight":"one unforgettable insight","visualPrompt":"Runway/Sora cinematic description 20-30 words dark luxury aesthetic","tag":"emoji + label"}` }]
    })
  });
  const d = await res.json();
  const txt = d.content?.[0]?.text || "{}";
  const parsed = JSON.parse(txt.replace(/```json|```/g, "").trim());
  const schemes = [
    { color: ["#050510","#0d0a2e","#1a1240"], accent: "#6366f1", textAccent: "#a5b4fc" },
    { color: ["#010b14","#02182b","#032d4a"], accent: "#06b6d4", textAccent: "#67e8f9" },
    { color: ["#0f0500","#1f0a00","#2d1200"], accent: "#f97316", textAccent: "#fdba74" },
    { color: ["#050a05","#091809","#0f2e10"], accent: "#22c55e", textAccent: "#86efac" },
    { color: ["#0a0718","#150d2e","#1e1040"], accent: "#a855f7", textAccent: "#d8b4fe" },
    { color: ["#0c0c0c","#181818","#222222"], accent: "#eab308", textAccent: "#fde047" },
  ];
  return { id: Date.now(), ...parsed, ...schemes[Math.floor(Math.random() * schemes.length)] };
}

async function generateVideo(prompt, onStatus) {
  onStatus(VIDEO_STATUS.SCRIPT);

  const genRes = await fetch(`${API_BASE}/api/runway/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, duration: 5 }),
  });
  const { taskId, error } = await genRes.json();
  if (!genRes.ok || !taskId) throw new Error(error || "Failed to start video generation");

  onStatus(VIDEO_STATUS.RENDERING);

  while (true) {
    await new Promise(r => setTimeout(r, 3000));
    const pollRes = await fetch(`${API_BASE}/api/runway/status/${taskId}`);
    const data = await pollRes.json();

    if (data.status === "SUCCEEDED" && data.videoUrl) {
      onStatus(VIDEO_STATUS.READY);
      return data.videoUrl;
    }
    if (data.status === "FAILED") {
      throw new Error("Video generation failed");
    }
  }
}

function AnimBg({ accent }) {
  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:"10%", left:"50%", transform:"translateX(-50%)", width:"80%", paddingBottom:"80%", borderRadius:"50%", background:`radial-gradient(circle, ${accent}15 0%, transparent 65%)` }} />
      <div style={{ position:"absolute", inset:0, opacity:0.03, backgroundImage:`linear-gradient(${accent} 1px, transparent 1px),linear-gradient(90deg, ${accent} 1px, transparent 1px)`, backgroundSize:"44px 44px" }} />
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"60%", background:"linear-gradient(transparent, rgba(0,0,0,0.97))" }} />
    </div>
  );
}

function ReelCard({ card, isActive, liked, onLike, onShare, onSave, onVideo, videoStatus, cardIndex, totalCards, onDoubleTapLike }) {
  const [p, setP] = useState(0);
  const lastTap = useRef(0);

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      onDoubleTapLike();
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  };

  useEffect(() => {
    if (!isActive) { setP(0); return; }
    const t = [
      setTimeout(() => setP(1), 100),
      setTimeout(() => setP(2), 450),
      setTimeout(() => setP(3), 800),
      setTimeout(() => setP(4), 1100),
    ];
    return () => t.forEach(clearTimeout);
  }, [isActive, card.id]);

  const s = (phase, delay = 0) => ({
    opacity: p >= phase ? 1 : 0,
    transform: p >= phase ? "translateY(0)" : "translateY(16px)",
    transition: `all 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}ms`
  });

  const bg = `linear-gradient(155deg, ${card.color[0]} 0%, ${card.color[1]} 55%, ${card.color[2]} 100%)`;

  return (
    <div onClick={handleTap} style={{ width:"100%", height:"100%", position:"relative", overflow:"hidden", background: bg }}>
      <AnimBg accent={card.accent} />

      {/* Card counter pill */}
      <div style={{ position:"absolute", top:68, right:14, zIndex:30, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"3px 9px" }}>
        <span style={{ fontSize:10, color:"rgba(255,255,255,0.5)", fontFamily:"monospace", fontWeight:700 }}>{cardIndex + 1} / {totalCards}</span>
      </div>

      {/* Video background */}
      {videoStatus === VIDEO_STATUS.READY && card.videoUrl && (
        <video
          src={card.videoUrl}
          autoPlay loop muted playsInline
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", zIndex:1 }}
        />
      )}

      {/* Video loading */}
      {(videoStatus === VIDEO_STATUS.SCRIPT || videoStatus === VIDEO_STATUS.RENDERING) && (
        <div style={{ position:"absolute", top:"30%", left:"50%", transform:"translate(-50%,-50%)", textAlign:"center", zIndex:5 }}>
          <div style={{ width:44, height:44, borderRadius:"50%", border:`2px solid ${card.accent}33`, borderTop:`2px solid ${card.accent}`, animation:"spin 1s linear infinite", margin:"0 auto 10px" }} />
          <div style={{ color:"rgba(255,255,255,0.45)", fontSize:10, fontFamily:"monospace" }}>
            {videoStatus === VIDEO_STATUS.SCRIPT ? "✍️ Writing cinematic prompt..." : "🎬 Rendering with Runway..."}
          </div>
        </div>
      )}

      {/* Generate video CTA */}
      {videoStatus === VIDEO_STATUS.NONE && (
        <button onClick={onVideo} style={{ position:"absolute", top:"35%", left:"50%", transform:"translate(-50%,-50%)", background:`${card.accent}18`, backdropFilter:"blur(12px)", border:`1px solid ${card.accent}35`, borderRadius:40, padding:"9px 18px", cursor:"pointer", display:"flex", alignItems:"center", gap:7, color:card.textAccent, fontSize:11, fontFamily:"monospace", zIndex:5, whiteSpace:"nowrap" }}>
          <span style={{ fontSize:15 }}>🎬</span> Generate AI Video
        </button>
      )}

      {/* Content */}
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", justifyContent:"flex-end", padding:"0 16px 96px", zIndex:10 }}>
        <div style={{ ...s(1), display:"flex", gap:7, marginBottom:10, flexWrap:"wrap" }}>
          <div style={{ background:`${card.accent}1a`, border:`1px solid ${card.accent}38`, borderRadius:20, padding:"3px 10px", display:"inline-flex", alignItems:"center", gap:5 }}>
            <span>{card.emoji}</span>
            <span style={{ color:card.textAccent, fontSize:10, fontWeight:700, letterSpacing:2, fontFamily:"monospace" }}>{card.category}</span>
          </div>
          <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:20, padding:"3px 10px", fontSize:10, color:"rgba(255,255,255,0.4)", fontFamily:"monospace" }}>{card.tag}</div>
        </div>

        <div style={{ ...s(1, 60) }}>
          <p style={{ fontSize:12, color:"rgba(255,255,255,0.45)", fontFamily:"monospace", marginBottom:5, letterSpacing:0.4 }}>{card.hook}</p>
          <h2 style={{ fontSize:"clamp(21px,5.5vw,30px)", fontWeight:900, color:"#fff", lineHeight:1.15, marginBottom:14, fontFamily:"'Bebas Neue','Impact',sans-serif", letterSpacing:1, textShadow:`0 0 40px ${card.accent}44` }}>
            {card.title}
          </h2>
        </div>

        <div style={{ ...s(2), background:"rgba(0,0,0,0.48)", backdropFilter:"blur(18px)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"13px 15px", marginBottom:11 }}>
          <p style={{ fontSize:13.5, color:"rgba(255,255,255,0.83)", lineHeight:1.65, fontFamily:"'DM Sans',sans-serif", margin:0 }}>{card.body}</p>
        </div>

        <div style={{ ...s(3), background:`${card.accent}0f`, border:`1px solid ${card.accent}28`, borderRadius:10, padding:"8px 13px", marginBottom:12, display:"flex", alignItems:"flex-start", gap:7 }}>
          <span style={{ fontSize:13, flexShrink:0, marginTop:1 }}>💡</span>
          <p style={{ fontSize:11.5, color:card.textAccent, fontFamily:"monospace", margin:0, lineHeight:1.55, letterSpacing:0.3 }}>{card.keyInsight}</p>
        </div>

        <div style={{ ...s(4), display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:"clamp(28px,8vw,40px)", fontWeight:900, color:card.textAccent, fontFamily:"monospace", lineHeight:1, textShadow:`0 0 24px ${card.accent}77` }}>{card.stat.value}</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", fontFamily:"monospace", marginTop:2 }}>{card.stat.label}</div>
          </div>
          {videoStatus === VIDEO_STATUS.NONE && card.visualPrompt && (
            <div style={{ maxWidth:140, background:"rgba(0,0,0,0.4)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:8, padding:"6px 9px" }}>
              <div style={{ fontSize:8, color:"rgba(255,255,255,0.18)", fontFamily:"monospace", marginBottom:2 }}>RUNWAY PROMPT</div>
              <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", fontFamily:"monospace", lineHeight:1.4 }}>{(card.visualPrompt || "").slice(0,65)}…</div>
            </div>
          )}
        </div>
      </div>

      {/* Side actions */}
      <div style={{ position:"absolute", right:12, bottom:108, zIndex:20, display:"flex", flexDirection:"column", gap:16, alignItems:"center" }}>
        {[
          { icon: liked ? "❤️" : "🤍", label: liked ? "Liked" : "Like", fn: onLike, hi: liked },
          { icon: "💬", label: "Comment", fn: () => {} },
          { icon: "↗️", label: "Share", fn: onShare },
          { icon: "🔖", label: "Save", fn: onSave },
          { icon: "🎬", label: "Video", fn: onVideo, special: true },
        ].map((b, i) => (
          <button key={i} onClick={b.fn} style={{ background: b.special ? `${card.accent}28` : b.hi ? "rgba(239,68,68,0.2)" : "rgba(0,0,0,0.5)", backdropFilter:"blur(10px)", border: b.special ? `1px solid ${card.accent}45` : b.hi ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.07)", borderRadius:"50%", width:50, height:50, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", gap:1 }}>
            <span style={{ fontSize:19 }}>{b.icon}</span>
            <span style={{ fontSize:8, color: b.special ? card.textAccent : "rgba(255,255,255,0.45)", fontFamily:"monospace" }}>{b.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const TOPICS = [
  "How FX swap deviations expose the dollar hierarchy",
  "Why the Fed is a plumber not a banker",
  "Mutualized collateral buffers vs Tether model",
  "Project finance: debt with no recourse explained",
  "How repo markets almost collapsed in September 2019",
  "The covenant risk premium in private credit",
  "Why covered interest parity breaks down",
  "How blockchain eliminates settlement risk",
  "What dealer balance sheets reveal about liquidity",
  "Global financial inclusion through tokenization",
  "How acquisition finance funds leveraged buyouts",
  "Credit ratings: how S&P, Moody's and Fitch really work",
];

function GenModal({ onClose, onGen, loading }) {
  const [topic, setTopic] = useState("");
  const [custom, setCustom] = useState("");
  const [style, setStyle] = useState("intellectually sharp and counterintuitive");

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.9)", backdropFilter:"blur(18px)", display:"flex", alignItems:"flex-end" }} onClick={() => !loading && onClose()}>
      <div style={{ width:"100%", background:"#07071a", borderRadius:"22px 22px 0 0", border:"1px solid rgba(255,255,255,0.07)", padding:"22px 20px", maxHeight:"85vh", overflowY:"auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ width:32, height:3, background:"rgba(255,255,255,0.13)", borderRadius:2, margin:"0 auto 20px" }} />
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
          <div style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#6366f1,#06b6d4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>✨</div>
          <div>
            <h3 style={{ color:"#fff", fontFamily:"monospace", fontSize:15, fontWeight:700 }}>Generate with Claude + Runway</h3>
            <p style={{ color:"rgba(255,255,255,0.3)", fontSize:9, fontFamily:"monospace" }}>AI content script → AI cinematic video generation</p>
          </div>
        </div>
        <div style={{ background:"rgba(99,102,241,0.07)", border:"1px solid rgba(99,102,241,0.18)", borderRadius:10, padding:"10px 14px", marginBottom:18 }}>
          <p style={{ color:"rgba(255,255,255,0.45)", fontSize:10, fontFamily:"monospace", margin:0, lineHeight:1.7 }}>
            1. Claude reads your knowledge base → generates viral script + Runway prompt<br/>
            2. Runway Gen-3 Alpha renders 5-10s cinematic video<br/>
            3. New card appears in your FinanceReels feed
          </p>
        </div>
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:10, fontFamily:"monospace", marginBottom:9 }}>SELECT TOPIC:</p>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:16 }}>
          {TOPICS.map(t => (
            <button key={t} onClick={() => { setTopic(t); setCustom(""); }} style={{ background: topic===t ? "rgba(99,102,241,0.28)" : "rgba(255,255,255,0.04)", border:`1px solid ${topic===t ? "rgba(99,102,241,0.65)" : "rgba(255,255,255,0.07)"}`, borderRadius:20, padding:"5px 11px", color: topic===t ? "#a5b4fc" : "rgba(255,255,255,0.45)", fontSize:11, cursor:"pointer", fontFamily:"monospace" }}>{t}</button>
          ))}
        </div>
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:10, fontFamily:"monospace", marginBottom:7 }}>OR WRITE CUSTOM TOPIC:</p>
        <input placeholder="e.g. how algorithmic governance replaces covenant enforcement..." value={custom} onChange={e => { setCustom(e.target.value); setTopic(""); }} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"10px 13px", color:"#fff", fontSize:12, fontFamily:"monospace", outline:"none", boxSizing:"border-box", marginBottom:16 }} />
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:10, fontFamily:"monospace", marginBottom:7 }}>CONTENT STYLE:</p>
        <div style={{ display:"flex", gap:6, marginBottom:22 }}>
          {["intellectually sharp and counterintuitive","accessible for global retail investors","deeply technical and data-driven"].map(s => (
            <button key={s} onClick={() => setStyle(s)} style={{ flex:1, background: style===s ? "rgba(6,182,212,0.13)" : "rgba(255,255,255,0.04)", border:`1px solid ${style===s ? "rgba(6,182,212,0.45)" : "rgba(255,255,255,0.07)"}`, borderRadius:8, padding:"8px 4px", color: style===s ? "#67e8f9" : "rgba(255,255,255,0.35)", fontSize:10, cursor:"pointer", fontFamily:"monospace" }}>{s}</button>
          ))}
        </div>
        <button onClick={() => onGen(custom || topic, style)} disabled={loading || (!topic && !custom)} style={{ width:"100%", background: (loading || (!topic && !custom)) ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#6366f1 0%,#06b6d4 100%)", border:"none", borderRadius:13, padding:"15px", color: (loading || (!topic && !custom)) ? "rgba(255,255,255,0.25)" : "#fff", fontSize:14, fontWeight:700, fontFamily:"monospace", cursor: loading ? "wait" : "pointer", letterSpacing:1 }}>
          {loading ? "⏳ CLAUDE IS WRITING..." : "✨ GENERATE CONTENT + VIDEO"}
        </button>
      </div>
    </div>
  );
}

function ApiModal({ onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(0,0,0,0.92)", backdropFilter:"blur(20px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={onClose}>
      <div style={{ background:"#07071a", border:"1px solid rgba(255,255,255,0.08)", borderRadius:20, padding:24, width:"100%", maxWidth:400 }} onClick={e => e.stopPropagation()}>
        <h3 style={{ color:"#fff", fontFamily:"monospace", fontSize:15, marginBottom:5 }}>⚙️ API Configuration</h3>
        <p style={{ color:"rgba(255,255,255,0.35)", fontSize:10, fontFamily:"monospace", marginBottom:20, lineHeight:1.7 }}>
          API keys are configured securely on the backend server.<br/>
          Edit <span style={{ color:"#a5b4fc" }}>server/.env</span> to update your keys.
        </p>
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:10, padding:12, marginBottom:18 }}>
          <p style={{ color:"rgba(255,255,255,0.25)", fontSize:9, fontFamily:"monospace", margin:0, lineHeight:1.75 }}>
            ANTHROPIC_API_KEY → Claude content generation<br/>
            RUNWAY_API_KEY → Runway Gen-3 Alpha video generation<br/>
            Server proxy: {API_BASE}
          </p>
        </div>
        <button onClick={onClose} style={{ width:"100%", background:"linear-gradient(135deg,#6366f1,#06b6d4)", border:"none", borderRadius:10, padding:12, color:"#fff", fontSize:12, cursor:"pointer", fontFamily:"monospace", fontWeight:700 }}>Close</button>
      </div>
    </div>
  );
}

function StatsScreen({ cards, likes, analytics, onClose }) {
  const totalViews = Object.values(analytics.cardViews).reduce((a, b) => a + b, 0);
  const totalLikes = Object.values(likes).filter(Boolean).length;

  // Most viewed category
  const catViews = {};
  for (const [cardId, count] of Object.entries(analytics.cardViews)) {
    const card = cards.find(c => String(c.id) === String(cardId));
    if (card) catViews[card.category] = (catViews[card.category] || 0) + count;
  }
  const topCat = Object.entries(catViews).sort((a, b) => b[1] - a[1])[0];

  // Category chart data
  const categories = Array.from(new Set(cards.map(c => c.category)));
  const catData = categories.map(cat => {
    const card = cards.find(c => c.category === cat);
    return { category: cat, views: catViews[cat] || 0, accent: card?.accent || "#6366f1", emoji: card?.emoji || "" };
  }).sort((a, b) => b.views - a.views);
  const maxViews = Math.max(...catData.map(d => d.views), 1);

  // Top 3 liked cards
  const likedCards = cards.filter(c => likes[c.id]).slice(0, 3);

  const exportData = () => {
    const data = { analytics, likes, totalCards: cards.length, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financereels-analytics-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statCard = (value, label, accent) => (
    <div style={{ flex:1, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, padding:"14px 12px", textAlign:"center" }}>
      <div style={{ fontSize:28, fontWeight:900, color:accent, fontFamily:"monospace", lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:9, color:"rgba(255,255,255,0.35)", fontFamily:"monospace", marginTop:4 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ position:"fixed", inset:0, zIndex:150, background:"#050510", animation:"slideInRight 0.3s ease-out", display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <div style={{ padding:"14px 16px 0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <h2 style={{ color:"#fff", fontSize:18, fontWeight:900, fontFamily:"monospace", letterSpacing:1 }}>Analytics</h2>
          <p style={{ color:"rgba(255,255,255,0.3)", fontSize:9, fontFamily:"monospace" }}>Session #{analytics.totalSessions}</p>
        </div>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"50%", width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"rgba(255,255,255,0.5)", fontSize:16 }}>✕</button>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"14px 16px 90px", scrollbarWidth:"none", display:"flex", flexDirection:"column", gap:16 }}>

        {/* Top stats row */}
        <div style={{ display:"flex", gap:8 }}>
          {statCard(totalViews, "Total Views", "#6366f1")}
          {statCard(totalLikes, "Likes Given", "#ef4444")}
          {statCard(topCat ? topCat[0] : "—", "Top Category", "#06b6d4")}
        </div>

        {/* Engagement chart */}
        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, padding:16 }}>
          <h3 style={{ color:"rgba(255,255,255,0.6)", fontSize:11, fontFamily:"monospace", fontWeight:700, marginBottom:14, letterSpacing:1 }}>VIEWS BY CATEGORY</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {catData.map(d => (
              <div key={d.category} style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:14, width:20, textAlign:"center", flexShrink:0 }}>{d.emoji}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                    <span style={{ fontSize:9, color:"rgba(255,255,255,0.4)", fontFamily:"monospace", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.category}</span>
                    <span style={{ fontSize:9, color:d.accent, fontFamily:"monospace", fontWeight:700, flexShrink:0 }}>{d.views}</span>
                  </div>
                  <div style={{ height:6, background:"rgba(255,255,255,0.04)", borderRadius:3, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${(d.views / maxViews) * 100}%`, background:d.accent, borderRadius:3, transition:"width 0.5s ease" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most liked cards */}
        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, padding:16 }}>
          <h3 style={{ color:"rgba(255,255,255,0.6)", fontSize:11, fontFamily:"monospace", fontWeight:700, marginBottom:12, letterSpacing:1 }}>MOST LIKED</h3>
          {likedCards.length === 0 ? (
            <p style={{ color:"rgba(255,255,255,0.2)", fontSize:11, fontFamily:"monospace" }}>No liked cards yet. Double-tap cards to like them.</p>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {likedCards.map(c => (
                <div key={c.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", background:"rgba(255,255,255,0.02)", borderRadius:10 }}>
                  <span style={{ fontSize:22 }}>{c.emoji}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ color:"#fff", fontSize:12, fontWeight:700, fontFamily:"monospace", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.title}</p>
                    <span style={{ fontSize:8, color:c.textAccent, fontFamily:"monospace", background:`${c.accent}1a`, border:`1px solid ${c.accent}30`, borderRadius:6, padding:"1px 6px" }}>{c.category}</span>
                  </div>
                  <span style={{ color:"#ef4444", fontSize:16 }}>❤️</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Generation stats */}
        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, padding:16 }}>
          <h3 style={{ color:"rgba(255,255,255,0.6)", fontSize:11, fontFamily:"monospace", fontWeight:700, marginBottom:10, letterSpacing:1 }}>AI GENERATION</h3>
          <div style={{ fontSize:24, fontWeight:900, color:"#22c55e", fontFamily:"monospace", lineHeight:1 }}>{analytics.generatedTopics.length}</div>
          <div style={{ fontSize:9, color:"rgba(255,255,255,0.35)", fontFamily:"monospace", marginTop:2, marginBottom:10 }}>cards generated with AI</div>
          {analytics.generatedTopics.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
              {analytics.generatedTopics.map((t, i) => (
                <div key={i} style={{ fontSize:10, color:"rgba(255,255,255,0.3)", fontFamily:"monospace", padding:"4px 8px", background:"rgba(255,255,255,0.02)", borderRadius:6, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  ✨ {t}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Export */}
        <button onClick={exportData} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"14px", color:"rgba(255,255,255,0.5)", fontSize:12, fontFamily:"monospace", cursor:"pointer", fontWeight:600 }}>
          Export as JSON
        </button>
      </div>
    </div>
  );
}

function ExploreScreen({ cards, onNavigate, onClose }) {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("All");

  const categories = ["All", ...Array.from(new Set(cards.map(c => c.category)))];

  const filtered = cards.filter(c => {
    const matchCat = activeCat === "All" || c.category === activeCat;
    if (!matchCat) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return c.title.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.body.toLowerCase().includes(q);
  });

  return (
    <div style={{ position:"fixed", inset:0, zIndex:150, background:"#050510", animation:"slideInRight 0.3s ease-out", display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <div style={{ padding:"14px 16px 0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <h2 style={{ color:"#fff", fontSize:18, fontWeight:900, fontFamily:"monospace", letterSpacing:1 }}>Explore</h2>
          <p style={{ color:"rgba(255,255,255,0.3)", fontSize:9, fontFamily:"monospace" }}>{cards.length} cards in knowledge base</p>
        </div>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"50%", width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"rgba(255,255,255,0.5)", fontSize:16 }}>✕</button>
      </div>

      {/* Search */}
      <div style={{ padding:"12px 16px 0" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search financial concepts..."
          style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"11px 14px", color:"#fff", fontSize:12, fontFamily:"monospace", outline:"none", boxSizing:"border-box" }}
        />
      </div>

      {/* Category pills */}
      <div style={{ padding:"12px 0 6px", overflowX:"auto", display:"flex", gap:6, scrollbarWidth:"none", WebkitOverflowScrolling:"touch" }}>
        <div style={{ paddingLeft:16 }} />
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCat(cat)} style={{ flexShrink:0, background: activeCat === cat ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.04)", border:`1px solid ${activeCat === cat ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.07)"}`, borderRadius:20, padding:"5px 13px", color: activeCat === cat ? "#a5b4fc" : "rgba(255,255,255,0.4)", fontSize:10, cursor:"pointer", fontFamily:"monospace", fontWeight:600, whiteSpace:"nowrap" }}>
            {cat === "All" ? "All" : cat}
          </button>
        ))}
        <div style={{ paddingRight:10 }} />
      </div>

      {/* Card grid */}
      <div style={{ flex:1, overflowY:"auto", padding:"8px 12px 80px", scrollbarWidth:"none" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 20px", color:"rgba(255,255,255,0.25)", fontFamily:"monospace", fontSize:12 }}>
            No cards match your search
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {filtered.map((c, idx) => {
              const bg = `linear-gradient(155deg, ${c.color[0]} 0%, ${c.color[1]} 55%, ${c.color[2]} 100%)`;
              return (
                <button key={c.id} onClick={() => onNavigate(c.id)} style={{ background: bg, border:`1px solid ${c.accent}22`, borderRadius:14, padding:"14px 12px", cursor:"pointer", textAlign:"left", display:"flex", flexDirection:"column", gap:8, minHeight:150, position:"relative", overflow:"hidden" }}>
                  {/* Subtle glow */}
                  <div style={{ position:"absolute", top:0, right:0, width:60, height:60, borderRadius:"50%", background:`radial-gradient(circle, ${c.accent}18 0%, transparent 70%)` }} />

                  {/* Emoji + category */}
                  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <span style={{ fontSize:20 }}>{c.emoji}</span>
                    <span style={{ background:`${c.accent}1a`, border:`1px solid ${c.accent}30`, borderRadius:10, padding:"1px 7px", fontSize:8, color:c.textAccent, fontFamily:"monospace", fontWeight:700, letterSpacing:1 }}>{c.category}</span>
                  </div>

                  {/* Title */}
                  <p style={{ color:"#fff", fontSize:12, fontWeight:700, fontFamily:"'Bebas Neue','Impact',sans-serif", letterSpacing:0.8, lineHeight:1.2, margin:0, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                    {c.title}
                  </p>

                  {/* Stat */}
                  <div style={{ marginTop:"auto" }}>
                    <div style={{ fontSize:20, fontWeight:900, color:c.textAccent, fontFamily:"monospace", lineHeight:1 }}>{c.stat.value}</div>
                    <div style={{ fontSize:7.5, color:"rgba(255,255,255,0.3)", fontFamily:"monospace", marginTop:1 }}>{c.stat.label}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FinanceReels() {
  const [cards, setCards] = useState(() => {
    const generated = loadJSON("financereels_generated_cards", []);
    return [...KNOWLEDGE_BASE, ...generated];
  });
  const [cur, setCur] = useState(0);
  const [likes, setLikes] = useState(() => loadJSON("financereels_likes", {}));
  const [saved, setSaved] = useState(() => loadJSON("financereels_saved", {}));
  const [vStatus, setVStatus] = useState({});
  const [showGen, setShowGen] = useState(false);
  const [showApi, setShowApi] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState(null);
  const [tab, setTab] = useState("feed");
  const [showHeart, setShowHeart] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [analytics, setAnalytics] = useState(() => {
    const stored = loadJSON("financereels_analytics", { cardViews: {}, totalSessions: 0, generatedTopics: [] });
    return { ...stored, totalSessions: stored.totalSessions + 1 };
  });
  const lastNav = useRef(0);
  const touchY = useRef(null);
  const slideDir = useRef(1);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") showToast("App installed!", "success");
    setInstallPrompt(null);
  };

  useEffect(() => { saveJSON("financereels_likes", likes); }, [likes]);
  useEffect(() => { saveJSON("financereels_saved", saved); }, [saved]);
  useEffect(() => {
    const generated = cards.filter(c => !KNOWLEDGE_BASE.some(kb => kb.id === c.id));
    saveJSON("financereels_generated_cards", generated);
  }, [cards]);

  useEffect(() => { saveJSON("financereels_analytics", analytics); }, [analytics]);

  // Track card views when current card changes
  useEffect(() => {
    if (!cards[cur]) return;
    const cardId = cards[cur].id;
    setAnalytics(prev => ({
      ...prev,
      cardViews: { ...prev.cardViews, [cardId]: (prev.cardViews[cardId] || 0) + 1 }
    }));
  }, [cur, cards]);

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const nav = useCallback((dir) => {
    const now = Date.now();
    if (now - lastNav.current < 520) return;
    lastNav.current = now;
    slideDir.current = dir;
    setCur(prev => {
      const next = prev + dir;
      return next >= 0 && next < cards.length ? next : prev;
    });
  }, [cards.length]);

  useEffect(() => {
    const h = (e) => {
      if (e.key === "ArrowDown" || e.key === "j") nav(1);
      if (e.key === "ArrowUp" || e.key === "k") nav(-1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [nav]);

  const onWheel = useCallback((e) => {
    const now = Date.now();
    if (now - lastNav.current < 620) return;
    lastNav.current = now;
    nav(e.deltaY > 0 ? 1 : -1);
  }, [nav]);

  const handleGen = async (topic, style) => {
    setGenerating(true);
    try {
      const card = await callClaude(topic, style);
      setCards(prev => [...prev, card]);
      setAnalytics(prev => ({ ...prev, generatedTopics: [...prev.generatedTopics, topic] }));
      showToast("✨ New card added — scroll down to see it", "success");
      setShowGen(false);
    } catch {
      showToast("❌ Generation failed. Check connection.", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleVideo = async (cardId) => {
    const cardData = cards.find(c => c.id === cardId);
    if (!cardData?.visualPrompt) return;

    const onStatus = (s) => setVStatus(p => ({ ...p, [cardId]: s }));

    try {
      const videoUrl = await generateVideo(cardData.visualPrompt, onStatus);
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, videoUrl } : c));
      showToast("🎬 Video generated!", "success");
    } catch {
      onStatus(VIDEO_STATUS.NONE);
      showToast("❌ Video generation failed", "error");
    }
  };

  const card = cards[cur];
  const savedCount = Object.values(saved).filter(Boolean).length;

  return (
    <>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        body{background:#000;overflow:hidden}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideInUp{from{opacity:0;transform:translateY(60%)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideInDown{from{opacity:0;transform:translateY(-60%)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes heartPop{0%{opacity:0;transform:translate(-50%,-50%) scale(0)}15%{opacity:1;transform:translate(-50%,-50%) scale(1.3)}30%{transform:translate(-50%,-50%) scale(1)}80%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.4)}}
        @keyframes slideInRight{from{opacity:0;transform:translateX(100%)}to{opacity:1;transform:translateX(0)}}
        button{transition:transform 0.12s,opacity 0.12s}
        button:active{transform:scale(0.92);opacity:0.75}
      `}</style>

      <div onWheel={onWheel}
        onTouchStart={e => { touchY.current = e.touches[0].clientY; }}
        onTouchEnd={e => {
          if (!touchY.current) return;
          const diff = touchY.current - e.changedTouches[0].clientY;
          if (Math.abs(diff) > 42) nav(diff > 0 ? 1 : -1);
          touchY.current = null;
        }}
        style={{ width:"100vw", height:"100dvh", position:"relative", overflow:"hidden", background:"#000" }}>

        {/* TOP BAR */}
        <div style={{ position:"absolute", top:0, left:0, right:0, zIndex:40, padding:"10px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", background:"linear-gradient(rgba(0,0,0,0.65), transparent)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#6366f1,#06b6d4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:900, color:"#fff", fontFamily:"monospace" }}>F</div>
            <div>
              <div style={{ color:"#fff", fontSize:14, fontWeight:700, fontFamily:"monospace", letterSpacing:1 }}>FINANCE<span style={{ color:"#67e8f9" }}>REELS</span></div>
              <div style={{ color:"rgba(255,255,255,0.28)", fontSize:7.5, fontFamily:"monospace" }}>Debt Tokenization Platform · Global Markets</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:7, alignItems:"center" }}>
            {installPrompt && (
              <button onClick={handleInstall} style={{ background:"linear-gradient(135deg,rgba(99,102,241,0.2),rgba(6,182,212,0.2))", border:"1px solid rgba(99,102,241,0.35)", borderRadius:20, padding:"5px 11px", color:"#a5b4fc", fontSize:10, cursor:"pointer", fontFamily:"monospace", fontWeight:700 }}>
                Install App
              </button>
            )}
            <button onClick={() => setShowApi(true)} style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:20, padding:"5px 11px", color:"rgba(255,255,255,0.45)", fontSize:10, cursor:"pointer", fontFamily:"monospace" }}>
              ⚙️ Config
            </button>
            <button onClick={() => nav(-1)} disabled={cur===0} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"50%", width:30, height:30, color:"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:12, opacity:cur===0?0.25:1 }}>↑</button>
            <button onClick={() => nav(1)} disabled={cur===cards.length-1} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"50%", width:30, height:30, color:"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:12, opacity:cur===cards.length-1?0.25:1 }}>↓</button>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div style={{ position:"absolute", top:56, left:0, right:0, zIndex:40, display:"flex", gap:2.5, padding:"0 14px" }}>
          {cards.map((_, i) => (
            <div key={i} style={{ flex:1, height:1.5, borderRadius:2, background: i<=cur ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.15)", transition:"background 0.4s" }} />
          ))}
        </div>

        {/* CARD */}
        {card && (
          <div key={card.id} style={{ width:"100%", height:"100%", animation:`${slideDir.current > 0 ? 'slideInUp' : 'slideInDown'} 0.35s ease-out` }}>
            <ReelCard
              card={card} isActive={true}
              liked={!!likes[card.id]}
              videoStatus={vStatus[card.id] || VIDEO_STATUS.NONE}
              cardIndex={cur} totalCards={cards.length}
              onLike={() => { setLikes(p => ({ ...p, [card.id]: !p[card.id] })); if (!likes[card.id]) showToast("❤️ Liked!"); }}
              onShare={() => {
                const shareData = { title: card.title, text: `${card.hook} — FinanceReels`, url: window.location.href };
                if (navigator.share) {
                  navigator.share(shareData).catch(() => {});
                } else {
                  navigator.clipboard?.writeText(`${card.title} — FinanceReels`);
                  showToast("↗️ Link copied");
                }
              }}
              onSave={() => { setSaved(p => ({ ...p, [card.id]: !p[card.id] })); showToast(saved[card.id] ? "🔖 Removed" : "🔖 Saved!"); }}
              onVideo={() => handleVideo(card.id)}
              onDoubleTapLike={() => {
                if (!likes[card.id]) {
                  setLikes(p => ({ ...p, [card.id]: true }));
                }
                setShowHeart(true);
                setTimeout(() => setShowHeart(false), 900);
              }}
            />
          </div>
        )}

        {/* Heart animation */}
        {showHeart && (
          <div style={{ position:"absolute", top:"40%", left:"50%", transform:"translate(-50%,-50%)", zIndex:60, pointerEvents:"none", fontSize:80, animation:"heartPop 0.9s ease-out forwards", filter:"drop-shadow(0 0 20px rgba(239,68,68,0.6))" }}>
            ❤️
          </div>
        )}

        {/* BOTTOM NAV */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, zIndex:40, background:"linear-gradient(transparent, rgba(0,0,0,0.96))", paddingTop:22 }}>
          <div style={{ display:"flex", justifyContent:"space-around", alignItems:"center", paddingBottom:14 }}>
            {[
              { icon:"🏠", label:"Feed", id:"feed" },
              { icon:"🔍", label:"Explore", id:"explore" },
              null,
              { icon:"📊", label:"Stats", id:"stats" },
              { icon:"🔖", label: savedCount > 0 ? `Saved(${savedCount})` : "Saved", id:"saved" },
            ].map((item, i) => {
              if (!item) return <div key={i} style={{ width:58 }} />;
              return (
                <button key={i} onClick={() => setTab(item.id)} style={{ background:"none", border:"none", color: tab===item.id ? "#fff" : "rgba(255,255,255,0.35)", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2, width:58, padding:"2px 0" }}>
                  <span style={{ fontSize:19 }}>{item.icon}</span>
                  <span style={{ fontSize:8, fontFamily:"monospace" }}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FAB */}
        <button onClick={() => setShowGen(true)} style={{ position:"absolute", bottom:11, left:"50%", transform:"translateX(-50%)", width:58, height:58, borderRadius:"50%", zIndex:50, background:"linear-gradient(135deg,#6366f1 0%,#06b6d4 100%)", border:"3px solid #000", cursor:"pointer", fontSize:22, boxShadow:"0 0 30px rgba(99,102,241,0.55), 0 0 60px rgba(6,182,212,0.2)" }}>
          ✨
        </button>

        {/* HINT */}
        {cur === 0 && (
          <div style={{ position:"absolute", bottom:82, left:"50%", transform:"translateX(-50%)", color:"rgba(255,255,255,0.25)", fontSize:9.5, textAlign:"center", fontFamily:"monospace", animation:"pulse 2s ease-in-out 2s 3", whiteSpace:"nowrap" }}>
            ↕ swipe or scroll to navigate · ✨ generate AI content + video
          </div>
        )}

        {/* TOAST */}
        {toast && (
          <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", background:"rgba(7,7,26,0.94)", backdropFilter:"blur(18px)", border:`1px solid ${toast.type==="success" ? "rgba(34,197,94,0.28)" : toast.type==="error" ? "rgba(239,68,68,0.28)" : "rgba(255,255,255,0.08)"}`, borderRadius:14, padding:"11px 22px", color:"#fff", fontSize:12, fontFamily:"monospace", zIndex:100, animation:"slideUp 0.3s ease", whiteSpace:"nowrap", maxWidth:"90vw", textAlign:"center" }}>
            {toast.msg}
          </div>
        )}
      </div>

      {showGen && <GenModal onClose={() => !generating && setShowGen(false)} onGen={handleGen} loading={generating} />}
      {showApi && <ApiModal onClose={() => setShowApi(false)} />}
      {tab === "explore" && (
        <ExploreScreen
          cards={cards}
          onNavigate={(cardId) => {
            const idx = cards.findIndex(c => c.id === cardId);
            if (idx !== -1) {
              setCur(idx);
              setTab("feed");
            }
          }}
          onClose={() => setTab("feed")}
        />
      )}
      {tab === "stats" && (
        <StatsScreen
          cards={cards}
          likes={likes}
          analytics={analytics}
          onClose={() => setTab("feed")}
        />
      )}
    </>
  );
}
