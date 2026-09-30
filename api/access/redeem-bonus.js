const crypto = require('crypto');
const { db } = require('../../lib/db');
const { jsonBody, method, noStore } = require('../../lib/http');
const { requireSession } = require('../../lib/auth');
const { primaryCompanyForUser } = require('../../lib/company');

function codeHash(code) {
  return crypto.createHash('sha256').update(String(code).trim().toUpperCase()).digest('hex');
}

module.exports = async function handler(req, res) {
  noStore(res);
  if (!method(req, res, ['POST'])) return;

  const session = await requireSession(req, res);
  if (!session) return;

  try {
    const code = String(jsonBody(req).code || '').trim().toUpperCase();
    if (!code) return res.status(400).json({ error:'BONUS_CODE_REQUIRED' });

    const sql = db();
    const hash = codeHash(code);

    const found = await sql`
      SELECT *
      FROM bonus_codes
      WHERE code_hash=${hash}
        AND status='ACTIVE'
        AND (expires_at IS NULL OR expires_at > now())
      LIMIT 1
    `;

    const bonus = found[0];
    if (!bonus) return res.status(404).json({ error:'BONUS_CODE_INVALID' });

    const company = await primaryCompanyForUser(session.id);
    if (bonus.assigned_cnpj) {
      if (!company || company.cnpj !== bonus.assigned_cnpj) {
        return res.status(403).json({ error:'BONUS_CODE_NOT_ASSIGNED_TO_COMPANY' });
      }
    }

    const phases = [];
    if (bonus.grants_phase_1) phases.push(1);
    if (bonus.grants_phase_2) phases.push(2);
    if (bonus.grants_phase_3) phases.push(3);

    const updated = await sql`
      UPDATE bonus_codes
      SET status='REDEEMED',
          redeemed_by=${session.id},
          redeemed_company_id=${company ? company.id : null},
          redeemed_at=now()
      WHERE id=${bonus.id} AND status='ACTIVE'
      RETURNING id
    `;

    if (!updated.length) return res.status(409).json({ error:'BONUS_CODE_ALREADY_USED' });

    for (const phase of phases) {
      await sql`
        INSERT INTO entitlements(user_id,company_id,phase,status,source,source_ref)
        VALUES(${session.id},${company ? company.id : null},${phase},'GRANTED','BONUS_CASE',${String(bonus.id)})
        ON CONFLICT (user_id,phase,source)
        DO UPDATE SET company_id=EXCLUDED.company_id,status='GRANTED',revoked_at=NULL
      `;

      await sql`
        INSERT INTO phase_progress(user_id,company_id,phase,state)
        VALUES(${session.id},${company ? company.id : null},${phase},'LIBERADA')
        ON CONFLICT (user_id,phase)
        DO UPDATE SET
          company_id=COALESCE(EXCLUDED.company_id,phase_progress.company_id),
          state=CASE WHEN phase_progress.state='CONCLUIDA' THEN 'CONCLUIDA' ELSE 'LIBERADA' END,
          updated_at=now()
      `;
    }

    await sql`
      INSERT INTO audit_log(user_id,action,metadata)
      VALUES(${session.id},'BONUS_REDEEMED',${JSON.stringify({ bonusId: bonus.id, phases, companyId: company ? company.id : null })}::jsonb)
    `;

    return res.status(200).json({ ok:true, phases });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error:'BONUS_REDEEM_FAILED' });
  }
};
