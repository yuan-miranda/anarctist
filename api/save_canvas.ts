// api/save_canvas.ts
import { createClient } from "@libsql/client";
import { VercelRequest, VercelResponse } from '@vercel/node';

const client = createClient({
    url: process.env.TURSO_DB_URL!,
    authToken: process.env.TURSO_DB_AUTH_TOKEN!
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { data } = req.body;
    if (!data) return res.status(400).json({ error: 'Data is required' });

    try {
        await client.execute({
            sql: `
                INSERT INTO canvas_data (id, data)
                VALUES (?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    data = excluded.data,
                    created_at = CURRENT_TIMESTAMP;
            `,
            args: ['default', data],
        });

        res.status(200).json({ message: 'Canvas data saved successfully' });
    } catch (error) {
        console.error('Error saving canvas data:', error);
        res.status(500).json({ error: 'Failed to save canvas data' });
    }
}