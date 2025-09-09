import { createClient } from "@libsql/client";
import { VercelRequest, VercelResponse } from '@vercel/node';

const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!
});

function decompressPoints(pointStr: string) {
    // "10,20;30,40" -> [{x:10,y:20},{x:30,y:40}]
    return pointStr.split(';').map(pair => {
        const [x, y] = pair.split(',').map(Number);
        return { x, y };
    });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { points, stroke, strokeWidth } = req.body;

    if (!points || !stroke || !strokeWidth) {
        return res.status(400).json({ error: 'Invalid request body. Expected points, stroke, and strokeWidth.' });
    }

    try {
        const pointsArray = decompressPoints(points);

        const result = await client.execute({
            sql: `
                INSERT INTO canvas_strokes (path, color, width)
                VALUES (?, ?, ?)
                RETURNING id
            `,
            args: [JSON.stringify(pointsArray), stroke, strokeWidth]
        });

        const id = result.rows[0].id;
        res.status(200).json({ message: 'Canvas stroke saved successfully', id });
    } catch (error) {
        console.error('Error saving canvas stroke:', error);
        res.status(500).json({ error: 'Failed to save canvas stroke' });
    }
}