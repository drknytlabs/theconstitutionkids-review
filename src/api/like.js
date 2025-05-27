import fs from 'fs';
import path from 'path';

const reviewsFile = path.join(process.cwd(), 'data', 'reviews.json');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }
    const raw = await fs.promises.readFile(reviewsFile, 'utf-8');
    const reviewsArray = JSON.parse(raw);

    // Get reviewId from request body
    const { reviewId } = req.body;
    if (!reviewId) {
      return res.status(400).json({ error: 'Missing reviewId in request body' });
    }

    const target = reviewsArray.find((r) => String(r.id) === String(reviewId));
    if (!target) return res.status(404).json({ error: 'Review not found' });

    target.likes = (target.likes || 0) + 1;

    await fs.promises.writeFile(reviewsFile, JSON.stringify(reviewsArray, null, 2), 'utf-8');

    return res.status(200).json({ success: true, likes: target.likes });
  } catch (error) {
    console.error('Error updating likes:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
