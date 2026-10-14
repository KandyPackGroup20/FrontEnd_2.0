import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("kandypack_session");

  // Also call backend to expire server-side session cookie
  const rawBackend =
    process.env.BACKEND_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://backend-bzhp.onrender.com"
      : "http://127.0.0.1:8000");
  const backend = rawBackend.replace(/\/+$/, "");

  try {
    await fetch(`${backend}/api/v1/auth/logout`, {
      method: "POST",
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Quiet fallback
  }

  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  // Explicitly clear across root path with both secure and non-secure headers
  response.cookies.delete("kandypack_session");
  response.cookies.set("kandypack_session", "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

export async function GET() {
  return POST();
}
