import { useState, useEffect, useRef, useCallback } from "react";
import { API_BASE } from "./config";

// ── Persistence helpers ─────────────────────────────────────────────
function loadJSON(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

const LS = {
  CARDS: "financereels_cards",
  LIKES: "financereels_likes",
  SAVED: "financereels_saved",
  COMMENTS: "financereels_comments",
};

const MAX_CARDS = 200;

// ── API Layer ───────────────────────────────────────────────────────
async function generateFeedBatch(count = 3, excludeTopics = []) {
  const res = await fetch(`${API_BASE}/api/generate-feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ count, excludeTopics }),
  });
  if (!res.ok) throw new Error("Feed generation failed");
  const { cards } = await res.json();
  return cards.map(c => ({
    id: `card_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: c.title,
    caption: c.caption,
    category: c.category,
    emoji: c.emoji,
    visualPrompt: c.visualPrompt,
    videoUrl: null,
    videoStatus: "none",
    videoTaskId: null,
    createdAt: Date.now(),
  }));
}

async function startVideoGeneration(prompt) {
  const res = await fetch(`${API_BASE}/api/runway/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, duration: 5 }),
  });
  if (!res.ok) throw new Error("Failed to start video");
  const { taskId } = await res.json();
  return taskId;
}

async function pollVideoStatus(taskId) {
  const res = await fetch(`${API_BASE}/api/runway/status/${taskId}`);
  if (!res.ok) throw new Error("Poll failed");
  return res.json(); // { status, videoUrl }
}

// ── SVG Icons ───────────────────────────────────────────────────────
const HeartIcon = ({ filled }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill={filled ? "#ef4444" : "none"} stroke={filled ? "#ef4444" : "#fff"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const CommentIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const BookmarkIcon = ({ filled }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill={filled ? "#fff" : "none"} stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
  </svg>
);

const ShareIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

// ── ActionButton ────────────────────────────────────────────────────
function ActionButton({ icon, count, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: "rgba(0,0,0,0.3)",
      backdropFilter: "blur(10px)",
      border: "none",
      borderRadius: "50%",
      width: 48, height: 48,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      cursor: "pointer", gap: 0,
    }}>
      {icon}
      {count !== undefined && (
        <span style={{ fontSize: 10, color: "#fff", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, marginTop: -2 }}>
          {count}
        </span>
      )}
    </button>
  );
}

// ── ShimmerPlaceholder ──────────────────────────────────────────────
function ShimmerPlaceholder({ status }) {
  const label = status === "rendering" ? "Rendering video..." : status === "failed" ? "Video unavailable" : "Preparing visual...";
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 1,
      background: "linear-gradient(155deg, #0a0a1a 0%, #111128 50%, #0a0a1a 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12,
      overflow: "hidden",
    }}>
      {/* Shimmer sweep */}
      {status !== "failed" && (
        <div style={{
          position: "absolute", inset: 0, overflow: "hidden", opacity: 0.15,
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
            animation: "shimmerSweep 2s ease-in-out infinite",
          }} />
        </div>
      )}
      {status !== "failed" && (
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          border: "2px solid rgba(99,102,241,0.2)",
          borderTop: "2px solid #6366f1",
          animation: "spin 1s linear infinite",
        }} />
      )}
      <span style={{
        color: status === "failed" ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.5)",
        fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
      }}>
        {label}
      </span>
    </div>
  );
}

// ── ReelCard ────────────────────────────────────────────────────────
function ReelCard({
  card, isActive, liked, likeCount, saved, commentCount,
  onLike, onComment, onSave, onShare, onDoubleTapLike,
}) {
  const videoRef = useRef(null);
  const lastTap = useRef(0);
  const [expanded, setExpanded] = useState(false);

  // Auto play/pause based on isActive
  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive && card.videoUrl && card.videoStatus === "ready") {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isActive, card.videoUrl, card.videoStatus]);

  const handleTap = (e) => {
    // Don't trigger on button clicks
    if (e.target.closest("button")) return;
    const now = Date.now();
    if (now - lastTap.current < 300) {
      onDoubleTapLike();
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  };

  const hasVideo = card.videoStatus === "ready" && card.videoUrl;
  const isLoading = card.videoStatus === "rendering" || card.videoStatus === "pending";
  const isFailed = card.videoStatus === "failed";

  return (
    <div onClick={handleTap} style={{
      width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#000",
    }}>
      {/* Video background */}
      {hasVideo && (
        <video
          ref={videoRef}
          src={card.videoUrl}
          loop muted playsInline
          onError={() => { /* parent handles via videoStatus */ }}
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%", objectFit: "cover", zIndex: 1,
          }}
        />
      )}

      {/* Shimmer placeholder when loading/failed/no video */}
      {(isLoading || isFailed || !hasVideo) && (
        <ShimmerPlaceholder status={isFailed ? "failed" : isLoading ? "rendering" : "preparing"} />
      )}

      {/* Dark gradient overlay at bottom */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: "65%", zIndex: 2,
        background: "linear-gradient(transparent, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.92))",
      }} />

      {/* Bottom text content */}
      <div style={{
        position: "absolute", bottom: 80, left: 14, right: 70, zIndex: 10,
      }}>
        {/* Author row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #06b6d4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 900, color: "#fff", fontFamily: "monospace",
          }}>F</div>
          <div>
            <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>
              FinanceReels
            </span>
            <div style={{
              display: "inline-flex", marginLeft: 8,
              background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)",
              borderRadius: 10, padding: "1px 8px",
            }}>
              <span style={{ fontSize: 9, color: "#a5b4fc", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                {card.emoji} {card.category}
              </span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: "clamp(18px, 5vw, 24px)", fontWeight: 800,
          color: "#fff", lineHeight: 1.2, marginBottom: 8,
          fontFamily: "'Bebas Neue', 'Impact', sans-serif",
          letterSpacing: 1,
          textShadow: "0 2px 10px rgba(0,0,0,0.5)",
        }}>
          {card.title}
        </h2>

        {/* Caption with "ver más" */}
        <div style={{ marginBottom: 6 }}>
          <p
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            style={{
              fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.5,
              fontFamily: "'DM Sans', sans-serif", margin: 0,
              ...(!expanded ? {
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              } : {}),
            }}
          >
            {card.caption}
          </p>
          {!expanded && card.caption && card.caption.length > 80 && (
            <span
              onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
              style={{
                color: "rgba(255,255,255,0.5)", fontSize: 12,
                fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
              }}
            >
              ver más
            </span>
          )}
        </div>
      </div>

      {/* Right sidebar actions */}
      <div style={{
        position: "absolute", right: 10, bottom: 140, zIndex: 20,
        display: "flex", flexDirection: "column", gap: 14, alignItems: "center",
      }}>
        <ActionButton
          icon={<HeartIcon filled={liked} />}
          count={likeCount}
          active={liked}
          onClick={onLike}
        />
        <ActionButton
          icon={<CommentIcon />}
          count={commentCount}
          onClick={onComment}
        />
        <ActionButton
          icon={<BookmarkIcon filled={saved} />}
          onClick={onSave}
        />
        <ActionButton
          icon={<ShareIcon />}
          onClick={onShare}
        />
      </div>
    </div>
  );
}

// ── CommentsPanel ───────────────────────────────────────────────────
function CommentsPanel({ cardId, onClose }) {
  const [comments, setComments] = useState(() => {
    const all = loadJSON(LS.COMMENTS, {});
    return all[cardId] || [];
  });
  const [text, setText] = useState("");

  const handlePost = () => {
    if (!text.trim()) return;
    const newComment = {
      id: Date.now(),
      text: text.trim(),
      author: "You",
      date: new Date().toLocaleDateString(),
    };
    const updated = [...comments, newComment];
    setComments(updated);
    // Save to localStorage
    const all = loadJSON(LS.COMMENTS, {});
    all[cardId] = updated;
    saveJSON(LS.COMMENTS, all);
    setText("");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
        }}
      />
      {/* Panel */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 210,
        background: "#111118", borderRadius: "18px 18px 0 0",
        maxHeight: "60vh", display: "flex", flexDirection: "column",
        animation: "slideInUp 0.3s ease-out",
        border: "1px solid rgba(255,255,255,0.06)",
      }}>
        {/* Drag handle */}
        <div style={{ padding: "10px 0 6px", display: "flex", justifyContent: "center" }}>
          <div style={{
            width: 36, height: 4, borderRadius: 2,
            background: "rgba(255,255,255,0.15)",
          }} />
        </div>

        <div style={{ padding: "0 16px 6px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 style={{ color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>
            Comments ({comments.length})
          </h3>
        </div>

        {/* Comment list */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "10px 16px",
          display: "flex", flexDirection: "column", gap: 12,
        }}>
          {comments.length === 0 && (
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, textAlign: "center", padding: "20px 0", fontFamily: "'DM Sans', sans-serif" }}>
              No comments yet. Be the first!
            </p>
          )}
          {comments.map(c => (
            <div key={c.id} style={{ display: "flex", gap: 10 }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, color: "#fff", fontWeight: 700,
              }}>Y</div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{c.author}</span>
                  <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>{c.date}</span>
                </div>
                <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, margin: "2px 0 0", lineHeight: 1.4, fontFamily: "'DM Sans', sans-serif" }}>
                  {c.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div style={{
          padding: "10px 16px 14px", display: "flex", gap: 8,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handlePost()}
            placeholder="Add a comment..."
            style={{
              flex: 1, background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20,
              padding: "9px 14px", color: "#fff", fontSize: 13,
              fontFamily: "'DM Sans', sans-serif", outline: "none",
            }}
          />
          <button
            onClick={handlePost}
            disabled={!text.trim()}
            style={{
              background: text.trim() ? "linear-gradient(135deg, #6366f1, #06b6d4)" : "rgba(255,255,255,0.06)",
              border: "none", borderRadius: 20, padding: "9px 16px",
              color: text.trim() ? "#fff" : "rgba(255,255,255,0.25)",
              fontSize: 13, fontWeight: 600, cursor: text.trim() ? "pointer" : "default",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Post
          </button>
        </div>
      </div>
    </>
  );
}

// ── ExploreScreen ───────────────────────────────────────────────────
function ExploreScreen({ cards, onNavigate }) {
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
      (c.caption || "").toLowerCase().includes(q);
  });

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 150, background: "#050510",
      display: "flex", flexDirection: "column", animation: "fadeIn 0.2s ease",
    }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 0" }}>
        <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 800, fontFamily: "'DM Sans', sans-serif", letterSpacing: 0.3 }}>
          Explore
        </h2>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
          {cards.length} cards
        </p>
      </div>

      {/* Search */}
      <div style={{ padding: "12px 16px 0" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search financial concepts..."
          style={{
            width: "100%", background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12,
            padding: "11px 14px", color: "#fff", fontSize: 13,
            fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box",
          }}
        />
      </div>

      {/* Category pills */}
      <div style={{
        padding: "12px 0 6px", overflowX: "auto", display: "flex", gap: 6,
        WebkitOverflowScrolling: "touch",
      }}>
        <div style={{ paddingLeft: 16 }} />
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCat(cat)} style={{
            flexShrink: 0,
            background: activeCat === cat ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${activeCat === cat ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.07)"}`,
            borderRadius: 20, padding: "5px 13px",
            color: activeCat === cat ? "#a5b4fc" : "rgba(255,255,255,0.4)",
            fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600, whiteSpace: "nowrap",
          }}>
            {cat}
          </button>
        ))}
        <div style={{ paddingRight: 10 }} />
      </div>

      {/* Card grid */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px 80px" }}>
        {filtered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            color: "rgba(255,255,255,0.25)", fontFamily: "'DM Sans', sans-serif", fontSize: 13,
          }}>
            No cards match your search
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {filtered.map(c => (
              <button key={c.id} onClick={() => onNavigate(c.id)} style={{
                background: "linear-gradient(155deg, #111128 0%, #0a0a1a 100%)",
                border: "1px solid rgba(99,102,241,0.12)",
                borderRadius: 14, padding: "14px 12px", cursor: "pointer",
                textAlign: "left", display: "flex", flexDirection: "column",
                gap: 8, minHeight: 130, position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", top: 0, right: 0, width: 60, height: 60,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)",
                }} />
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 20 }}>{c.emoji}</span>
                  <span style={{
                    background: "rgba(99,102,241,0.12)",
                    border: "1px solid rgba(99,102,241,0.25)",
                    borderRadius: 10, padding: "1px 7px",
                    fontSize: 8, color: "#a5b4fc", fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 700, letterSpacing: 1,
                  }}>{c.category}</span>
                </div>
                <p style={{
                  color: "#fff", fontSize: 12, fontWeight: 700,
                  fontFamily: "'Bebas Neue', 'Impact', sans-serif",
                  letterSpacing: 0.8, lineHeight: 1.2, margin: 0,
                  display: "-webkit-box", WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>
                  {c.title}
                </p>
                <p style={{
                  color: "rgba(255,255,255,0.4)", fontSize: 10,
                  fontFamily: "'DM Sans', sans-serif", lineHeight: 1.3, margin: 0,
                  display: "-webkit-box", WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical", overflow: "hidden",
                  marginTop: "auto",
                }}>
                  {c.caption}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── SavedScreen ─────────────────────────────────────────────────────
function SavedScreen({ cards, savedMap, onNavigate }) {
  const savedCards = cards.filter(c => savedMap[c.id]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 150, background: "#050510",
      display: "flex", flexDirection: "column", animation: "fadeIn 0.2s ease",
    }}>
      <div style={{ padding: "14px 16px 0" }}>
        <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 800, fontFamily: "'DM Sans', sans-serif" }}>
          Saved
        </h2>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
          {savedCards.length} bookmarked
        </p>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px 80px" }}>
        {savedCards.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "80px 20px",
            color: "rgba(255,255,255,0.25)", fontFamily: "'DM Sans', sans-serif", fontSize: 13,
          }}>
            <BookmarkIcon filled={false} />
            <p style={{ marginTop: 12 }}>No saved cards yet</p>
            <p style={{ fontSize: 11, marginTop: 4 }}>Tap the bookmark icon on any card to save it</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {savedCards.map(c => (
              <button key={c.id} onClick={() => onNavigate(c.id)} style={{
                background: "linear-gradient(155deg, #111128 0%, #0a0a1a 100%)",
                border: "1px solid rgba(99,102,241,0.12)",
                borderRadius: 14, padding: "14px 12px", cursor: "pointer",
                textAlign: "left", display: "flex", flexDirection: "column",
                gap: 6, minHeight: 110, position: "relative",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 18 }}>{c.emoji}</span>
                  <span style={{
                    fontSize: 8, color: "#a5b4fc", fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 700, letterSpacing: 1,
                  }}>{c.category}</span>
                </div>
                <p style={{
                  color: "#fff", fontSize: 12, fontWeight: 700,
                  fontFamily: "'Bebas Neue', 'Impact', sans-serif",
                  letterSpacing: 0.8, lineHeight: 1.2, margin: 0,
                  display: "-webkit-box", WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>
                  {c.title}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Loading Screen ──────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300, background: "#050510",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 16,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        background: "linear-gradient(135deg, #6366f1, #06b6d4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, fontWeight: 900, color: "#fff", fontFamily: "monospace",
      }}>F</div>
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        border: "2px solid rgba(99,102,241,0.2)",
        borderTop: "2px solid #6366f1",
        animation: "spin 1s linear infinite",
      }} />
      <span style={{
        color: "rgba(255,255,255,0.5)", fontSize: 14,
        fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
      }}>
        Generating your feed...
      </span>
    </div>
  );
}

