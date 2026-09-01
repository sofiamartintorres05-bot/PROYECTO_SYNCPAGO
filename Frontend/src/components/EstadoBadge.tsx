import React from "react";
import type { EstadoGasto } from "../interfaces/gasto";

interface EstadoBadgeProps {
  estado: EstadoGasto;
  fechaVencimiento: string;
}

// El backend solo conoce 'pendiente' | 'pagado' | 'vencido' | 'cancelado'.
// No existe ningún proceso automático que pase un gasto de 'pendiente' a
// 'vencido' cuando se pasa la fecha (no hay trigger/cron para eso), así que
// ese estado "Vencido" se calcula aquí solo para mostrarlo — el valor real
// en la base de datos sigue siendo 'pendiente' hasta que el usuario actúe.
export default function EstadoBadge({ estado, fechaVencimiento }: EstadoBadgeProps) {
  let etiqueta = "Pendiente";
  let clase = "badge-yellow";

  if (estado === "cancelado") {
    etiqueta = "Cancelado";
    clase = "badge-gray";
  } else if (estado === "pagado") {
    etiqueta = "Pagado";
    clase = "badge-green";
  } else {
    const vencida = new Date(fechaVencimiento) < new Date();
    if (estado === "vencido" || vencida) {
      etiqueta = "Vencido";
      clase = "badge-red";
    } else {
      const hoy = new Date();
      const fecha = new Date(fechaVencimiento);
      const esHoy =
        hoy.getFullYear() === fecha.getFullYear() &&
        hoy.getMonth() === fecha.getMonth() &&
        hoy.getDate() === fecha.getDate();
      if (esHoy) {
        etiqueta = "Hoy";
        clase = "badge-today";
      }
    }
  }

  return <span className={`badge ${clase}`}>{etiqueta}</span>;
}