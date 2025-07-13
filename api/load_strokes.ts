// api/load_canvas.ts
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
            sql: 'SELECT * FROM canvas_strokes ORDER BY created_at ASC',
        });


        const strokes = result.rows.map((row: any) => {
            const path = JSON.parse(row.path);
            return {
                path,
                color: row.color,
                width: row.width,
                createdAt: row.created_at,
            };
        });

        res.status(200).json({ strokes });
    } catch (error) {
        console.error('Error loading canvas strokes:', error);
        res.status(500).json({ error: 'Failed to load canvas strokes' });
    }
}