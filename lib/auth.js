const { SignJWT, jwtVerify } = require('jose');

const COOKIE = 'mcf_session';
const encoder = new TextEncoder();

function secret() {
  if (!process.env.AUTH_JWT_SECRET || process.env.AUTH_JWT_SECRET.length < 32) {
    throw new Error('AUTH_JWT_SECRET_NOT_CONFIGURED');
  }
  return encoder.encode(process.env.AUTH_JWT_SECRET);
}

async function signSession(user) {
  return new SignJWT({ role: user.role, email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(secret());
}

function cookieHeader(token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200${secure}`;
}

function clearCookieHeader() {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

function parseCookies(req) {
  const raw = req.headers.cookie || '';
  return Object.fromEntries(
    raw.split(';').map(v => v.trim()).filter(Boolean).map(v => {
      const i = v.indexOf('=');
      return [v.slice(0, i), decodeURIComponent(v.slice(i + 1))];
    })
  );
}

async function sessionFromRequest(req) {
  const token = parseCookies(req)[COOKIE];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { id: Number(payload.sub), role: payload.role, email: payload.email };
  } catch {
    return null;
  }
}

async function requireSession(req, res) {
  const session = await sessionFromRequest(req);
  if (!session) {
    res.status(401).json({ error: 'UNAUTHENTICATED' });
    return null;
  }
  return session;
}

module.exports = {
  COOKIE,
  signSession,
  cookieHeader,
  clearCookieHeader,
  sessionFromRequest,
  requireSession
};
