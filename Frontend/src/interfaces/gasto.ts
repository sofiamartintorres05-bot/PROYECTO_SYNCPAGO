import type { ClaseTipoGasto } from "./tipoGasto";

export type EstadoGasto = "pendiente" | "pagado" | "vencido" | "cancelado";

// Tal como lo devuelve GET /gastos/usuario/{id}
export interface Gasto {
  id_gasto: number;
  categoria: string; // tipo_gasto.detalle (ya viene unido desde el backend)
  precio: number;
  estado: EstadoGasto;
  fecha_vencimiento: string; // timestamp ISO
}

// Tal como lo devuelve GET /gastos/detalles
export interface GastoDetalle extends Gasto {
  usuario: string;
  clase: ClaseTipoGasto | null;
}

export interface GastoCreatePayload {
  id_tipo: number;
  fecha_vencimiento: string; // 'YYYY-MM-DD HH:MM:SS'
  precio: number;
  estado?: EstadoGasto;
}

export interface GastoUpdatePayload {
  id_tipo?: number;
  fecha_vencimiento?: string; // 'YYYY-MM-DD HH:MM:SS'
  precio?: number;
}