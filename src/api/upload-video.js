import formidable from "formidable";
import fs from "fs/promises";
import path from "path";
import fetch from "node-fetch";
import FormData from "form-data";

async function transcribeWithWhisper(filePath) {
  const formData = new FormData();
  formData.append("file", await fs.readFile(filePath), {
    filename: path.basename(filePath),
    contentType: "audio/webm",
  });
  formData.append("model", "whisper-1");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    console.error("Whisper API error:", await response.text());
    return null;
  }

  const data = await response.json();
  return data.text;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const form = formidable({
    multiples: false,
    uploadDir: path.resolve("data/uploads"),
    keepExtensions: true,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(500).json({ error: "File upload failed" });
    }

    // ✅ SAFETY CHECK
    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
    const filePath = uploadedFile?.filepath;
    if (!filePath) {
      console.error("No file or filepath provided in upload");
      return res.status(400).json({ error: "No video file uploaded" });
    }

    const rawName = uploadedFile?.originalFilename || `upload-${Date.now()}.webm`;
    const baseName = path.parse(rawName).name.replace(/\W+/g, "-");
    const newFileName = `${Date.now()}-${baseName}.webm`;

    await fs.mkdir("data/uploads", { recursive: true });
    const newPath = path.join("data/uploads", newFileName);

    await fs.rename(filePath, newPath);

    const transcript = await transcribeWithWhisper(newPath);

    const url = `/data/uploads/${newFileName}`;

    return res.status(200).json({ url, transcript });
  });
}