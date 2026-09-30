const { db } = require('./db');

function normalizeCnpj(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length === 14 ? digits : null;
}

async function primaryCompanyForUser(userId) {
  const sql = db();
  const rows = await sql`
    SELECT c.id,c.legal_name,c.trade_name,c.cnpj
    FROM user_companies uc
    JOIN companies c ON c.id=uc.company_id
    WHERE uc.user_id=${userId}
    ORDER BY uc.created_at ASC
    LIMIT 1
  `;
  return rows[0] || null;
}

module.exports = { normalizeCnpj, primaryCompanyForUser };
