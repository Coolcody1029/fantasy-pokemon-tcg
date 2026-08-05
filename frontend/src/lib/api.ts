const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:5255";

export function getAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("token");
}

export function setAuthToken(token: string) {
  localStorage.setItem("token", token);
}

export function clearAuthToken() {
  localStorage.removeItem("token");
}

export async function getCurrentUser() {
  const response = await apiFetch(
    "/api/auth/me"
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export async function apiFetch(
  path: string,
  options: RequestInit = {}
) {
  const token =
    getAuthToken();

  const headers =
    new Headers(
      options.headers
    );

  if (
    !headers.has(
      "Content-Type"
    ) &&
    options.body
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  const normalizedPath =
    path.startsWith("/")
      ? path
      : `/${path}`;

  return fetch(
    `${API_BASE_URL}${normalizedPath}`,
    {
      ...options,
      headers,
    }
  );
}