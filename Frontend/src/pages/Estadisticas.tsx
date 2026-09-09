import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { gastosService } from "../services/gastosService";
import { finanzasService } from "../services/finanzasService";
import { tipoGastoService } from "../services/tipoGastoService";
import type { Gasto } from "../interfaces/gasto";
import type { PresupuestoMes } from "../interfaces/finanzas";
import type { TipoGasto, ClaseTipoGasto } from "../interfaces/tipoGasto";
import { formatMoney, formatDateTime, colorParaCategoria, MESES } from "../utils/format";

function fechaAMesInput(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  return `${anio}-${mes}`;
}

function claveMes(anio: number, mesIndex: number): string {
  return `${anio}-${String(mesIndex + 1).padStart(2, "0")}`;
}

// Busca, dentro de la lista de presupuestos, el registro EXACTO de un mes en
// particular. Antes se usaba siempre el más reciente (presupuestos[0]) sin
// importar qué mes se estuviera mirando, por eso agosto mostraba los datos
// de septiembre. Cada mes ahora es completamente independiente.
function buscarPresupuestoDeMes(
  lista: PresupuestoMes[],
  anio: number,
  mesIndex: number
): PresupuestoMes | undefined {
  const clave = claveMes(anio, mesIndex);
  return lista.find((p) => p.mes.slice(0, 7) === clave);
}

const CLASES_LABEL: Record<string, string> = {
  vital: "Vital",
  entretenimiento: "Entretenimiento",
  varios: "Varios",
  sin_clase: "Sin clase",
};

