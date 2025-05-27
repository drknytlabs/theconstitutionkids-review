import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const form = formidable({ multiples: false, uploadDir: './uploads', keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form submission failed:', err);
      return res.status(500).json({ error: 'Submission failed' });
    }

    const flatten = (val) => Array.isArray(val) && val.length === 1 ? val[0] : val;

    const socialFields = Object.fromEntries(
      Object.entries(fields)
        .filter(([key, val]) => key.startsWith('social_') && flatten(val).trim() !== '')
        .map(([key, val]) => [key.replace('social_', ''), flatten(val)])
    );

    const uploadedDoc = Array.isArray(files.document) ? files.document[0] : files.document;
    const documentPath = uploadedDoc?.filepath
      ? uploadedDoc.filepath.replace(/^uploads/, '/uploads')
      : null;

    // Extract document URL path for frontend use
    const data = {
      name: flatten(fields.name),
      review: flatten(fields.review),
      phone: flatten(fields.phone),
      email: flatten(fields.email),
      location: flatten(fields.location),
      consent: flatten(fields.consent) === 'true',
      privateSubmit: flatten(fields.privateSubmit) === 'true',
      social: socialFields,
      document: uploadedDoc?.filepath || null,
      documentUrl: documentPath,
      videoUrl: flatten(fields.videoUrl),
      jobTitle: flatten(fields.jobTitle),
      organization: flatten(fields.organization),
      timestamp: new Date().toISOString(),
      userAgent: flatten(fields.userAgent),
      timezone: flatten(fields.timezone),
      localTime: flatten(fields.localTime),
      screenSize: flatten(fields.screenSize),
      referrer: flatten(fields.referrer),
      id: Date.now().toString(),
      likes: 0,
    };
    const rawName = flatten(fields.name) || 'anonymous';
    const safeName = rawName.replace(/\s/g, '-');
    const filename = `${data.id}-${safeName}.json`;
    const filepath = path.join('data', filename);
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));

    // Also append to data/reviews.json for frontend use
    const publicDataPath = path.join(process.cwd(), 'data');
    const reviewsFilePath = path.join(publicDataPath, 'reviews.json');

    // Ensure directory and file exist
    await fs.mkdir(publicDataPath, { recursive: true });
    try {
      await fs.access(reviewsFilePath);
    } catch {
      await fs.writeFile(reviewsFilePath, '[]', 'utf-8');
    }

    // Append review
    const reviewsRaw = await fs.readFile(reviewsFilePath, 'utf-8');
    const reviews = JSON.parse(reviewsRaw);
    reviews.push(data);
    await fs.writeFile(reviewsFilePath, JSON.stringify(reviews, null, 2), 'utf-8');

    res.status(200).json({ message: 'Review saved', filename });
  });
}