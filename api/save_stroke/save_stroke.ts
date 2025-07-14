// api/save_stroke/save_stroke.ts
import { createClient } from "@libsql/client/http";

export const config = {
    runtime: 'edge',
};

const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!
});

export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const { path, color, width } = await req.json();
        if (!path || !color || !width) {
            return new Response(JSON.stringify({ error: 'Invalid request body. Expected path, color, and width.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        let storedPath: string;
        if (Array.isArray(path)) storedPath = JSON.stringify(path); // json format
        else if (typeof path === 'string') storedPath = path; // string format "100,150;101,151"
        else {
            return new Response(JSON.stringify({ error: 'Invalid path format. Expected an array or a string.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const result = await client.execute({
            sql: `
                INSERT INTO canvas_strokes (path, color, width)
                VALUES (?, ?, ?)
                RETURNING id
            `,
            args: [storedPath, color, width],
        });

        const id = result.rows[0].id;
        return new Response(JSON.stringify({ message: 'Canvas stroke saved successfully', id }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error saving canvas stroke:', error);
        return new Response(JSON.stringify({ error: 'Failed to save canvas stroke' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}