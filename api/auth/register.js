const bcrypt = require('bcryptjs');
const { db } = require('../../lib/db');
const { jsonBody, method, noStore } = require('../../lib/http');
const { signSession, cookieHeader } = require('../../lib/auth');
const { normalizeCnpj } = require('../../lib/company');

module.exports = async function handler(req, res) {
  noStore(res);
  if (!method(req, res, ['POST'])) return;

  try {
    const body = jsonBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const fullName = String(body.fullName || '').trim();
    const companyName = String(body.companyName || '').trim();
    const rawCnpj = String(body.cnpj || '').trim();
    const cnpj = rawCnpj ? normalizeCnpj(rawCnpj) : null;

    if (!email || !email.includes('@') || password.length < 10) {
      return res.status(400).json({ error: 'INVALID_REGISTRATION_DATA' });
    }
    if (rawCnpj && !cnpj) {
      return res.status(400).json({ error: 'INVALID_CNPJ' });
    }

    const sql = db();
    const exists = await sql`SELECT id FROM users WHERE email=${email} LIMIT 1`;
    if (exists.length) return res.status(409).json({ error: 'EMAIL_ALREADY_REGISTERED' });

    if (cnpj) {
      const cnpjExists = await sql`SELECT id FROM companies WHERE cnpj=${cnpj} LIMIT 1`;
      if (cnpjExists.length) return res.status(409).json({ error:'CNPJ_ALREADY_REGISTERED' });
    }

    const hash = await bcrypt.hash(password, 12);
    const rows = await sql`
      INSERT INTO users(email,password_hash,full_name,role)
      VALUES (${email},${hash},${fullName || null},'CLIENTE')
      RETURNING id,email,full_name,role
    `;
    const user = rows[0];

    let company = null;
    if (cnpj || companyName) {
      const companies = await sql`
        INSERT INTO companies(legal_name,trade_name,cnpj)
        VALUES(${companyName || null},${companyName || null},${cnpj})
        RETURNING id,legal_name,trade_name,cnpj
      `;
      company = companies[0];
      await sql`
        INSERT INTO user_companies(user_id,company_id,relationship)
        VALUES(${user.id},${company.id},'OWNER')
      `;
    }

    await sql`
      INSERT INTO audit_log(user_id,action,metadata)
      VALUES(${user.id},'USER_REGISTERED',${JSON.stringify({ companyId: company ? company.id : null })}::jsonb)
    `;

    const token = await signSession(user);
    res.setHeader('Set-Cookie', cookieHeader(token));
    return res.status(201).json({ ok:true, user, company });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'REGISTER_FAILED' });
  }
};
