// api/save_stroke.ts
import { createClient } from "@libsql/client";
import { VercelRequest, VercelResponse } from '@vercel/node';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { path, color, width, timestamp } = req.body;

  if (!path || !Array.isArray(path) || !color || !width || !timestamp) {
    return res.status(400).json({ error: 'Missing or invalid stroke data' });
  }

  try {
    await client.execute({
      sql: `
        INSERT INTO strokes (path, color, width, timestamp)
        VALUES (?, ?, ?, ?)
      `,
      args: [JSON.stringify(path), color, width, timestamp],
    });

    res.status(200).json({ message: 'Stroke saved successfully' });
  } catch (err) {
    console.error('Error saving stroke:', err);
    res.status(500).json({ error: 'Failed to save stroke' });
  }
}
