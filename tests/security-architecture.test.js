const assert = require('assert');
const fs = require('fs');

function read(p){return fs.readFileSync(p,'utf8')}

const schema=read('db/schema.sql');
const middleware=read('middleware.js');
const acesso=read('acesso/index.html');
const painel=read('painel/index.html');
const bonus=read('api/admin/bonus-codes.js');
const stateApi=read('api/state/current.js');

assert(schema.includes("source IN ('PAYMENT','BONUS_CASE','GESTAO')"));
assert(schema.includes('CREATE TABLE IF NOT EXISTS payments'));
assert(schema.includes('CREATE TABLE IF NOT EXISTS companies'));
assert(middleware.includes("current.role !== 'GESTAO'"));
assert(middleware.includes("url.pathname.startsWith('/concierge-beta')"));
assert(!acesso.includes('AUTH_JWT_SECRET'));
assert(!acesso.includes('DATABASE_URL'));
assert(!painel.includes('AUTH_JWT_SECRET'));
assert(bonus.includes("requireGestao"));
assert(bonus.includes('crypto.randomBytes'));
assert(schema.includes('CREATE TABLE IF NOT EXISTS concierge_state'));
assert(stateApi.includes("VERSION='v1.72'"));
assert(stateApi.includes('STATE_CONFLICT'));

console.log('security-architecture.test.js: OK');