// ── Bottom Nav Icons (SVG) ──────────────────────────────────────────
const FeedIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#fff" : "none"} stroke={active ? "#fff" : "rgba(255,255,255,0.4)"} strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const ExploreIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : "rgba(255,255,255,0.4)"} strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const SavedIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#fff" : "none"} stroke={active ? "#fff" : "rgba(255,255,255,0.4)"} strokeWidth="2">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
  </svg>
);

// ═══════════════════════════════════════════════════════════════════
// ── Main Component ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
export default function FinanceReels() {
  const [cards, setCards] = useState(() => loadJSON(LS.CARDS, []));
  const [cur, setCur] = useState(0);
  const [likes, setLikes] = useState(() => loadJSON(LS.LIKES, {}));
  const [saved, setSaved] = useState(() => loadJSON(LS.SAVED, {}));
  const [tab, setTab] = useState("feed");
  const [showHeart, setShowHeart] = useState(false);
  const [toast, setToast] = useState(null);
  const [commentCardId, setCommentCardId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);

  const lastNav = useRef(0);
  const touchY = useRef(null);
  const slideDir = useRef(1);
  const generatingRef = useRef(false);
  const videoQueueRef = useRef(new Set());
  const pollingRef = useRef(new Map());

  // ── Persist on change ───────────────────────────────────────────
  useEffect(() => { saveJSON(LS.LIKES, likes); }, [likes]);
  useEffect(() => { saveJSON(LS.SAVED, saved); }, [saved]);
  useEffect(() => {
    // Cap at MAX_CARDS
    const capped = cards.slice(-MAX_CARDS);
    saveJSON(LS.CARDS, capped);
  }, [cards]);

  // ── Install prompt ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  // ── Toast ───────────────────────────────────────────────────────
  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  // ── Video generation pipeline ─────────────────────────────────
  const MAX_CONCURRENT_VIDEOS = 2;

  const updateCardField = useCallback((cardId, fields) => {
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, ...fields } : c));
  }, []);

  const startVideoForCard = useCallback(async (card) => {
    if (videoQueueRef.current.size >= MAX_CONCURRENT_VIDEOS) return;
    if (!card.visualPrompt || card.videoStatus !== "none") return;

    videoQueueRef.current.add(card.id);
    updateCardField(card.id, { videoStatus: "rendering" });

    try {
      const taskId = await startVideoGeneration(card.visualPrompt);
      updateCardField(card.id, { videoTaskId: taskId });

      // Start polling
      const poll = setInterval(async () => {
        try {
          const data = await pollVideoStatus(taskId);
          if (data.status === "SUCCEEDED" && data.videoUrl) {
            clearInterval(poll);
            pollingRef.current.delete(card.id);
            videoQueueRef.current.delete(card.id);
            updateCardField(card.id, { videoStatus: "ready", videoUrl: data.videoUrl });
          } else if (data.status === "FAILED") {
            clearInterval(poll);
            pollingRef.current.delete(card.id);
            videoQueueRef.current.delete(card.id);
            updateCardField(card.id, { videoStatus: "failed" });
          }
        } catch {
          // Keep polling on transient errors
        }
      }, 4000);
      pollingRef.current.set(card.id, poll);
    } catch {
      videoQueueRef.current.delete(card.id);
      updateCardField(card.id, { videoStatus: "failed" });
    }
  }, [updateCardField]);

  // Resume polling for mid-generation cards on mount
  useEffect(() => {
    cards.forEach(card => {
      if (card.videoStatus === "rendering" && card.videoTaskId && !pollingRef.current.has(card.id)) {
        videoQueueRef.current.add(card.id);
        const poll = setInterval(async () => {
          try {
            const data = await pollVideoStatus(card.videoTaskId);
            if (data.status === "SUCCEEDED" && data.videoUrl) {
              clearInterval(poll);
              pollingRef.current.delete(card.id);
              videoQueueRef.current.delete(card.id);
              updateCardField(card.id, { videoStatus: "ready", videoUrl: data.videoUrl });
            } else if (data.status === "FAILED") {
              clearInterval(poll);
              pollingRef.current.delete(card.id);
              videoQueueRef.current.delete(card.id);
              updateCardField(card.id, { videoStatus: "failed" });
            }
          } catch {
            // Keep polling
          }
        }, 4000);
        pollingRef.current.set(card.id, poll);
      }
    });

    // Cleanup on unmount
    return () => {
      pollingRef.current.forEach(interval => clearInterval(interval));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Seed initial feed ─────────────────────────────────────────
  useEffect(() => {
    if (cards.length > 0 || generatingRef.current) return;
    generatingRef.current = true;
    setLoading(true);

    generateFeedBatch(5)
      .then(newCards => {
        setCards(newCards);
        // Auto-start video for first 2 cards
        newCards.slice(0, 2).forEach(c => startVideoForCard(c));
      })
      .catch(() => {
        showToast("Failed to generate feed. Check your connection.");
      })
      .finally(() => {
        setLoading(false);
        generatingRef.current = false;
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-load more cards when near end ────────────────────────
  useEffect(() => {
    if (cards.length === 0) return;
    if (cur < cards.length - 2) return;
    if (generatingRef.current) return;
    generatingRef.current = true;

    const excludeTopics = cards.slice(-10).map(c => c.category);
    generateFeedBatch(3, excludeTopics)
      .then(newCards => {
        setCards(prev => {
          const combined = [...prev, ...newCards];
          return combined.slice(-MAX_CARDS);
        });
        // Auto-start video for new cards
        newCards.forEach(c => startVideoForCard(c));
      })
      .catch(() => {})
      .finally(() => { generatingRef.current = false; });
  }, [cur, cards.length, startVideoForCard]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Navigation ────────────────────────────────────────────────
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

  // ── Helpers ───────────────────────────────────────────────────
  const card = cards[cur];
  const allComments = loadJSON(LS.COMMENTS, {});
  const getCommentCount = (cardId) => (allComments[cardId] || []).length;
  const getLikeCount = (cardId) => likes[cardId] ? 1 : 0;

  // ── Render ────────────────────────────────────────────────────
  if (loading && cards.length === 0) return <LoadingScreen />;

  return (
    <div
      onWheel={onWheel}
      onTouchStart={e => { touchY.current = e.touches[0].clientY; }}
      onTouchEnd={e => {
        if (!touchY.current) return;
        const diff = touchY.current - e.changedTouches[0].clientY;
        if (Math.abs(diff) > 42) nav(diff > 0 ? 1 : -1);
        touchY.current = null;
      }}
      style={{ width: "100vw", height: "100dvh", position: "relative", overflow: "hidden", background: "#000" }}
    >
      {/* TOP BAR */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 40,
        padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "linear-gradient(rgba(0,0,0,0.7), transparent)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #06b6d4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 900, color: "#fff", fontFamily: "monospace",
          }}>F</div>
          <span style={{
            color: "#fff", fontSize: 15, fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif", letterSpacing: 0.5,
          }}>
            Finance<span style={{ color: "#67e8f9" }}>Reels</span>
          </span>
        </div>
        {installPrompt && (
          <button onClick={handleInstall} style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.2))",
            border: "1px solid rgba(99,102,241,0.35)",
            borderRadius: 20, padding: "5px 12px",
            color: "#a5b4fc", fontSize: 11, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
          }}>
            Install
          </button>
        )}
      </div>

      {/* CARD */}
      {card && (
        <div key={card.id} style={{
          width: "100%", height: "100%",
          animation: `${slideDir.current > 0 ? "slideInUp" : "slideInDown"} 0.35s ease-out`,
        }}>
          <ReelCard
            card={card}
            isActive={tab === "feed"}
            liked={!!likes[card.id]}
            likeCount={getLikeCount(card.id)}
            saved={!!saved[card.id]}
            commentCount={getCommentCount(card.id)}
            onLike={() => {
              setLikes(p => ({ ...p, [card.id]: !p[card.id] }));
              if (!likes[card.id]) showToast("Liked!");
            }}
            onComment={() => setCommentCardId(card.id)}
            onSave={() => {
              setSaved(p => ({ ...p, [card.id]: !p[card.id] }));
              showToast(saved[card.id] ? "Removed from saved" : "Saved!");
            }}
            onShare={() => {
              const shareData = { title: card.title, text: `${card.caption} — FinanceReels`, url: window.location.href };
              if (navigator.share) {
                navigator.share(shareData).catch(() => {});
              } else {
                navigator.clipboard?.writeText(`${card.title} — FinanceReels`);
                showToast("Link copied!");
              }
            }}
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

      {/* No cards state */}
      {!card && !loading && (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", height: "100%", gap: 12,
        }}>
          <span style={{ fontSize: 40 }}>📱</span>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
            No cards available
          </p>
        </div>
      )}

      {/* Heart animation */}
      {showHeart && (
        <div style={{
          position: "absolute", top: "40%", left: "50%",
          transform: "translate(-50%,-50%)", zIndex: 60,
          pointerEvents: "none", fontSize: 80,
          animation: "heartPop 0.9s ease-out forwards",
          filter: "drop-shadow(0 0 20px rgba(239,68,68,0.6))",
        }}>
          ❤️
        </div>
      )}

      {/* BOTTOM NAV */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 40,
        background: "linear-gradient(transparent, rgba(0,0,0,0.96))",
        paddingTop: 20,
      }}>
        <div style={{
          display: "flex", justifyContent: "space-around", alignItems: "center",
          paddingBottom: 16, maxWidth: 300, margin: "0 auto",
        }}>
          {[
            { icon: <FeedIcon active={tab === "feed"} />, label: "Feed", id: "feed" },
            { icon: <ExploreIcon active={tab === "explore"} />, label: "Explore", id: "explore" },
            { icon: <SavedIcon active={tab === "saved"} />, label: "Saved", id: "saved" },
          ].map(item => (
            <button key={item.id} onClick={() => setTab(item.id)} style={{
              background: "none", border: "none",
              color: tab === item.id ? "#fff" : "rgba(255,255,255,0.35)",
              cursor: "pointer", display: "flex", flexDirection: "column",
              alignItems: "center", gap: 3, padding: "4px 12px",
            }}>
              {item.icon}
              <span style={{
                fontSize: 10, fontFamily: "'DM Sans', sans-serif",
                fontWeight: tab === item.id ? 600 : 400,
              }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          background: "rgba(15,15,30,0.92)", backdropFilter: "blur(18px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14, padding: "11px 22px",
          color: "#fff", fontSize: 13,
          fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
          zIndex: 100, animation: "slideUp 0.3s ease",
          whiteSpace: "nowrap", maxWidth: "90vw", textAlign: "center",
        }}>
          {toast}
        </div>
      )}

      {/* Explore screen */}
      {tab === "explore" && (
        <ExploreScreen
          cards={cards}
          onNavigate={(cardId) => {
            const idx = cards.findIndex(c => c.id === cardId);
            if (idx !== -1) { setCur(idx); setTab("feed"); }
          }}
        />
      )}

      {/* Saved screen */}
      {tab === "saved" && (
        <SavedScreen
          cards={cards}
          savedMap={saved}
          onNavigate={(cardId) => {
            const idx = cards.findIndex(c => c.id === cardId);
            if (idx !== -1) { setCur(idx); setTab("feed"); }
          }}
        />
      )}

      {/* Comments panel */}
      {commentCardId && (
        <CommentsPanel
          cardId={commentCardId}
          onClose={() => setCommentCardId(null)}
        />
      )}
    </div>
  );
}
