import type { ApiResponse } from "../interfaces/api";

const API_URL = import.meta.env.VITE_API_URL as string;

type Params = Record<string, string | number | boolean | undefined | null>;

function buildQuery(params?: Params): string {
  if (!params) return "";
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.append(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

async function request<T>(
  path: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  params?: Params
): Promise<T> {
  const url = `${API_URL}${path}${buildQuery(params)}`;

  let response: Response;
  try {
    response = await fetch(url, { method });
  } catch {
    throw new Error("No se pudo conectar con el servidor. Verifica tu conexión.");
  }

  let json: ApiResponse<T> | null = null;
  try {
    json = await response.json();
  } catch {
    throw new Error("El servidor respondió con un formato inesperado.");
  }

  if (!json) {
    throw new Error("Respuesta vacía del servidor.");
  }

  if (!json.status) {
    throw new Error(json.mensaje || json.error || "Ocurrió un error en el servidor.");
  }

  return json.data;
}

export const api = {
  get: <T>(path: string, params?: Params) => request<T>(path, "GET", params),
  post: <T>(path: string, params?: Params) => request<T>(path, "POST", params),
  patch: <T>(path: string, params?: Params) => request<T>(path, "PATCH", params),
  del: <T>(path: string, params?: Params) => request<T>(path, "DELETE", params),
};