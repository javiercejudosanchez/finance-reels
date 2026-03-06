export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.RUNWAY_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "RUNWAY_API_KEY not configured" });

  const { prompt, duration } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt is required" });

  try {
    const response = await fetch("https://api.runwayml.com/v1/image_to_video", {
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
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    res.json({ taskId: data.id || data.task_id });
  } catch (err) {
    console.error("Runway generate error:", err.message);
    res.status(502).json({ error: "Failed to reach Runway API" });
  }
}
