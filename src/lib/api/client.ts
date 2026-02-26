const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: string
  ) {
    super(`API Error ${status}: ${body}`);
    this.name = "ApiError";
  }
}

/** POST request to the Modal backend with Bearer token auth */
export async function apiCall<T>(
  endpoint: string,
  payload: Record<string, unknown>,
  token: string
): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new ApiError(res.status, await res.text());
  }

  const data = await res.json();
  // Backend wraps orchestrator responses in an array
  return Array.isArray(data) ? data[0] : data;
}

/** GET request to the Modal backend with Bearer token auth */
export async function apiGet<T>(
  endpoint: string,
  token: string
): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${endpoint}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new ApiError(res.status, await res.text());
  }

  return res.json();
}

/** Convenience wrapper for the unified orchestrator endpoint */
export function orchestrate<T>(
  action: string,
  payload: Record<string, unknown>,
  token: string
): Promise<T> {
  return apiCall<T>("/v1/orchestrator", { action, payload }, token);
}

/** POST with multipart/form-data (for file uploads) */
export async function apiUpload<T>(
  endpoint: string,
  formData: FormData,
  token: string
): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    throw new ApiError(res.status, await res.text());
  }

  return res.json();
}

/** PUT request to the Modal backend with Bearer token auth */
export async function apiPut<T>(
  endpoint: string,
  payload: Record<string, unknown>,
  token: string
): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${endpoint}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new ApiError(res.status, await res.text());
  }

  return res.json();
}

/** Unauthenticated GET (for health check) */
export async function apiGetPublic<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${endpoint}`, {
    method: "GET",
  });

  if (!res.ok) {
    throw new ApiError(res.status, await res.text());
  }

  return res.json();
}
