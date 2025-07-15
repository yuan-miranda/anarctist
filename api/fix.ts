// /api/fix-canvas.ts
import { createClient } from '@libsql/client'
import { VercelRequest, VercelResponse } from '@vercel/node'

const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' })
    }

    try {
        // 1. Create the new table
        await client.execute(`
      CREATE TABLE IF NOT EXISTS new_canvas_strokes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL,
        color TEXT NOT NULL,
        width INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)

        // 2. Copy data from old table (reindexing the IDs)
        const rows = await client.execute('SELECT path, color, width, created_at FROM canvas_strokes')
        for (const row of rows.rows) {
            await client.execute({
                sql: `
          INSERT INTO new_canvas_strokes (path, color, width, created_at)
          VALUES (?, ?, ?, ?)
        `,
                args: [row.path, row.color, row.width, row.created_at],
            })
        }

        // 3. Drop old table
        await client.execute('DROP TABLE canvas_strokes')

        // 4. Rename new table
        await client.execute('ALTER TABLE new_canvas_strokes RENAME TO canvas_strokes')

        return res.status(200).json({ message: 'canvas_strokes table reindexed and replaced successfully.' })
    } catch (error: any) {
        console.error('Error during fix:', error)
        return res.status(500).json({ error: 'Something went wrong', detail: error.message })
    }
}
