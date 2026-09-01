import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { gastosService } from "../services/gastosService";
import type { Gasto } from "../interfaces/gasto";
import { formatMoney } from "../utils/format";

export default function Dashboard() {
  const { usuario } = useAuth();
  const { mostrarToast } = useToast();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!usuario) return;
    cargar();
  }, [usuario]);

  async function cargar() {
    if (!usuario) return;
    setCargando(true);
    try {
      const data = await gastosService.listarPorUsuario(usuario.id_usuario);
      setGastos(data.gastos);
    } catch (err) {
      mostrarToast(err instanceof Error ? err.message : "Error al cargar el dashboard");
    } finally {
      setCargando(false);
    }
  }

  const hoy = new Date();
  const gastosDelMes = gastos.filter((g) => {
    if (g.estado === "cancelado") return false;
    const f = new Date(g.fecha_vencimiento);
    return f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear();
  });

  const totalMes = gastosDelMes.reduce((acc, g) => acc + g.precio, 0);
  const pagados = gastosDelMes.filter((g) => g.estado === "pagado");
  const vencidos = gastosDelMes.filter(
    (g) => g.estado === "pendiente" && new Date(g.fecha_vencimiento) < hoy
  );
  const pendientes = gastosDelMes.length - pagados.length - vencidos.length;

  const proximosAVencer = gastos.filter((g) => {
    if (g.estado !== "pendiente") return false;
    const f = new Date(g.fecha_vencimiento);
    const diffDias = (f.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);
    return diffDias >= 0 && diffDias <= 3;
  });

  return (
    <>
      <div className="welcome-banner">
        <h1>Hola, {usuario?.nombre?.split(" ")[0]} 👋</h1>
        <p>
          Este es tu resumen financiero. Mantén tus gastos al día y evita
          sorpresas al final del mes.
        </p>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total del mes</div>
          <div className="kpi-value">{cargando ? "…" : formatMoney(totalMes)}</div>
          <div className="kpi-sub">{gastosDelMes.length} gastos registrados</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-label">Pagados</div>
          <div className="kpi-value">{cargando ? "…" : pagados.length}</div>
          <div className="kpi-sub">{formatMoney(pagados.reduce((a, g) => a + g.precio, 0))}</div>
        </div>
        <div className="kpi-card yellow">
          <div className="kpi-label">Pendientes</div>
          <div className="kpi-value">{cargando ? "…" : Math.max(0, pendientes)}</div>
          <div className="kpi-sub">Por pagar este mes</div>
        </div>
        <div className="kpi-card red">
          <div className="kpi-label">Vencidos</div>
          <div className="kpi-value">{cargando ? "…" : vencidos.length}</div>
          <div className="kpi-sub">
            {formatMoney(vencidos.reduce((a, g) => a + g.precio, 0))}
          </div>
        </div>
      </div>

      <section className="chart-section" aria-label="Próximos a vencer">
        <h2>🔔 Próximos a vencer (3 días)</h2>
        {proximosAVencer.length === 0 ? (
          <p style={{ color: "var(--gray-400)", fontSize: "0.85rem" }}>
            No tienes gastos próximos a vencer.
          </p>
        ) : (
          proximosAVencer.map((g) => (
            <div className="total-row" key={g.id_gasto}>
              <span className="label">
                {g.categoria} —{" "}
                {new Date(g.fecha_vencimiento).toLocaleString("es-CO", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
              <span className="value">{formatMoney(g.precio)}</span>
            </div>
          ))
        )}
      </section>

      <div className="features-grid">
        <div className="feature-card">
          <span className="feature-icon">📋</span>
          <div>
            <h2>Gestiona tus gastos</h2>
            <p>Crea, edita, marca como pagados o cancela tus gastos fácilmente.</p>
          </div>
        </div>
        <div className="feature-card">
          <span className="feature-icon">🔔</span>
          <div>
            <h2>Recordatorios</h2>
            <p>Configura con cuántos minutos de antelación quieres que te avisemos.</p>
          </div>
        </div>
        <div className="feature-card">
          <span className="feature-icon">📊</span>
          <div>
            <h2>Estadísticas</h2>
            <p>Analiza tus gastos por categoría y controla tu presupuesto mensual.</p>
          </div>
        </div>
        <div className="feature-card">
          <span className="feature-icon">🕓</span>
          <div>
            <h2>Historial</h2>
            <p>Consulta todos tus gastos, incluidos los pagados y cancelados.</p>
          </div>
        </div>
      </div>
    </>
  );
}