const { db } = require('../../lib/db');
const { method, noStore } = require('../../lib/http');
const { requireGestao } = require('../../lib/admin');

module.exports = async function handler(req, res) {
  noStore(res);
  if (!method(req, res, ['GET'])) return;
  const gestao = await requireGestao(req, res);
  if (!gestao) return;

  try {
    const sql = db();
    const rows = await sql`
      SELECT u.id,u.email,u.full_name,u.role,u.status,u.created_at,
             c.trade_name,c.legal_name,c.cnpj,
             COALESCE(json_agg(json_build_object(
               'phase',e.phase,'source',e.source,'status',e.status
             ) ORDER BY e.phase) FILTER (WHERE e.id IS NOT NULL),'[]'::json) AS entitlements
      FROM users u
      LEFT JOIN user_companies uc ON uc.user_id=u.id
      LEFT JOIN companies c ON c.id=uc.company_id
      LEFT JOIN entitlements e ON e.user_id=u.id AND e.status='GRANTED'
      GROUP BY u.id,c.id
      ORDER BY u.created_at DESC
      LIMIT 300
    `;
    return res.status(200).json({ users:rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error:'ADMIN_USERS_FAILED' });
  }
};
