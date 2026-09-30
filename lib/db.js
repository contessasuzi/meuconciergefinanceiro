const { neon } = require('@neondatabase/serverless');

let sqlClient;

function db() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL_NOT_CONFIGURED');
  }
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

module.exports = { db };
