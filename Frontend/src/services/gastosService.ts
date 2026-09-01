import { api } from "./api";
import type {
  Gasto,
  GastoCreatePayload,
  GastoUpdatePayload,
  EstadoGasto,
} from "../interfaces/gasto";
import type { Usuario } from "../interfaces/usuario";

export const gastosService = {
  listarPorUsuario(idUsuario: number) {
    return api.get<{ usuario: Usuario; gastos: Gasto[] }>(
      `/gastos/usuario/${idUsuario}`
    );
  },

  crear(payload: GastoCreatePayload) {
    return api.post<Gasto>("/gastos/", { ...payload });
  },

  editar(idGasto: number, payload: GastoUpdatePayload) {
    return api.patch<Gasto>(`/gastos/${idGasto}`, { ...payload });
  },

  cambiarEstado(idGasto: number, estado: EstadoGasto) {
    return api.patch<{ id_gasto: number; estado: EstadoGasto }>(
      `/gastos/${idGasto}/estado`,
      { estado }
    );
  },

  eliminar(idGasto: number) {
    return api.del<{ id_gasto_eliminado: number }>(`/gastos/${idGasto}`);
  },
};