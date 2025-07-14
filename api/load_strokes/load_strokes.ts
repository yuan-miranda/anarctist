// api/load_strokes/load_strokes.ts
import { createClient } from "@libsql/client/http";

export const config = {
    runtime: 'edge',
};

const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!
});

export default async function handler(req: Request) {
    if (req.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const result = await client.execute({
            sql: 'SELECT * FROM canvas_strokes ORDER BY created_at ASC',
        });

        const strokes = result.rows.map((row: any) => {
            return {
                path: row.path,
                color: row.color,
                width: row.width,
                createdAt: row.created_at,
            };
        });

        return new Response(JSON.stringify({ strokes }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error loading canvas strokes:', error);
        return new Response(JSON.stringify({ error: 'Failed to load canvas strokes' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}