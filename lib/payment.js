const { db } = require('./db');

async function grantPaidPhase({ userId, companyId=null, phase, paymentId }) {
  const phaseNumber = Number(phase);
  if (![1,2,3].includes(phaseNumber)) throw new Error('INVALID_PHASE');
  const sql = db();

  await sql`
    INSERT INTO entitlements(user_id,company_id,phase,status,source,source_ref)
    VALUES(${userId},${companyId},${phaseNumber},'GRANTED','PAYMENT',${String(paymentId)})
    ON CONFLICT (user_id,phase,source)
    DO UPDATE SET company_id=EXCLUDED.company_id,status='GRANTED',source_ref=EXCLUDED.source_ref,revoked_at=NULL
  `;

  await sql`
    INSERT INTO phase_progress(user_id,company_id,phase,state)
    VALUES(${userId},${companyId},${phaseNumber},'LIBERADA')
    ON CONFLICT (user_id,phase)
    DO UPDATE SET company_id=COALESCE(EXCLUDED.company_id,phase_progress.company_id),
      state=CASE WHEN phase_progress.state='CONCLUIDA' THEN 'CONCLUIDA' ELSE 'LIBERADA' END,
      updated_at=now()
  `;

  await sql`
    INSERT INTO audit_log(user_id,action,metadata)
    VALUES(${userId},'PAYMENT_ACCESS_GRANTED',${JSON.stringify({ phase: phaseNumber, paymentId: String(paymentId) })}::jsonb)
  `;
}

module.exports = { grantPaidPhase };
