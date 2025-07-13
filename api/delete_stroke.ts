// api/delete_stroke.ts
import { createClient } from "@libsql/client";
import { VercelRequest, VercelResponse } from '@vercel/node';

const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { id, deleteAll } = req.body;
    if (!id && !deleteAll) {
        return res.status(400).json({ error: 'Invalid request body. Expected id.' });
    }

    try {
        if (deleteAll) {
            await client.execute('DELETE FROM canvas_strokes');
        } else {
            await client.execute('DELETE FROM canvas_strokes WHERE id = ?', [id]);
        }

        res.status(200).json({ message: 'Canvas stroke deleted successfully' });
    } catch (error) {
        console.error('Error deleting canvas stroke:', error);
        res.status(500).json({ error: 'Failed to delete canvas stroke' });
    }
}