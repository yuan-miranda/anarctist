// api/load_strokes.ts
import { createClient } from "@libsql/client";
import { VercelRequest, VercelResponse } from '@vercel/node';

const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!
});

function compressPoints(pointsArr: { x: number; y: number; }[]) {
    // "100,150;101,151" from [{x: 100, y: 150}, {x: 101, y: 151}]
    return pointsArr.map((point: { x: number; y: number; }) => {
        return `${point.x},${point.y}`;
    }).join(';');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const minX = parseFloat(req.query.minX as string);
    const minY = parseFloat(req.query.minY as string);
    const maxX = parseFloat(req.query.maxX as string);
    const maxY = parseFloat(req.query.maxY as string);

    if (isNaN(minX) || isNaN(minY) || isNaN(maxX) || isNaN(maxY)) {
        return res.status(400).json({ error: 'Invalid or missing bounding box parameters' });
    }

    try {
        const result = await client.execute({
            sql: `
                SELECT * FROM canvas_strokes
                WHERE maxX >= ? AND minX <= ? AND maxY >= ? AND minY <= ?    
                ORDER BY created_at ASC
            `,
            args: [minX, maxX, minY, maxY],
        });

        const strokes = result.rows.map((row: any) => {
            const pointStr = JSON.parse(row.path);
            return {
                id: row.id,
                points: compressPoints(pointStr),
                stroke: row.color,
                strokeWidth: row.width,
                createdAt: row.created_at,
            };
        });

        // cache header for 2 seconds, with stale-while-revalidate for 10 seconds
        res.setHeader('Cache-Control', 's-maxage=2, stale-while-revalidate=10');
        res.status(200).json({ strokes });
    } catch (error) {
        console.error('Error loading canvas strokes:', error);
        res.status(500).json({ error: 'Failed to load canvas strokes' });
    }
}