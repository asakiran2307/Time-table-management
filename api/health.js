const { neon } = require("@neondatabase/serverless");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(503).json({
      ok: false,
      database: "neon-postgresql",
      configured: false,
      error: "DATABASE_URL is not configured in this Vercel environment"
    });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`select 1 as ok, current_database() as database`;
    return res.status(200).json({
      ok: true,
      database: "neon-postgresql",
      configured: true,
      connected: rows[0]?.ok === 1,
      name: rows[0]?.database || null
    });
  } catch (error) {
    console.error("Neon health check failed:", error);
    return res.status(503).json({
      ok: false,
      database: "neon-postgresql",
      configured: true,
      connected: false,
      error: "Database connection failed"
    });
  }
};
