const { neon } = require("@neondatabase/serverless");

const sql = () => {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  return neon(process.env.DATABASE_URL);
};

async function ensureTable(db) {
  await db`
    create table if not exists unischedule_app_state (
      id text primary key,
      data jsonb not null,
      updated_at timestamptz not null default now()
    )
  `;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");

  try {
    const db = sql();
    await ensureTable(db);

    if (req.method === "GET") {
      const rows = await db`
        select data, updated_at
        from unischedule_app_state
        where id = 'default'
        limit 1
      `;
      if (!rows.length) return res.status(404).json({ ok: false, error: "No cloud state yet" });
      return res.status(200).json({ ok: true, data: rows[0].data, updatedAt: rows[0].updated_at });
    }

    if (req.method === "PUT" || req.method === "POST") {
      let body = req.body;
      if (typeof body === "string") body = JSON.parse(body);
      if (!body || !body.data || typeof body.data !== "object") {
        return res.status(400).json({ ok: false, error: "Expected { data: object }" });
      }

      await db`
        insert into unischedule_app_state (id, data, updated_at)
        values ('default', ${JSON.stringify(body.data)}::jsonb, now())
        on conflict (id)
        do update set data = excluded.data, updated_at = now()
      `;

      return res.status(200).json({ ok: true, saved: true });
    }

    res.setHeader("Allow", "GET, PUT, POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  } catch (error) {
    console.error("Neon state API error:", error);
    return res.status(500).json({ ok: false, error: "Database operation failed" });
  }
};
