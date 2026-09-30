const bcrypt = require('bcryptjs');
const { db } = require('../../lib/db');
const { jsonBody, method, noStore } = require('../../lib/http');
const { signSession, cookieHeader } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  noStore(res);
  if (!method(req, res, ['POST'])) return;

  try {
    const body = jsonBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const fullName = String(body.fullName || '').trim();

    if (!email || !email.includes('@') || password.length < 10) {
      return res.status(400).json({ error: 'INVALID_REGISTRATION_DATA' });
    }

    const sql = db();
    const exists = await sql`SELECT id FROM users WHERE email=${email} LIMIT 1`;
    if (exists.length) {
      return res.status(409).json({ error: 'EMAIL_ALREADY_REGISTERED' });
    }

    const hash = await bcrypt.hash(password, 12);
    const rows = await sql`
      INSERT INTO users(email,password_hash,full_name,role)
      VALUES (${email},${hash},${fullName || null},'CLIENTE')
      RETURNING id,email,full_name,role
    `;

    const user = rows[0];
    await sql`
      INSERT INTO audit_log(user_id,action,metadata)
      VALUES(${user.id},'USER_REGISTERED','{}'::jsonb)
    `;

    const token = await signSession(user);
    res.setHeader('Set-Cookie', cookieHeader(token));
    return res.status(201).json({ ok:true, user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'REGISTER_FAILED' });
  }
};
