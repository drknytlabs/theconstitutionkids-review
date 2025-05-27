// Uses node-fetch for OpenAI API calls – make sure it's installed npm install node-fetch@^3

import fetch from "node-fetch";
import { promises as fs } from "fs";
import path from "path";

export const method = "post";
export const apiPath = "/api/summarize";

export default async function handler(req, res) {
  try {
    const { text, reviewId } = req.body;

    const prompt = `Summarize the following review in one sentence, and suggest up to 3 descriptive tags based on tone or content. Format the response as:

Summary: ...
Tags: [tag1, tag2, tag3]

Review:
${text}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
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
    const output = data.choices[0].message.content;

    const summaryMatch = output.match(/Summary:\s*(.*)/i);
    const tagsMatch = output.match(/Tags:\s*\[([^\]]*)\]/i);

    const tags = tagsMatch ? tagsMatch[1].split(",").map(tag => tag.trim()) : [];

    // If reviewId is provided, update the corresponding review JSON file with summary and tags
    if (reviewId) {
      const reviewPath = path.join(process.cwd(), 'data', `${reviewId}.json`);
      try {
        const reviewData = JSON.parse(await fs.readFile(reviewPath, 'utf-8'));
        reviewData.summary = summaryMatch ? summaryMatch[1] : "";
        reviewData.tags = tags;
        await fs.writeFile(reviewPath, JSON.stringify(reviewData, null, 2));
      } catch (fileError) {
        console.warn("Could not update review with summary:", fileError);
      }
    }

    res.json({
      summary: summaryMatch ? summaryMatch[1] : "",
      tags,
    });
  } catch (error) {
    console.error("Summarize API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}