import { api } from "./api";
import type { Recordatorio } from "../interfaces/recordatorio";

export const recordatoriosService = {
  obtenerPorGasto(idGasto: number) {
    return api.get<Recordatorio>(`/recordatorios/gasto/${idGasto}`);
  },

  actualizar(idGasto: number, tiempoAntelacion: number) {
    return api.patch<Recordatorio>(`/recordatorios/gasto/${idGasto}`, {
      tiempo_antelacion: tiempoAntelacion,
    });
  },
};