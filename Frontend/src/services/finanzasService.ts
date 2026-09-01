import { api } from "./api";
import type { FinanzasRegistro, PresupuestoMes } from "../interfaces/finanzas";

export const finanzasService = {
  obtenerPresupuesto(idUsuario: number) {
    return api.get<PresupuestoMes[]>(`/finanzas/usuario/${idUsuario}/presupuesto`);
  },

  guardar(
    idUsuario: number,
    entradaDinero: number,
    presupuestoGastos: number,
    fecha?: string // 'YYYY-MM-DD'
  ) {
    return api.post<FinanzasRegistro>("/finanzas/", {
      id_usuario: idUsuario,
      entrada_dinero: entradaDinero,
      presupuesto_gastos: presupuestoGastos,
      fecha,
    });
  },
};