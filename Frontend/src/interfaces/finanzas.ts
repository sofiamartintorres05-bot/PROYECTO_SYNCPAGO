// Fila devuelta por GET /finanzas/usuario/{id}/presupuesto
export interface PresupuestoMes {
  mes: string; // fecha del registro de finanzas (representa el mes)
  entrada_dinero: number;
  presupuesto_gastos: number;
  total_gastado: number;
  presupuesto_disponible: number;
}

// Fila devuelta por POST /finanzas/
export interface FinanzasRegistro {
  id_finanza: number;
  id_usuario: number;
  fecha: string;
  entrada_dinero: number;
  presupuesto_gastos: number;
}