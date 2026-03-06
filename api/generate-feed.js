export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });

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
    if (!response.ok) return res.status(response.status).json(data);

    const txt = data.content?.[0]?.text || "[]";
    const cards = JSON.parse(txt.replace(/```json|```/g, "").trim());
    res.json({ cards });
  } catch (err) {
    console.error("Feed generation error:", err.message);
    res.status(502).json({ error: "Failed to generate feed content" });
  }
}
