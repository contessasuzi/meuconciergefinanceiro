const { db } = require('./db');

async function getPhaseAccess(user) {
  if (user.role === 'GESTAO') {
    return [1,2,3].map(phase => ({
      phase,
      allowed: true,
      source: 'GESTAO',
      state: 'LIBERADA'
    }));
  }

  const sql = db();
  const rows = await sql`
    SELECT e.phase, e.source, COALESCE(p.state, 'LIBERADA') AS state
    FROM entitlements e
    LEFT JOIN phase_progress p
      ON p.user_id=e.user_id AND p.phase=e.phase
    WHERE e.user_id=${user.id} AND e.status='GRANTED'
    ORDER BY e.phase
  `;

  const byPhase = new Map(rows.map(r => [Number(r.phase), r]));
  return [1,2,3].map(phase => {
    const row = byPhase.get(phase);
    return {
      phase,
      allowed: !!row,
      source: row ? row.source : null,
      state: row ? row.state : 'BLOQUEADA'
    };
  });
}

async function canAccessPhase(user, phase) {
  if (user.role === 'GESTAO') return true;
  const sql = db();
  const rows = await sql`
    SELECT 1
    FROM entitlements
    WHERE user_id=${user.id}
      AND phase=${phase}
      AND status='GRANTED'
    LIMIT 1
  `;
  return rows.length > 0;
}

module.exports = { getPhaseAccess, canAccessPhase };
