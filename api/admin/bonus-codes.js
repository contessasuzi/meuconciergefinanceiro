const crypto = require('crypto');
const { db } = require('../../lib/db');
const { jsonBody, method, noStore } = require('../../lib/http');
const { requireGestao } = require('../../lib/admin');
const { normalizeCnpj } = require('../../lib/company');

function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function newCode() {
  const raw = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `MCF-${raw.slice(0,4)}-${raw.slice(4,8)}-${raw.slice(8,12)}`;
}

module.exports = async function handler(req, res) {
  noStore(res);
  if (!method(req, res, ['GET','POST'])) return;

  const gestao = await requireGestao(req, res);
  if (!gestao) return;

  try {
    const sql = db();

    if (req.method === 'GET') {
      const rows = await sql`
        SELECT id,code_prefix,label,campaign,status,assigned_cnpj,
               grants_phase_1,grants_phase_2,grants_phase_3,
               expires_at,redeemed_by,redeemed_at,created_at
        FROM bonus_codes
        ORDER BY created_at DESC
        LIMIT 200
      `;
      return res.status(200).json({ codes: rows });
    }

    const body = jsonBody(req);
    const count = Math.min(Math.max(Number(body.count || 1), 1), 50);
    const campaign = String(body.campaign || 'cases-validacao').trim().slice(0,80);
    const labelBase = String(body.label || 'Case de validação').trim().slice(0,120);
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    const assignedCnpjs = Array.isArray(body.assignedCnpjs) ? body.assignedCnpjs : [];
    const phases = Array.isArray(body.phases) ? body.phases.map(Number) : [1,2,3];
    const grants = {
      1: phases.includes(1),
      2: phases.includes(2),
      3: phases.includes(3)
    };

    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      return res.status(400).json({ error:'INVALID_EXPIRATION' });
    }

    const issued = [];
    for (let i = 0; i < count; i++) {
      const code = newCode();
      const normalized = normalizeCnpj(assignedCnpjs[i] || null);
      const rows = await sql`
        INSERT INTO bonus_codes(
          code_hash,code_prefix,label,campaign,status,
          grants_phase_1,grants_phase_2,grants_phase_3,
          assigned_cnpj,expires_at
        ) VALUES(
          ${hashCode(code)},${code.slice(0,8)},${`${labelBase} ${i+1}`},${campaign},'ACTIVE',
          ${grants[1]},${grants[2]},${grants[3]},${normalized},${expiresAt ? expiresAt.toISOString() : null}
        )
        RETURNING id,status,created_at
      `;
      issued.push({ id: rows[0].id, code, assignedCnpj: normalized, status: rows[0].status });
    }

    await sql`
      INSERT INTO audit_log(user_id,action,metadata)
      VALUES(${gestao.id},'BONUS_CODES_CREATED',${JSON.stringify({ count, campaign, phases })}::jsonb)
    `;

    return res.status(201).json({ ok:true, issued, warning:'Os códigos completos são exibidos somente nesta resposta.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error:'BONUS_CODES_FAILED' });
  }
};
