import { next, redirect } from '@vercel/functions';
import { jwtVerify } from 'jose';

const encoder = new TextEncoder();

function getCookie(request, name) {
  const raw = request.headers.get('cookie') || '';
  for (const part of raw.split(';')) {
    const value = part.trim();
    if (value.startsWith(name + '=')) return decodeURIComponent(value.slice(name.length + 1));
  }
  return null;
}

async function session(request) {
  const token = getCookie(request, 'mcf_session');
  const secret = process.env.AUTH_JWT_SECRET;
  if (!token || !secret || secret.length < 32) return null;
  try {
    const { payload } = await jwtVerify(token, encoder.encode(secret));
    return { id: payload.sub, role: payload.role, email: payload.email };
  } catch {
    return null;
  }
}

export default async function middleware(request) {
  const current = await session(request);
  const url = new URL(request.url);

  if (!current) {
    const target = new URL('/acesso/', request.url);
    target.searchParams.set('returnTo', url.pathname + url.search);
    return redirect(target);
  }

  // O monólito atual permanece restrito à Gestão enquanto a inteligência
  // é migrada para a camada protegida de servidor.
  if (url.pathname.startsWith('/concierge-beta') && current.role !== 'GESTAO') {
    return redirect(new URL('/painel/', request.url));
  }

  if (url.pathname.startsWith('/gestao') && current.role !== 'GESTAO') {
    return redirect(new URL('/painel/', request.url));
  }

  return next({ headers: { 'Cache-Control': 'no-store' } });
}

export const config = {
  matcher: [
    '/painel/:path*',
    '/gestao/:path*',
    '/concierge-beta/:path*'
  ]
};
