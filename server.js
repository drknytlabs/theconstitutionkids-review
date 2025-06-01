import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();
console.log("OPENAI_API_KEY loaded?", !!process.env.OPENAI_API_KEY);

import loadRoutes from './utils/loadRoutes.js';
import fs from 'fs/promises';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

const __dirname = path
.dirname(fileURLToPath(import.meta.url));
const app = express();

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
});
app.use(express.static(path.resolve(__dirname, 'dist')));
app.use(limiter);

app.use(morgan('dev'));
app.use(helmet());
app.use(express.json());

const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS rejected: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

await loadRoutes(app, 'src/api');

app.get('/api/reviews', async (_req, res) => {
  const dirPath = path.resolve('data');
  let files;
  try {
    files = await fs.readdir(dirPath);
  } catch (err) {
    console.error('❌ Failed to read data directory:', err.message);
    return res.status(500).json({ error: 'Data directory not found' });
  }

  const reviews = await Promise.all(
    files
      .filter((file) => file.endsWith('.json'))
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

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get(/.*/, async (req, res, next) => {
  const isStatic = req.path.startsWith('/assets') || req.path.startsWith('/uploads') || req.path.startsWith('/api');

  if (isStatic) {
    return next(); // Let static handler or API route take it
  }

  const indexPath = path.resolve(__dirname, 'dist', 'index.html');
  try {
    await fs.access(indexPath);
    res.sendFile(indexPath);
  } catch (error) {
    console.error('index.html not found in dist:', error);
    res.status(500).send('index.html not found. Please run "npm run build" first.');
  }
});

app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

if (!process.env.PORT) {
  console.warn('⚠️ PORT not set in .env, defaulting to 3000');
}
console.log(`ℹ️ Running in ${NODE_ENV} mode`);
console.log(`ℹ️ Using PORT: ${PORT}`);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
});

const shutdown = () => {
  console.log('🛑 Gracefully shutting down...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

process.on("unhandledRejection", (reason) => {
  console.error("🧨 Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("🔥 Uncaught Exception:", err);
});
