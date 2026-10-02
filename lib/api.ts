// Small shared helper for talking to the Kandypack FastAPI backend.
// The backend URL can be changed later with NEXT_PUBLIC_API_URL in a .env.local file.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
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
      return "You are not signed in. Please sign in as a Store Manager or Warehouse Staff user.";
    }
    if (err.status === 403) {
      return "Your account is not allowed to do this. Only Store Manager and Warehouse Staff roles can.";
    }
    return err.message;
  }
  return "Could not reach the server. Is the backend running?";
}