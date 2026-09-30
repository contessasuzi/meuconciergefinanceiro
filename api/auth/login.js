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
    const sql = db();

    const rows = await sql`
      SELECT id,email,password_hash,full_name,role,status
      FROM users
      WHERE email=${email}
      LIMIT 1
    `;

    const user = rows[0];
    if (!user || user.status !== 'ACTIVE' || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
    }

    await sql`
      INSERT INTO audit_log(user_id,action,metadata)
      VALUES(${user.id},'LOGIN','{}'::jsonb)
    `;

    const token = await signSession(user);
    res.setHeader('Set-Cookie', cookieHeader(token));

    return res.status(200).json({
      ok:true,
      user:{
        id:user.id,
        email:user.email,
        full_name:user.full_name,
        role:user.role
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'LOGIN_FAILED' });
  }
};
