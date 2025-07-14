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

    const { path, color, width } = req.body;
    if (!path || !Array.isArray(path) || !color || !width) {
        return res.status(400).json({ error: 'Invalid request body. Expected path, color, and width.' });
    }

    try {
        const result = await client.execute({
            sql: `
                INSERT INTO canvas_strokes (path, color, width)
                VALUES (?, ?, ?)
                RETURNING id
            `,
            args: [JSON.stringify(path), color, width]
        });

        const id = result.rows[0].id;
        res.status(200).json({ message: 'Canvas stroke saved successfully', id });
    } catch (error) {
        console.error('Error saving canvas stroke:', error);
        res.status(500).json({ error: 'Failed to save canvas stroke' });
    }
}