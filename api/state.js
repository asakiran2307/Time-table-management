// The legacy endpoint stored every visitor's data in one shared "default" row.
// It is intentionally retired. Use authenticated Supabase school-scoped storage only.
module.exports = function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Allow", "GET, PUT");
  return res.status(410).json({
    ok: false,
    error: "The legacy shared workspace endpoint has been retired. Sign in through the secured school workspace."
  });
};
