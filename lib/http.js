function jsonBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
}
function method(req, res, allowed) {
  if (!allowed.includes(req.method)) {
    res.setHeader('Allow', allowed.join(', '));
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return false;
  }
  return true;
}
function noStore(res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
}
module.exports = { jsonBody, method, noStore };