export default function Estadisticas() {
  const { usuario } = useAuth();
  const { mostrarToast } = useToast();

  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [presupuestos, setPresupuestos] = useState<PresupuestoMes[]>([]);
  const [categorias, setCategorias] = useState<TipoGasto[]>([]);
  const [cargando, setCargando] = useState(true);

  const [mesFormulario, setMesFormulario] = useState(fechaAMesInput(new Date()));
  const [entradaDinero, setEntradaDinero] = useState("");
  const [presupuestoGastos, setPresupuestoGastos] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [fechaActual, setFechaActual] = useState(new Date());

  const [modoDistribucion, setModoDistribucion] = useState<"categoria" | "clase">("categoria");
  const [detalleAbierto, setDetalleAbierto] = useState<string | null>(null);

  useEffect(() => {
    if (!usuario) return;
    cargarTodo();
  }, [usuario]);

  async function cargarTodo() {
    if (!usuario) return;
    setCargando(true);
    try {
      const [datosGastos, datosPresupuesto, datosCategorias] = await Promise.all([
        gastosService.listarPorUsuario(usuario.id_usuario),
        finanzasService.obtenerPresupuesto(usuario.id_usuario),
        tipoGastoService.listarPorUsuario(usuario.id_usuario),
      ]);
      setGastos(datosGastos.gastos);
      setPresupuestos(datosPresupuesto);
      setCategorias(datosCategorias);
    } catch (err) {
      mostrarToast(err instanceof Error ? err.message : "Error al cargar estadísticas");
    } finally {
      setCargando(false);
    }
  }

  // Precarga el formulario con lo que ya existe guardado para el mes elegido
  // (si no hay nada guardado para ese mes, queda vacío).
  const presupuestoMesFormulario = presupuestos.find((p) => p.mes.slice(0, 7) === mesFormulario);
  useEffect(() => {
    if (presupuestoMesFormulario) {
      setEntradaDinero(String(presupuestoMesFormulario.entrada_dinero));
      setPresupuestoGastos(String(presupuestoMesFormulario.presupuesto_gastos));
    } else {
      setEntradaDinero("");
      setPresupuestoGastos("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Balance del formulario: SOLO del mes que se está editando en el formulario.
  const balanceDineroVsPresupuestoFormulario = presupuestoMesFormulario
    ? presupuestoMesFormulario.entrada_dinero - presupuestoMesFormulario.presupuesto_gastos
    : null;
  const enDeudaFormulario =
    balanceDineroVsPresupuestoFormulario !== null && balanceDineroVsPresupuestoFormulario < 0;

  function cambiarMes(direccion: number) {
    const nueva = new Date(fechaActual);
    nueva.setMonth(nueva.getMonth() + direccion);
    setFechaActual(nueva);
    setDetalleAbierto(null);
  }

  const mes = fechaActual.getMonth();
  const anio = fechaActual.getFullYear();

  // Presupuesto EXACTO del mes que se está viendo en "Resumen del mes"
  // (antes se usaba siempre el más reciente, por eso se mezclaban los meses).
  const presupuestoMesVisto = buscarPresupuestoDeMes(presupuestos, anio, mes);

  const gastosDelMes = gastos.filter((g) => {
    const f = new Date(g.fecha_vencimiento);
    return f.getMonth() === mes && f.getFullYear() === anio && g.estado !== "cancelado";
  });

  const totalMes = gastosDelMes.reduce((a, g) => a + g.precio, 0);
  const pagadoMes = gastosDelMes
    .filter((g) => g.estado === "pagado")
    .reduce((a, g) => a + g.precio, 0);
  const vencidoMes = gastosDelMes.filter(
    (g) => g.estado === "vencido" || (g.estado === "pendiente" && new Date(g.fecha_vencimiento) < new Date())
  ).reduce((a, g) => a + g.precio, 0);
  const pendienteMes = Math.max(0, totalMes - pagadoMes - vencidoMes);

  // Saldo sobrante / deuda del MES SELECCIONADO = su propio presupuesto - lo pagado ESE mes.
  const presupuestoVigente = presupuestoMesVisto?.presupuesto_gastos ?? null;
  const saldoSobranteODeuda =
    presupuestoVigente !== null ? presupuestoVigente - pagadoMes : null;
  const hayDeudaPorPagos = saldoSobranteODeuda !== null && saldoSobranteODeuda < 0;

  const totalPrevistoAPagar = pendienteMes + pagadoMes;

  // Resuelve la clase (vital/entretenimiento/varios) de una categoría por su nombre.
  function claseDeCategoria(nombreCategoria: string): string {
    const encontrada = categorias.find((c) => c.detalle === nombreCategoria);
    return encontrada?.clase ?? "sin_clase";
  }

  // Agrupación según el modo elegido: por categoría (detalle) o por clase.
  const agrupado: Record<string, { total: number; gastos: Gasto[] }> = {};
  gastosDelMes.forEach((g) => {
    const clave = modoDistribucion === "categoria" ? g.categoria : claseDeCategoria(g.categoria);
    if (!agrupado[clave]) agrupado[clave] = { total: 0, gastos: [] };
    agrupado[clave].total += g.precio;
    agrupado[clave].gastos.push(g);
  });
  const gruposOrdenados = Object.entries(agrupado).sort((a, b) => b[1].total - a[1].total);

  function etiquetaGrupo(clave: string): string {
    return modoDistribucion === "clase" ? CLASES_LABEL[clave] ?? clave : clave;
  }

  // ============ RESUMEN DEL MES ANTERIOR ============
  const mesAnteriorPresupuesto = presupuestos[1];
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
          {presupuestoMesFormulario ? (
            <p className="presupuesto-hint">
              Presupuesto de {MESES[Number(mesFormulario.split("-")[1]) - 1]}:{" "}
              {formatMoney(presupuestoMesFormulario.presupuesto_gastos)} —{" "}
              {enDeudaFormulario ? (
                <span style={{ color: "var(--red)", fontWeight: 700 }}>
                  deuda: {formatMoney(Math.abs(balanceDineroVsPresupuestoFormulario ?? 0))}
                </span>
              ) : (
                <>disponible: {formatMoney(balanceDineroVsPresupuestoFormulario ?? 0)}</>
              )}
            </p>
          ) : (
            <p className="presupuesto-hint">Aún no has guardado un presupuesto para este mes.</p>
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
              Todavía no has guardado un presupuesto para ningún mes anterior. Usa el selector de
              "Mes" de la tarjeta de la izquierda para guardarlo.
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
            {hayDeudaPorPagos ? "🔴 Deuda" : "💚 Saldo sobrante"} (presupuesto de{" "}
            {MESES[mes]} − pagado)
          </span>
          <span className={`value ${hayDeudaPorPagos ? "red" : "green"}`}>
            {presupuestoVigente === null
              ? "Sin presupuesto para este mes"
              : formatMoney(Math.abs(saldoSobranteODeuda ?? 0))}
          </span>
        </div>
        <div className="total-row">
          <span className="label">📌 Total previsto a pagar (pendiente + pagado)</span>
          <span className="value">{formatMoney(totalPrevistoAPagar)}</span>
        </div>
      </section>

      <section className="chart-section" aria-label="Distribución">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <h2 style={{ margin: 0 }}>📊 Distribución de {MESES[mes]}</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className={`filter-btn${modoDistribucion === "categoria" ? " active" : ""}`}
              onClick={() => {
                setModoDistribucion("categoria");
                setDetalleAbierto(null);
              }}
            >
              Por categoría
            </button>
            <button
              className={`filter-btn${modoDistribucion === "clase" ? " active" : ""}`}
              onClick={() => {
                setModoDistribucion("clase");
                setDetalleAbierto(null);
              }}
            >
              Por clase
            </button>
          </div>
        </div>

        {cargando ? (
          <p>Cargando...</p>
        ) : gruposOrdenados.length === 0 ? (
          <p style={{ color: "var(--gray-400)", fontSize: "0.85rem" }}>
            Sin datos para este mes.
          </p>
        ) : (
          gruposOrdenados.map(([clave, info]) => {
            const pct = totalMes > 0 ? Math.round((info.total / totalMes) * 100) : 0;
            const abierto = detalleAbierto === clave;
            return (
              <div className="bar-item" key={clave}>
                <div className="bar-label">
                  <span>{etiquetaGrupo(clave)}</span>
                  <span>
                    {formatMoney(info.total)} ({pct}%)
                  </span>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${pct}%`, background: colorParaCategoria(clave) }}
                  />
                </div>
                <span
                  className="forgot-link"
                  style={{
                    display: "inline-block",
                    marginTop: 6,
                    fontSize: "0.78rem",
                    color: "var(--blue-mid)",
                  }}
                  onClick={() => setDetalleAbierto(abierto ? null : clave)}
                >
                  {abierto ? "Ocultar detalles ▲" : "Ver detalles ▼"}
                </span>

                {abierto && (
                  <div
                    style={{
                      background: "var(--gray-50)",
                      borderRadius: "var(--radius-sm)",
                      padding: "8px 12px",
                      marginTop: 6,
                      marginBottom: 8,
                    }}
                  >
                    {info.gastos.map((g) => (
                      <div
                        key={g.id_gasto}
                        className="total-row"
                        style={{ padding: "8px 0" }}
                      >
                        <span className="label">
                          {modoDistribucion === "clase" ? `${g.categoria} — ` : ""}
                          {formatDateTime(g.fecha_vencimiento)} ({g.estado})
                        </span>
                        <span className="value" style={{ fontSize: "0.9rem" }}>
                          {formatMoney(g.precio)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>
    </>
  );
}