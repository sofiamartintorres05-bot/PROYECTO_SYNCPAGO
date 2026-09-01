import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { gastosService } from "../services/gastosService";
import { finanzasService } from "../services/finanzasService";
import type { Gasto } from "../interfaces/gasto";
import type { PresupuestoMes } from "../interfaces/finanzas";
import { formatMoney, colorParaCategoria, MESES } from "../utils/format";

function fechaAMesInput(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  return `${anio}-${mes}`;
}

export default function Estadisticas() {
  const { usuario } = useAuth();
  const { mostrarToast } = useToast();

  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [presupuestos, setPresupuestos] = useState<PresupuestoMes[]>([]);
  const [cargando, setCargando] = useState(true);

  // Mes al que se le va a guardar el presupuesto (por defecto, el mes actual).
  // El backend ya soportaba una fecha específica; antes el frontend nunca la
  // enviaba, así que solo se podía guardar el presupuesto del mes en curso.
  const [mesFormulario, setMesFormulario] = useState(fechaAMesInput(new Date()));
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

  // Si ya existe un presupuesto guardado para el mes elegido en el
  // formulario, se precargan sus valores para poder editarlo en vez de
  // dejar los campos vacíos.
  useEffect(() => {
    const existente = presupuestos.find((p) => p.mes.slice(0, 7) === mesFormulario);
    if (existente) {
      setEntradaDinero(String(existente.entrada_dinero));
      setPresupuestoGastos(String(existente.presupuesto_gastos));
    } else {
      setEntradaDinero("");
      setPresupuestoGastos("");
    }
  }, [mesFormulario, presupuestos]);

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
      const fecha = `${mesFormulario}-01`;
      await finanzasService.guardar(usuario.id_usuario, entrada, presupuesto, fecha);
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

  const balanceDineroVsPresupuesto = mesActualPresupuesto
    ? mesActualPresupuesto.entrada_dinero - mesActualPresupuesto.presupuesto_gastos
    : null;
  const enDeuda = balanceDineroVsPresupuesto !== null && balanceDineroVsPresupuesto < 0;

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

  const presupuestoVigente = mesActualPresupuesto?.presupuesto_gastos ?? null;
  const saldoSobranteODeuda =
    presupuestoVigente !== null ? presupuestoVigente - pagadoMes : null;
  const hayDeudaPorPagos = saldoSobranteODeuda !== null && saldoSobranteODeuda < 0;

  const totalPrevistoAPagar = pendienteMes + pagadoMes;

  const categorias: Record<string, number> = {};
  gastosDelMes.forEach((g) => {
    categorias[g.categoria] = (categorias[g.categoria] || 0) + g.precio;
  });
  const categoriasOrdenadas = Object.entries(categorias).sort((a, b) => b[1] - a[1]);

  // ============ RESUMEN DEL MES ANTERIOR ============
  let nombreMesAnterior = "";
  let pagadoMesAnterior = 0;
  let ahorroMesAnterior: number | null = null;

  if (mesAnteriorPresupuesto) {
    const [anioAnteriorStr, mesAnteriorStr] = mesAnteriorPresupuesto.mes.slice(0, 7).split("-");
    const anioAnterior = Number(anioAnteriorStr);
    const mesAnteriorIndex = Number(mesAnteriorStr) - 1;

    nombreMesAnterior = `${MESES[mesAnteriorIndex]} ${anioAnterior}`;

    pagadoMesAnterior = gastos
      .filter((g) => {
        const f = new Date(g.fecha_vencimiento);
        return (
          f.getMonth() === mesAnteriorIndex &&
          f.getFullYear() === anioAnterior &&
          g.estado === "pagado"
        );
      })
      .reduce((a, g) => a + g.precio, 0);

    ahorroMesAnterior = mesAnteriorPresupuesto.presupuesto_gastos - pagadoMesAnterior;
  }

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
              <p>Elige el mes y guarda cuánto dinero tuviste y cuánto destinaste a gastos.</p>
            </div>
          </div>
          <form onSubmit={guardarPresupuesto}>
            <div className="form-field">
              <label>Mes</label>
              <input
                type="month"
                value={mesFormulario}
                onChange={(e) => setMesFormulario(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Dinero disponible ese mes</label>
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
              Presupuesto actual: {formatMoney(mesActualPresupuesto.presupuesto_gastos)} —{" "}
              {enDeuda ? (
                <span style={{ color: "var(--red)", fontWeight: 700 }}>
                  deuda: {formatMoney(Math.abs(balanceDineroVsPresupuesto ?? 0))}
                </span>
              ) : (
                <>disponible: {formatMoney(balanceDineroVsPresupuesto ?? 0)}</>
              )}
            </p>
          )}
        </article>

        <article className="finanzas-card">
          <div className="finanzas-card-header">
            <span className="finanzas-icon">📈</span>
            <div>
              <h3>{mesAnteriorPresupuesto ? `Resumen de ${nombreMesAnterior}` : "Resumen del mes anterior"}</h3>
              <p>Comparativa entre lo presupuestado y lo que pagaste ese mes.</p>
            </div>
          </div>

          {!mesAnteriorPresupuesto ? (
            <p style={{ color: "var(--gray-400)", fontSize: "0.85rem" }}>
              Todavía no has guardado un presupuesto para ningún mes anterior — crear un
              gasto con fecha pasada no cuenta como presupuesto. Usa el selector de "Mes"
              de la tarjeta de la izquierda para elegir ese mes y guardar su presupuesto;
              en cuanto lo hagas, aquí aparecerá la comparativa.
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
                  <span className="ahorro-label">Pagado</span>
                  <span className="ahorro-value red">{formatMoney(pagadoMesAnterior)}</span>
                </div>
                <div className="ahorro-item ahorro-item-destacado">
                  <span className="ahorro-label">
                    {ahorroMesAnterior !== null && ahorroMesAnterior >= 0
                      ? "Ahorraste"
                      : "Te excediste"}
                  </span>
                  <span
                    className={`ahorro-value ${
                      ahorroMesAnterior !== null && ahorroMesAnterior >= 0 ? "green" : "red"
                    }`}
                  >
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
                  ? `🎉 ¡Buen trabajo! En ${nombreMesAnterior} ahorraste ${formatMoney(ahorroMesAnterior)}.`
                  : `😟 En ${nombreMesAnterior} te excediste por ${formatMoney(Math.abs(ahorroMesAnterior ?? 0))}.`}
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
        <div className="total-row">
          <span className="label">
            {hayDeudaPorPagos ? "🔴 Deuda" : "💚 Saldo sobrante"} (presupuesto − pagado)
          </span>
          <span className={`value ${hayDeudaPorPagos ? "red" : "green"}`}>
            {presupuestoVigente === null
              ? "Sin presupuesto"
              : formatMoney(Math.abs(saldoSobranteODeuda ?? 0))}
          </span>
        </div>
        <div className="total-row">
          <span className="label">📌 Total previsto a pagar (pendiente + pagado)</span>
          <span className="value">{formatMoney(totalPrevistoAPagar)}</span>
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