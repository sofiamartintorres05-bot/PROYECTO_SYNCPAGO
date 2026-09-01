export type ClaseTipoGasto = "vital" | "entretenimiento" | "varios";

export interface TipoGasto {
  id_tipo: number;
  id_usuario: number;
  clase: ClaseTipoGasto | null;
  detalle: string;
}