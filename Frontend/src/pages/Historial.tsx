import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { gastosService } from "../services/gastosService";
import type { Gasto, EstadoGasto } from "../interfaces/gasto";
import { formatMoney } from "../utils/format";
import EstadoBadge from "../components/EstadoBadge";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 10;

export default function Historial() {
  const { usuario } = useAuth();
  const { mostrarToast } = useToast();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<"todos" | EstadoGasto>("todos");
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    if (!usuario) return;
    (async () => {
      setCargando(true);
      try {
        const data = await gastosService.listarPorUsuario(usuario.id_usuario);
        setGastos(data.gastos);
      } catch (err) {
        mostrarToast(err instanceof Error ? err.message : "Error al cargar el historial");
      } finally {
        setCargando(false);
      }
    })();
  }, [usuario]);

  // El historial muestra TODOS los estados (incluidos los cancelados,
  // que ya no aparecen en la página de Gastos activos).
  const filtrados = gastos.filter((g) => filtro === "todos" || g.estado === filtro);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const paginados = filtrados
    .slice()
    .sort(
      (a, b) =>
        new Date(b.fecha_vencimiento).getTime() - new Date(a.fecha_vencimiento).getTime()
    )
    .slice((paginaSegura - 1) * PAGE_SIZE, paginaSegura * PAGE_SIZE);

  return (
    <>
      <header className="page-header">
        <h1>Historial</h1>
        <p>Consulta todos tus gastos, incluidos los pagados y cancelados.</p>
      </header>

      <div className="tabs">
        {(["todos", "pendiente", "pagado", "cancelado"] as const).map((valor) => (
          <span
            key={valor}
            className={`tab${filtro === valor ? " active" : ""}`}
            onClick={() => {
              setFiltro(valor);
              setPagina(1);
            }}
          >
            {valor === "todos" ? "Todos" : valor[0].toUpperCase() + valor.slice(1)}
          </span>
        ))}
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Categoría</th>
            <th>Vencimiento</th>
            <th>Precio</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {cargando ? (
            <tr>
              <td colSpan={4}>Cargando...</td>
            </tr>
          ) : paginados.length === 0 ? (
            <tr>
              <td colSpan={4}>No hay registros para este filtro.</td>
            </tr>
          ) : (
            paginados.map((g) => (
              <tr
                key={g.id_gasto}
                style={g.estado === "cancelado" ? { opacity: 0.55 } : undefined}
              >
                <td>{g.categoria}</td>
                <td>
                  {new Date(g.fecha_vencimiento).toLocaleString("es-CO", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </td>
                <td>{formatMoney(g.precio)}</td>
                <td>
                  <EstadoBadge estado={g.estado} fechaVencimiento={g.fecha_vencimiento} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <Pagination
        page={paginaSegura}
        totalPages={totalPaginas}
        totalItems={filtrados.length}
        pageSize={PAGE_SIZE}
        onChange={setPagina}
      />
    </>
  );
}