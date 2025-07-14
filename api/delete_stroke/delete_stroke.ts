// api/delete_stroke/delete_stroke.ts
import { createClient } from "@libsql/client/http";

export const config = {
    runtime: 'edge',
};

const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!
});

export default async function handler(req: Request) {
    if (req.method !== 'DELETE') {
        // return res.status(405).json({ error: 'Method Not Allowed' });
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const { id, deleteAll } = await req.json();
        if (!id && !deleteAll) {
            return new Response(JSON.stringify({ error: 'Invalid request body. Expected id.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (deleteAll) {
            await client.execute('DELETE FROM canvas_strokes');
        } else {
            await client.execute('DELETE FROM canvas_strokes WHERE id = ?', [id]);
        }

        return new Response(JSON.stringify({ message: 'Canvas stroke deleted successfully' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error deleting canvas stroke:', error);
        return new Response(JSON.stringify({ error: 'Failed to delete canvas stroke' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}