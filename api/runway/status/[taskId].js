export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.RUNWAY_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "RUNWAY_API_KEY not configured" });

  const { taskId } = req.query;

  try {
    const response = await fetch(`https://api.runwayml.com/v1/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);

    res.json({
      status: data.status,
      videoUrl: data.output?.[0] || null,
    });
  } catch (err) {
    console.error("Runway status error:", err.message);
    res.status(502).json({ error: "Failed to reach Runway API" });
  }
}
