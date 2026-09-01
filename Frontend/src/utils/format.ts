export function formatMoney(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function minutosAHoras(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (resto === 0) return `${horas} h`;
  return `${horas} h ${resto} min`;
}

// Convierte un valor de <input type="datetime-local"> ('YYYY-MM-DDTHH:mm')
// al formato que espera el backend ('YYYY-MM-DD HH:MM:SS')
export function toBackendDateTime(value: string): string {
  const [fecha, hora] = value.split("T");
  const horaCompleta = hora && hora.length === 5 ? `${hora}:00` : hora || "00:00:00";
  return `${fecha} ${horaCompleta}`;
}

// Convierte un timestamp ISO del backend a formato de <input type="datetime-local">
export function toDatetimeLocalValue(isoString: string): string {
  return isoString.slice(0, 16);
}

const PALETA_COLORES = [
  "#3563e9", "#22c55e", "#ef4444", "#8b5cf6",
  "#f59e0b", "#06b6d4", "#eab308", "#ec4899",
];

// Genera un color determinístico para una categoría (no viene del backend)
export function colorParaCategoria(nombre: string): string {
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) {
    hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETA_COLORES.length;
  return PALETA_COLORES[index];
}

export const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];