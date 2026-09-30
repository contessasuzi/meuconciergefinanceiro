const { db } = require('../../lib/db');
const { method, noStore } = require('../../lib/http');
const { requireSession } = require('../../lib/auth');
const { getPhaseAccess } = require('../../lib/access');

module.exports = async function handler(req, res) {
  noStore(res);
  if (!method(req, res, ['GET'])) return;

  try {
    const session = await requireSession(req, res);
    if (!session) return;

    const sql = db();
    const rows = await sql`
      SELECT id,email,full_name,role,status
      FROM users
      WHERE id=${session.id}
      LIMIT 1
    `;

    const user = rows[0];
    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ error:'UNAUTHENTICATED' });
    }

    const phases = await getPhaseAccess(user);
    return res.status(200).json({ user, phases });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error:'ME_FAILED' });
  }
};
