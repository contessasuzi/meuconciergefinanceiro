const { db } = require('../../lib/db');
const { jsonBody, method, noStore } = require('../../lib/http');
const { requireSession } = require('../../lib/auth');
const { canAccessPhase } = require('../../lib/access');
const { primaryCompanyForUser } = require('../../lib/company');

module.exports = async function handler(req, res) {
  noStore(res);
  if (!method(req, res, ['POST'])) return;
  const session = await requireSession(req, res);
  if (!session) return;

  try {
    const phase = Number(jsonBody(req).phase);
    if (![1,2,3].includes(phase)) return res.status(400).json({ error:'INVALID_PHASE' });
    if (!(await canAccessPhase(session, phase))) return res.status(403).json({ error:'PHASE_NOT_ALLOWED' });

    const sql = db();
    const company = await primaryCompanyForUser(session.id);
    await sql`
      INSERT INTO phase_progress(user_id,company_id,phase,state)
      VALUES(${session.id},${company ? company.id : null},${phase},'CONCLUIDA')
      ON CONFLICT (user_id,phase)
      DO UPDATE SET state='CONCLUIDA',updated_at=now()
    `;
    await sql`
      INSERT INTO audit_log(user_id,action,metadata)
      VALUES(${session.id},'PHASE_COMPLETED',${JSON.stringify({ phase, companyId: company ? company.id : null })}::jsonb)
    `;
    return res.status(200).json({ ok:true, phase, state:'CONCLUIDA' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error:'PHASE_COMPLETE_FAILED' });
  }
};
