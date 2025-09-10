// api/migrate_bounds.ts
// update canvas_strokes table to add bounding box columns to new and existing rows
import { createClient } from "@libsql/client";
import { VercelRequest, VercelResponse } from "@vercel/node";

const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
});

function computeBounds(points: { x: number; y: number }[]) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    }
    return { minX, maxX, minY, maxY };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        await client.execute(`
            ALTER TABLE canvas_strokes
            ADD COLUMN IF NOT EXISTS minX REAL,
            ADD COLUMN IF NOT EXISTS minY REAL,
            ADD COLUMN IF NOT EXISTS maxX REAL,
            ADD COLUMN IF NOT EXISTS maxY REAL;
        `);

        const result = await client.execute(`SELECT id, path FROM canvas_strokes`);
        for (const row of result.rows) {
            const points = JSON.parse(row.path);
            const { minX, minY, maxX, maxY } = computeBounds(points);

            await client.execute({
                sql: `
                    UPDATE canvas_strokes
                    SET minX = ?, minY = ?, maxX = ?, maxY = ?
                    WHERE id = ?
                    `,
                args: [minX, minY, maxX, maxY, row.id],
            });
        }

        res.status(200).json({ message: "Migration complete!" });
    } catch (err) {
        console.error("Migration error:", err);
        res.status(500).json({ error: "Migration failed" });
    }
}
