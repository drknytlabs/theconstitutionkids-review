import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const form = formidable({ multiples: false, uploadDir: './uploads', keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form submission failed:', err);
      return res.status(500).json({ error: 'Submission failed' });
    }

    const data = {
      ...fields,
      consent: fields.consent === 'true',
      privateSubmit: fields.privateSubmit === 'true',
      document: files?.document?.filepath || null,
      timestamp: new Date().toISOString(),
    };

    const filename = `${Date.now()}-${fields.name.replace(/\s/g, '-')}.json`;
    const filepath = path.join('data', filename);
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));

    res.status(200).json({ message: 'Review saved', filename });
  });
}