// Forma estándar de respuesta del backend (utils/response.py)
export interface ApiResponse<T> {
  status: boolean;
  mensaje: string;
  data: T;
  error: string | null;
  code: number;
}