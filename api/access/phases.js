const { method, noStore } = require('../../lib/http');
const { requireSession } = require('../../lib/auth');
const { getPhaseAccess } = require('../../lib/access');

module.exports = async function handler(req, res) {
  noStore(res);
  if (!method(req, res, ['GET'])) return;

  const session = await requireSession(req, res);
  if (!session) return;

  try {
    const phases = await getPhaseAccess(session);
    return res.status(200).json({ phases });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error:'PHASE_ACCESS_FAILED' });
  }
};
