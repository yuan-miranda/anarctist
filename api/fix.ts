import { createClient } from "@libsql/client";

// Initialize Turso client
const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})

async function fixCanvasStrokes() {
  console.log('⏳ Fixing canvas_strokes...')

  // 1. Create new table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS new_canvas_strokes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      color TEXT NOT NULL,
      width INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // 2. Copy data over (without the old ID)
  const rows = await client.execute('SELECT path, color, width, created_at FROM canvas_strokes')
  for (const row of rows.rows) {
    await client.execute({
      sql: `INSERT INTO new_canvas_strokes (path, color, width, created_at) VALUES (?, ?, ?, ?)`,
      args: [row.path, row.color, row.width, row.created_at],
    })
  }

  // 3. Drop old table
  await client.execute(`DROP TABLE canvas_strokes`)

  // 4. Rename new table
  await client.execute(`ALTER TABLE new_canvas_strokes RENAME TO canvas_strokes`)

  console.log('✅ canvas_strokes table fixed and reindexed!')
}

fixCanvasStrokes().catch((err) => {
  console.error('❌ Failed to fix canvas_strokes:', err)
  process.exit(1)
})
