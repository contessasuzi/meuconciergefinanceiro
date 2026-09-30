const bcrypt = require('bcryptjs');
const { db } = require('../../lib/db');
const { jsonBody, method, noStore } = require('../../lib/http');

module.exports = async function handler(req, res) {
  noStore(res);
  if (!method(req, res, ['POST'])) return;

  try {
    const body = jsonBody(req);
    if (!process.env.ADMIN_BOOTSTRAP_TOKEN || body.bootstrapToken !== process.env.ADMIN_BOOTSTRAP_TOKEN) {
      return res.status(403).json({ error:'FORBIDDEN' });
    }

    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const fullName = String(body.fullName || 'Gestão').trim();
    if (!email || password.length < 12) return res.status(400).json({ error:'INVALID_ADMIN_DATA' });

    const sql = db();
    const existingGestao = await sql`SELECT id,email FROM users WHERE role='GESTAO' LIMIT 1`;
    if (existingGestao.length) {
      return res.status(409).json({ error:'GESTAO_ALREADY_BOOTSTRAPPED' });
    }

    const hash = await bcrypt.hash(password, 12);
    const rows = await sql`
      INSERT INTO users(email,password_hash,full_name,role,status)
      VALUES(${email},${hash},${fullName},'GESTAO','ACTIVE')
      RETURNING id,email,full_name,role
    `;

    await sql`
      INSERT INTO audit_log(user_id,action,metadata)
      VALUES(${rows[0].id},'GESTAO_BOOTSTRAPPED','{}'::jsonb)
    `;

    return res.status(201).json({ ok:true, user:rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error:'ADMIN_BOOTSTRAP_FAILED' });
  }
};
