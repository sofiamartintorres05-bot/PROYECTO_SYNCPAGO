// src/services/api.ts
// Capa de comunicación con el backend FastAPI (http://localhost:8000/api/v1)
// Todos los endpoints son reales y coinciden exactamente con el backend.

const BASE = 'http://localhost:8000/api/v1'

// ── Tipos de respuesta del backend (response_success / response_error) ──
export interface ApiResp<T> {
  status: boolean
  mensaje: string
  data: T
  error: string | null
  code: number
}

// ── Helper central ──
async function api<T>(url: string, options?: RequestInit): Promise<ApiResp<T>> {
  const res  = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  return res.json()
}

// ── Tipos de datos que devuelve el backend ──
export interface UsuarioData {
  id_usuario: number
  nombre: string
  correo: string
  telefono: string | null
  fecha_registro: string
}

export interface GastoData {
  id_gasto: number
  categoria: string
  precio: number
  estado: 'pendiente' | 'pagado' | 'vencido' | 'cancelado'
  fecha_vencimiento: string
}

export interface FinanzaData {
  mes: string
  entrada_dinero: number
  presupuesto_gastos: number
  total_gastado: number
  presupuesto_disponible: number
}

export interface RecordatorioData {
  usuario: string
  gasto: string
  fecha_vencimiento: string
  minutos_antes: number
  fecha_notificacion: string
}

export interface TrazabilidadData {
  estado_registrado: string
  fecha_cambio: string
}

// ══════════════════════════════════════════════════
// USUARIOS
// Prefix: /api/v1/usuarios
// ══════════════════════════════════════════════════
export const usuariosService = {

  // POST /api/v1/usuarios/login?correo=&contrasena=
  // Autentica con contraseña cifrada PBKDF2 en el backend
  login: (correo: string, contrasena: string) => {
    const p = new URLSearchParams({ correo, contrasena })
    return api<UsuarioData>(`/usuarios/login?${p}`, { method: 'POST' })
  },

  // POST /api/v1/usuarios/registro?nombre=&correo=&contrasena=&telefono=
  registro: (nombre: string, correo: string, contrasena: string, telefono?: string) => {
    const p = new URLSearchParams({ nombre, correo, contrasena })
    if (telefono) p.append('telefono', telefono)
    return api<UsuarioData>(`/usuarios/registro?${p}`, { method: 'POST' })
  },

  // GET /api/v1/usuarios/
  listar: () => api<UsuarioData[]>('/usuarios/'),

  // GET /api/v1/usuarios/{id_usuario}
  obtener: (id: number) => api<UsuarioData>(`/usuarios/${id}`),
}

// ══════════════════════════════════════════════════
// GASTOS
// Prefix: /api/v1/gastos
// ══════════════════════════════════════════════════
export const gastosService = {

  // GET /api/v1/gastos/usuario/{id_usuario}
  // Retorna { usuario: {...}, gastos: [...] }
  listarPorUsuario: (id: number) =>
    api<{ usuario: UsuarioData; gastos: GastoData[] }>(`/gastos/usuario/${id}`),

  // POST /api/v1/gastos/?id_tipo=&fecha_vencimiento=&precio=&estado=
  // fecha_vencimiento formato: 'YYYY-MM-DD HH:MM:SS'
  crear: (id_tipo: number, fecha_vencimiento: string, precio: number, estado = 'pendiente') => {
    const p = new URLSearchParams({
      id_tipo: String(id_tipo),
      fecha_vencimiento,
      precio:  String(precio),
      estado,
    })
    return api<GastoData>(`/gastos/?${p}`, { method: 'POST' })
  },

  // PATCH /api/v1/gastos/{id_gasto}/estado?estado=
  // Usar 'cancelado' para CANCELAR, 'pagado' para marcar pagado
  actualizarEstado: (id_gasto: number, estado: string) => {
    const p = new URLSearchParams({ estado })
    return api<{ id_gasto: number; estado: string }>(
      `/gastos/${id_gasto}/estado?${p}`,
      { method: 'PATCH' }
    )
  },

  // DELETE /api/v1/gastos/{id_gasto} — borrado FÍSICO PERMANENTE
  eliminar: (id_gasto: number) =>
    api<{ id_gasto_eliminado: number }>(`/gastos/${id_gasto}`, { method: 'DELETE' }),
}

// ══════════════════════════════════════════════════
// FINANZAS
// Prefix: /api/v1/finanzas
// ══════════════════════════════════════════════════
export const finanzasService = {

  // GET /api/v1/finanzas/usuario/{id_usuario}/presupuesto
  obtenerPresupuesto: (id: number) =>
    api<FinanzaData[]>(`/finanzas/usuario/${id}/presupuesto`),
}

// ══════════════════════════════════════════════════
// RECORDATORIOS
// Prefix: /api/v1/recordatorios
// ══════════════════════════════════════════════════
export const recordatoriosService = {

  // GET /api/v1/recordatorios/alertas
  listarAlertas: () => api<RecordatorioData[]>('/recordatorios/alertas'),
}

// ══════════════════════════════════════════════════
// TRAZABILIDAD
// Prefix: /api/v1/trazabilidad
// ══════════════════════════════════════════════════
export const trazabilidadService = {

  // GET /api/v1/trazabilidad/gasto/{id_gasto}
  historialGasto: (id_gasto: number) =>
    api<TrazabilidadData[]>(`/trazabilidad/gasto/${id_gasto}`),
}