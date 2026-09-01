import { api } from "./api";
import type { ClaseTipoGasto, TipoGasto } from "../interfaces/tipoGasto";

export const tipoGastoService = {
  listarPorUsuario(idUsuario: number) {
    return api.get<TipoGasto[]>(`/tipo-gasto/usuario/${idUsuario}`);
  },

  crear(idUsuario: number, detalle: string, clase?: ClaseTipoGasto) {
    return api.post<TipoGasto>("/tipo-gasto/", {
      id_usuario: idUsuario,
      detalle,
      clase,
    });
  },
};