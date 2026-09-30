const { requireSession } = require('./auth');
const { db } = require('./db');

async function requireGestao(req, res) {
  const session = await requireSession(req, res);
  if (!session) return null;
  const sql = db();
  const rows = await sql`SELECT id,email,full_name,role,status FROM users WHERE id=${session.id} LIMIT 1`;
  const user = rows[0];
  if (!user || user.status !== 'ACTIVE' || user.role !== 'GESTAO') {
    res.status(403).json({ error:'FORBIDDEN' });
    return null;
  }
  return user;
}

module.exports = { requireGestao };
