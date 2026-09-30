const { method, noStore } = require('../../lib/http');
const { clearCookieHeader } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  noStore(res);
  if (!method(req, res, ['POST'])) return;
  res.setHeader('Set-Cookie', clearCookieHeader());
  return res.status(200).json({ ok:true });
};
