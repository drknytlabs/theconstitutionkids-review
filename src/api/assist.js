import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const method = "post";
export const path = "/api/assist";

export default async function handler(req, res) {
  if (!OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY is not defined');
    return res.status(500).json({ error: 'Missing API key' });
  }

  try {
    const { name, jobTitle, organization } = req.body;

    const prompt = `You are an assistant helping someone write a review. Based on the following inputs, generate a compelling review headline and a 2-3 sentence review draft.
    
Name: ${name || "Anonymous"}
Job Title: ${jobTitle || "Member"}
Organization: ${organization || "the community"}

Format your response as:
Headline: ...
Review: ...`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ error: "AI error", details: errorText });
    }

    const data = await response.json();
    const text = data.choices[0].message.content;

    const headlineMatch = text.match(/Headline:\s*(.*)/i);
    const reviewMatch = text.match(/Review:\s*(.*)/i);

    res.json({
      headlineSuggestion: headlineMatch ? headlineMatch[1] : "",
      reviewDraft: reviewMatch ? reviewMatch[1] : "",
    });
  } catch (error) {
    console.error("Assist API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}