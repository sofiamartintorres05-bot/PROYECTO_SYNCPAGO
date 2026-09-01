import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { gastosService } from "../services/gastosService";
import { finanzasService } from "../services/finanzasService";
import type { Gasto } from "../interfaces/gasto";
import type { PresupuestoMes } from "../interfaces/finanzas";
import { formatMoney, colorParaCategoria, MESES } from "../utils/format";

export default function Estadisticas() {
  const { usuario } = useAuth();
  const { mostrarToast } = useToast();

  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [presupuestos, setPresupuestos] = useState<PresupuestoMes[]>([]);
  const [cargando, setCargando] = useState(true);

  const [entradaDinero, setEntradaDinero] = useState("");
  const [presupuestoGastos, setPresupuestoGastos] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [fechaActual, setFechaActual] = useState(new Date());

  useEffect(() => {
    if (!usuario) return;
    cargarTodo();
  }, [usuario]);

  async function cargarTodo() {
    if (!usuario) return;
    setCargando(true);
    try {
      const [datosGastos, datosPresupuesto] = await Promise.all([
        gastosService.listarPorUsuario(usuario.id_usuario),
        finanzasService.obtenerPresupuesto(usuario.id_usuario),
      ]);
      setGastos(datosGastos.gastos);
      setPresupuestos(datosPresupuesto);
    } catch (err) {
      mostrarToast(err instanceof Error ? err.message : "Error al cargar estadísticas");
    } finally {
      setCargando(false);
    }
  }

  async function guardarPresupuesto(e: React.FormEvent) {
    e.preventDefault();
    if (!usuario) return;

    const entrada = Number(entradaDinero);
    const presupuesto = Number(presupuestoGastos);

    if (!entrada || entrada <= 0 || !presupuesto || presupuesto <= 0) {
      mostrarToast("Ingresa valores válidos mayores a 0");
      return;
    }

    setGuardando(true);
    try {
      await finanzasService.guardar(usuario.id_usuario, entrada, presupuesto);
      mostrarToast("Presupuesto guardado ✓");
      cargarTodo();
    } catch (err) {
      mostrarToast(err instanceof Error ? err.message : "Error al guardar el presupuesto");
    } finally {
      setGuardando(false);
    }
  }

  // presupuestos viene ordenado DESC por fecha desde el backend
  const mesActualPresupuesto = presupuestos[0];
  const mesAnteriorPresupuesto = presupuestos[1];

  function cambiarMes(direccion: number) {
    const nueva = new Date(fechaActual);
    nueva.setMonth(nueva.getMonth() + direccion);
    setFechaActual(nueva);
  }

  const mes = fechaActual.getMonth();
  const anio = fechaActual.getFullYear();

  const gastosDelMes = gastos.filter((g) => {
    const f = new Date(g.fecha_vencimiento);
    return f.getMonth() === mes && f.getFullYear() === anio && g.estado !== "cancelado";
  });

  const totalMes = gastosDelMes.reduce((a, g) => a + g.precio, 0);
  const pagadoMes = gastosDelMes
    .filter((g) => g.estado === "pagado")
    .reduce((a, g) => a + g.precio, 0);
  const vencidoMes = gastosDelMes
    .filter((g) => g.estado === "pendiente" && new Date(g.fecha_vencimiento) < new Date())
    .reduce((a, g) => a + g.precio, 0);
  const pendienteMes = Math.max(0, totalMes - pagadoMes - vencidoMes);

  const categorias: Record<string, number> = {};
  gastosDelMes.forEach((g) => {
    categorias[g.categoria] = (categorias[g.categoria] || 0) + g.precio;
  });
  const categoriasOrdenadas = Object.entries(categorias).sort((a, b) => b[1] - a[1]);

  const ahorroMesAnterior = mesAnteriorPresupuesto
    ? mesAnteriorPresupuesto.presupuesto_gastos - mesAnteriorPresupuesto.total_gastado
    : null;

  return (
    <>
      <header className="page-header">
        <h1>Estadísticas financieras</h1>
        <p>Analiza tus gastos mes a mes y toma mejores decisiones.</p>
      </header>

      <section className="finanzas-section" aria-label="Mis finanzas">
        <article className="finanzas-card">
          <div className="finanzas-card-header">
            <span className="finanzas-icon">💰</span>
            <div>
              <h3>Presupuesto mensual</h3>
              <p>Ingresa el dinero disponible y cuánto destinas a gastos este mes.</p>
            </div>
          </div>
          <form onSubmit={guardarPresupuesto}>
            <div className="form-field">
              <label>Dinero disponible este mes</label>
              <div className="presupuesto-input-wrap">
                <span className="presupuesto-prefix">$</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={entradaDinero}
                  onChange={(e) => setEntradaDinero(e.target.value)}
                />
              </div>
            </div>
            <div className="form-field">
              <label>Presupuesto destinado a gastos</label>
              <div className="presupuesto-input-row">
                <div className="presupuesto-input-wrap">
                  <span className="presupuesto-prefix">$</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={presupuestoGastos}
                    onChange={(e) => setPresupuestoGastos(e.target.value)}
                  />
                </div>
                <button className="btn-guardar-presupuesto" type="submit" disabled={guardando}>
                  {guardando ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </form>
          {mesActualPresupuesto && (
            <p className="presupuesto-hint">
              Presupuesto actual: {formatMoney(mesActualPresupuesto.presupuesto_gastos)} —
              disponible: {formatMoney(mesActualPresupuesto.presupuesto_disponible)}
            </p>
          )}
        </article>

        <article className="finanzas-card">
          <div className="finanzas-card-header">
            <span className="finanzas-icon">📈</span>
            <div>
              <h3>Resumen del mes anterior</h3>
              <p>Comparativa de gastos vs presupuesto.</p>
            </div>
          </div>

          {!mesAnteriorPresupuesto ? (
            <p style={{ color: "var(--gray-400)", fontSize: "0.85rem" }}>
              Aún no hay un presupuesto registrado para el mes anterior.
            </p>
          ) : (
            <>
              <div className="ahorro-grid">
                <div className="ahorro-item">
                  <span className="ahorro-label">Presupuesto</span>
                  <span className="ahorro-value">
                    {formatMoney(mesAnteriorPresupuesto.presupuesto_gastos)}
                  </span>
                </div>
                <div className="ahorro-item">
                  <span className="ahorro-label">Total gastado</span>
                  <span className="ahorro-value red">
                    {formatMoney(mesAnteriorPresupuesto.total_gastado)}
                  </span>
                </div>
                <div className="ahorro-item ahorro-item-destacado">
                  <span className="ahorro-label">
                    {ahorroMesAnterior !== null && ahorroMesAnterior >= 0
                      ? "Ahorraste"
                      : "Te excediste en"}
                  </span>
                  <span className={`ahorro-value ${ahorroMesAnterior !== null && ahorroMesAnterior >= 0 ? "green" : "red"}`}>
                    {formatMoney(Math.abs(ahorroMesAnterior ?? 0))}
                  </span>
                </div>
              </div>
              <div
                className={`ahorro-mensaje ${
                  ahorroMesAnterior !== null && ahorroMesAnterior >= 0 ? "positivo" : "negativo"
                }`}
              >
                {ahorroMesAnterior !== null && ahorroMesAnterior >= 0
                  ? `🎉 ¡Buen trabajo! Te sobraron ${formatMoney(ahorroMesAnterior)} de tu presupuesto.`
                  : `😟 Gastaste ${formatMoney(Math.abs(ahorroMesAnterior ?? 0))} más de lo planeado.`}
              </div>
            </>
          )}
        </article>
      </section>

      <nav className="month-nav" aria-label="Navegación de meses">
        <button onClick={() => cambiarMes(-1)}>← Anterior</button>
        <span>
          {MESES[mes]} {anio}
        </span>
        <button onClick={() => cambiarMes(1)}>Siguiente →</button>
      </nav>

      <section className="chart-section" aria-label="Resumen del mes">
        <h2>Resumen del mes</h2>
        <div className="total-row">
          <span className="label">Total registrado</span>
          <span className="value">{formatMoney(totalMes)}</span>
        </div>
        <div className="total-row">
          <span className="label">✅ Pagado</span>
          <span className="value green">{formatMoney(pagadoMes)}</span>
        </div>
        <div className="total-row">
          <span className="label">⏳ Pendiente</span>
          <span className="value">{formatMoney(pendienteMes)}</span>
        </div>
        <div className="total-row">
          <span className="label">⚠️ Vencido</span>
          <span className="value red">{formatMoney(vencidoMes)}</span>
        </div>
      </section>

      <section className="chart-section" aria-label="Distribución por categoría">
        <h2>📊 Distribución por categoría</h2>
        {cargando ? (
          <p>Cargando...</p>
        ) : categoriasOrdenadas.length === 0 ? (
          <p style={{ color: "var(--gray-400)", fontSize: "0.85rem" }}>
            Sin datos para este mes.
          </p>
        ) : (
          categoriasOrdenadas.map(([cat, monto]) => {
            const pct = totalMes > 0 ? Math.round((monto / totalMes) * 100) : 0;
            return (
              <div className="bar-item" key={cat}>
                <div className="bar-label">
                  <span>{cat}</span>
                  <span>
                    {formatMoney(monto)} ({pct}%)
                  </span>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${pct}%`, background: colorParaCategoria(cat) }}
                  />
                </div>
              </div>
            );
          })
        )}
      </section>
    </>
  );
}