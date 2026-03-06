import "dotenv/config";
import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

// ── Health check ────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ── Batch feed generation ───────────────────────────────────────────
app.post("/api/generate-feed", async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  const { count = 3, excludeTopics = [] } = req.body;
  const excludeClause = excludeTopics.length
    ? `\nAVOID these topics (already covered): ${excludeTopics.join(", ")}`
    : "";

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: `You are a world-class financial content creator for FinanceReels — a TikTok-style app for global finance education. Your audience: sophisticated investors, fintech founders, and finance professionals aged 25-45.

Cover DIVERSE topics across: debt tokenization, macro/global liquidity, DeFi, smart contracts, private credit, repo markets, collateral management, stablecoins, financial inclusion, project finance, credit ratings, acquisition finance, FX markets, central banking, structured products, securitization, derivatives, ESG finance, venture debt, trade finance, commodities, insurance-linked securities, and emerging market debt.

Each card must be unique, punchy, and educational. Use concrete data, real mechanisms, and sticky analogies.`,
        messages: [{
          role: "user",
          content: `Generate exactly ${count} unique FinanceReels cards.${excludeClause}

Respond ONLY with a valid JSON array, no markdown or wrapping:
[{
  "title": "punchy title max 8 words",
  "caption": "2-3 sentences with concrete data and real mechanisms. Educational and engaging.",
  "category": "CAPS_SNAKE_CASE category",
  "emoji": "one relevant emoji",
  "visualPrompt": "Runway/Sora cinematic visual description, 20-30 words, dark luxury aesthetic, abstract financial imagery"
}]`
        }],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    const txt = data.content?.[0]?.text || "[]";
    const cards = JSON.parse(txt.replace(/```json|```/g, "").trim());
    res.json({ cards });
  } catch (err) {
    console.error("Feed generation error:", err.message);
    res.status(502).json({ error: "Failed to generate feed content" });
  }
});

// ── Claude proxy ────────────────────────────────────────────────────
app.post("/api/claude", async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  const { messages, system, max_tokens } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array is required" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: max_tokens || 1024,
        ...(system && { system }),
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (err) {
    console.error("Claude proxy error:", err.message);
    res.status(502).json({ error: "Failed to reach Anthropic API" });
  }
});

// ── Runway: generate video ──────────────────────────────────────────
app.post("/api/runway/generate", async (req, res) => {
  const apiKey = process.env.RUNWAY_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "RUNWAY_API_KEY not configured" });
  }

  const { prompt, duration } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "prompt is required" });
  }

  try {
    const response = await fetch(
      "https://api.runwayml.com/v1/image_to_video",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gen3a_turbo",
          text_prompt: prompt,
          duration: duration || 5,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json({ taskId: data.id || data.task_id });
  } catch (err) {
    console.error("Runway generate error:", err.message);
    res.status(502).json({ error: "Failed to reach Runway API" });
  }
});

// ── Runway: poll status ─────────────────────────────────────────────
app.get("/api/runway/status/:taskId", async (req, res) => {
  const apiKey = process.env.RUNWAY_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "RUNWAY_API_KEY not configured" });
  }

  const { taskId } = req.params;

  try {
    const response = await fetch(
      `https://api.runwayml.com/v1/tasks/${taskId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json({
      status: data.status,
      videoUrl: data.output?.[0] || null,
    });
  } catch (err) {
    console.error("Runway status error:", err.message);
    res.status(502).json({ error: "Failed to reach Runway API" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
