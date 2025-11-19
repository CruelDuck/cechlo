// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isAuthPage = req.nextUrl.pathname.startsWith('/login');

  // není přihlášený a jde na chráněnou stránku → pošli na /login
  if (!session && !isAuthPage) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // už přihlášený a jde na /login → pošli na /
  if (session && isAuthPage) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/';
    redirectUrl.searchParams.delete('redirectedFrom');
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

// Na které cesty se middleware aplikuje
export const config = {
  matcher: ['/', '/customers/:path*'], // sem přidáš i /units, /sales atd.
};
