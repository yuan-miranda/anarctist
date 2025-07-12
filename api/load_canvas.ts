// api/load_canvas.ts
import { createClient } from "@libsql/client";
import { VercelRequest, VercelResponse } from '@vercel/node';

const client = createClient({
    url: process.env.TURSO_DB_URL!,
    authToken: process.env.TURSO_DB_AUTH_TOKEN!
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const result = await client.execute({
            sql: 'SELECT data FROM canvas_data WHERE id = ? LIMIT 1',
            args: ['default'],
        });

        const row = result.rows[0];
        if (!row) return res.status(404).json({ error: 'Canvas not found' });

        res.status(200).json({ data: row.data });
    } catch (error) {
        console.error('Error loading canvas:', error);
        res.status(500).json({ error: 'Failed to load canvas data' });
    }
}