import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

import reviewHandler from './src/api/review.js';
import uploadHandler from './src/api/upload-video.js';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.resolve(__dirname, 'dist')));
app.use(express.json());

// ✅ API Routes
app.post('/api/review', reviewHandler);
app.post('/api/upload-video', uploadHandler);

app.get('/api/reviews', async (req, res) => {
  const dirPath = path.resolve('data');
  const files = await fs.readdir(dirPath);

  const reviews = await Promise.all(
    files
      .filter((file) => file.endsWith('.json')) // ✅ Only JSON
      .map(async (file) => {
        try {
          const content = await fs.readFile(path.join(dirPath, file), 'utf-8');
          return JSON.parse(content);
        } catch (err) {
          console.error(`❌ Failed to parse ${file}:`, err.message);
          return null;
        }
      })
  );

  const publicReviews = reviews.filter((r) => r && r.consent === true);
  res.json(publicReviews);
});

app.get(/.*/, async (req, res) => {
  const indexPath = path.resolve(__dirname, 'dist', 'index.html');
  try {
    await fs.access(indexPath);
    res.sendFile(indexPath);
  } catch (error) {
    console.error('❌ Could not find index.html:', error);
    res.status(500).send('index.html not found. Please run "npm run build" first.');
  }
});

const PORT = 3001;
console.log("🧠 server.js is launching...");
console.log("🟢 About to listen on port", PORT);

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});