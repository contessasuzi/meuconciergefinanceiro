const { method, noStore } = require('../../lib/http');
const { requireSession } = require('../../lib/auth');
const { canAccessPhase } = require('../../lib/access');

module.exports = async function handler(req, res) {
  noStore(res);
  if (!method(req, res, ['GET'])) return;
  const session = await requireSession(req, res);
  if (!session) return;

  try {
    const phase = Number(req.query && req.query.phase);
    if (![1,2,3].includes(phase)) return res.status(400).json({ error:'INVALID_PHASE' });
    const allowed = await canAccessPhase(session, phase);
    return res.status(200).json({ phase, allowed });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error:'ACCESS_CHECK_FAILED' });
  }
};
