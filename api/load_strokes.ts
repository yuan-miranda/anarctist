// api/load_strokes.ts
import { createClient } from "@libsql/client";
import { VercelRequest, VercelResponse } from '@vercel/node';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const result = await client.execute({
      sql: `
        SELECT path, color, width, timestamp
        FROM strokes
        ORDER BY timestamp ASC
      `,
    });

    const strokes = result.rows.map(row => ({
      path: JSON.parse(row.path),
      color: row.color,
      width: row.width,
      timestamp: row.timestamp,
    }));

    res.status(200).json(strokes);
  } catch (err) {
    console.error('Error loading strokes:', err);
    res.status(500).json({ error: 'Failed to load strokes' });
  }
}
