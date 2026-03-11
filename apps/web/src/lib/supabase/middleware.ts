import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminPath = request.nextUrl.pathname.startsWith("/admin");
  const isAdminLogin = request.nextUrl.pathname === "/admin/login";
  const isAdminApi = request.nextUrl.pathname.startsWith("/api/admin");

  if (isAdminApi && !user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (isAdminPath && !isAdminLogin && !user) {
    const redirect = new URL("/admin/login", request.url);
    redirect.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirect);
  }

  if (isAdminLogin && user) {
    const next = request.nextUrl.searchParams.get("next") || "/admin";
    return NextResponse.redirect(new URL(next, request.url));
  }

  return supabaseResponse;
}
