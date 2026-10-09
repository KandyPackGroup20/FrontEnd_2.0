// Small shared helper for talking to the Kandypack FastAPI backend.
// Same-origin proxy keeps the HttpOnly session available to middleware and API calls.
export const API_BASE_URL =
  "/api/v1";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const TOKEN_KEY = "kandypack_auth_token";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

/**
 * Wraps fetch() so every call:
 *  - sends the kandypack_session login cookie automatically (credentials: "include")
 *  - sends and receives JSON
 *  - throws a readable ApiError on non-2xx responses instead of returning bad data
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      typeof data?.detail === "string" ? data.detail : `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }

  return data as T;
}

/** Turns any error into a short message that is safe to show on screen. */
export function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) {
      return "Your session is missing or expired. Please sign in again.";
    }
    if (err.status === 403) {
      return err.message === "PASSWORD_RESET_REQUIRED" ? "Change your temporary password in your profile first." : "Your account is not allowed to perform this action.";
    }
    return err.message;
  }
  return "Could not reach the server. Is the backend running?";
}
