import { next, redirect } from '@vercel/functions';
import { jwtVerify } from 'jose';

const encoder = new TextEncoder();

function getCookie(request, name) {
  const raw = request.headers.get('cookie') || '';
  for (const part of raw.split(';')) {
    const value = part.trim();
    if (value.startsWith(name + '=')) {
      return decodeURIComponent(value.slice(name.length + 1));
    }
  }
  return null;
}

async function validSession(request) {
  const token = getCookie(request, 'mcf_session');
  const secret = process.env.AUTH_JWT_SECRET;
  if (!token || !secret || secret.length < 32) return false;

  try {
    await jwtVerify(token, encoder.encode(secret));
    return true;
  } catch {
    return false;
  }
}

export default async function middleware(request) {
  if (!(await validSession(request))) {
    const target = new URL('/acesso/', request.url);
    target.searchParams.set('returnTo', new URL(request.url).pathname);
    return redirect(target);
  }

  return next({
    headers: {
      'Cache-Control': 'no-store'
    }
  });
}

export const config = {
  matcher: [
    '/painel/:path*',
    '/concierge-beta/:path*'
  ]
};
