import formidable from "formidable";
import fs from "fs/promises";
import path from "path";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const form = formidable({
    multiples: false,
    uploadDir: "./uploads",
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
    const newPath = path.join("uploads", newFileName);

    await fs.rename(filePath, newPath);

    const url = `/uploads/${newFileName}`;

    return res.status(200).json({ url });
  });
}