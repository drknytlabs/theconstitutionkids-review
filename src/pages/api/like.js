import fs from 'fs';
import path from 'path';

const reviewsFile = path.join(process.cwd(), 'public', 'data', 'reviews.json');

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { reviewId } = req.body;
    if (!reviewId) return res.status(400).json({ error: 'Missing reviewId' });

    const raw = fs.readFileSync(reviewsFile, 'utf-8');
    const reviews = JSON.parse(raw);

    const target = reviews.find((r) => String(r.id) === String(reviewId));
    if (!target) return res.status(404).json({ error: 'Review not found' });

    target.likes = (target.likes || 0) + 1;

    fs.writeFileSync(reviewsFile, JSON.stringify(reviews, null, 2), 'utf-8');

    return res.status(200).json({ success: true, likes: target.likes });
  } catch (error) {
    console.error('Error updating likes:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
