const crypto = require('crypto');
const { neon } = require('@neondatabase/serverless');

const count = Math.max(1, Number(process.argv[2] || 10));
const campaign = process.argv[3] || 'CASES-VALIDACAO';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL_NOT_CONFIGURED');
}

const sql = neon(process.env.DATABASE_URL);

function makeCode() {
  return 'MCF-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

function hash(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

(async () => {
  const codes = [];

  for (let i = 0; i < count; i++) {
    const code = makeCode();

    await sql`
      INSERT INTO bonus_codes(
        code_hash,
        label,
        campaign,
        status,
        grants_phase_1,
        grants_phase_2,
        grants_phase_3
      )
      VALUES(
        ${hash(code)},
        ${'Case ' + String(i + 1).padStart(2, '0')},
        ${campaign},
        'ACTIVE',
        true,
        true,
        true
      )
    `;

    codes.push(code);
  }

  console.log('\nCÓDIGOS GERADOS — guarde-os em local seguro.\n');
  codes.forEach((code, index) => {
    console.log(String(index + 1).padStart(2, '0') + '  ' + code);
  });
})();
