import formidable from 'formidable';
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
      console.error('Video upload failed:', err);
      return res.status(500).json({ error: 'Upload failed' });
    }

    const filePath = files.file?.filepath;
    const fileName = path.basename(filePath);
    const url = `/uploads/${fileName}`;

    res.status(200).json({ url });
  });
}