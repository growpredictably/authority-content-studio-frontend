import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ONBOARDING_COOKIE = "has_brands";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users to login (except for auth routes)
  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/callback")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from login
  if (user && request.nextUrl.pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users with no brands to onboarding
  // (skip if already on /onboarding or auth routes)
  if (
    user &&
    !request.nextUrl.pathname.startsWith("/onboarding") &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/callback")
  ) {
    const hasBrandsCookie = request.cookies.get(ONBOARDING_COOKIE)?.value;

    if (hasBrandsCookie !== "1") {
      // Check if user has any brands
      const { count } = await supabase
        .from("user_brands")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (count === 0) {
        const url = request.nextUrl.clone();
        url.pathname = "/onboarding";
        return NextResponse.redirect(url);
      }

      // Cache the result so we don't query on every request
      supabaseResponse.cookies.set(ONBOARDING_COOKIE, "1", {
        maxAge: 60 * 60, // 1 hour
        path: "/",
        httpOnly: true,
        sameSite: "lax",
      });
    }
  }

  return supabaseResponse;
}
