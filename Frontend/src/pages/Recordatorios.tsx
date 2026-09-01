import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { gastosService } from "../services/gastosService";
import { recordatoriosService } from "../services/recordatoriosService";
import type { Gasto } from "../interfaces/gasto";
import { minutosAHoras } from "../utils/format";

export default function Recordatorios() {
  const { usuario } = useAuth();
  const { mostrarToast } = useToast();

  const [gastosPendientes, setGastosPendientes] = useState<Gasto[]>([]);
  const [idGastoSeleccionado, setIdGastoSeleccionado] = useState<string>("");
  const [minutos, setMinutos] = useState<number>(120);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!usuario) return;
    (async () => {
      setCargando(true);
      try {
        const data = await gastosService.listarPorUsuario(usuario.id_usuario);
        const pendientes = data.gastos.filter((g) => g.estado === "pendiente");
        setGastosPendientes(pendientes);
        if (pendientes.length > 0) {
          setIdGastoSeleccionado(String(pendientes[0].id_gasto));
        }
      } catch (err) {
        mostrarToast(err instanceof Error ? err.message : "Error al cargar tus gastos");
      } finally {
        setCargando(false);
      }
    })();
  }, [usuario]);

  useEffect(() => {
    if (!idGastoSeleccionado) return;
    (async () => {
      try {
        const recordatorio = await recordatoriosService.obtenerPorGasto(
          Number(idGastoSeleccionado)
        );
        setMinutos(recordatorio.tiempo_antelacion);
      } catch {
        // Si el gasto aún no tiene recordatorio, se deja el valor por defecto (120 min).
        setMinutos(120);
      }
    })();
  }, [idGastoSeleccionado]);

  async function guardarMinutos() {
    if (!idGastoSeleccionado) return;
    if (minutos <= 0) {
      mostrarToast("El tiempo de antelación debe ser mayor a 0 minutos");
      return;
    }
    setGuardando(true);
    try {
      await recordatoriosService.actualizar(Number(idGastoSeleccionado), minutos);
      mostrarToast("Recordatorio actualizado ✓");
    } catch (err) {
      mostrarToast(err instanceof Error ? err.message : "Error al guardar el recordatorio");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <header className="page-header">
        <h1>Recordatorios</h1>
        <p>Configura con cuánto tiempo de antelación quieres que te avisemos.</p>
      </header>

      <div className="perm-card">
        <h3>⏱️ Tiempo de antelación por gasto</h3>
        <p>
          Por defecto, cada gasto nuevo se crea con una antelación de 120
          minutos (2 horas). Aquí puedes editar ese valor en minutos para
          cualquiera de tus gastos pendientes.
        </p>

        {cargando ? (
          <p>Cargando tus gastos...</p>
        ) : gastosPendientes.length === 0 ? (
          <p style={{ color: "var(--gray-400)" }}>
            No tienes gastos pendientes con recordatorio configurable.
          </p>
        ) : (
          <>
            <div className="form-field">
              <label>Gasto</label>
              <div className="select-wrap">
                <select
                  value={idGastoSeleccionado}
                  onChange={(e) => setIdGastoSeleccionado(e.target.value)}
                >
                  {gastosPendientes.map((g) => (
                    <option key={g.id_gasto} value={g.id_gasto}>
                      {g.categoria} —{" "}
                      {new Date(g.fecha_vencimiento).toLocaleDateString("es-CO")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="perm-question">Minutos de antelación</p>
            <div className="minutos-input-row">
              <input
                type="number"
                min={1}
                value={minutos}
                onChange={(e) => setMinutos(Number(e.target.value))}
              />
              <span className="minutos-conversion">≈ {minutosAHoras(minutos)}</span>
              <button
                className="btn-guardar-presupuesto"
                onClick={guardarMinutos}
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="perm-card">
        <h3>
          📱 Notificaciones por WhatsApp
          <span className="badge-proximamente">Próximamente</span>
        </h3>
        <p>
          Esta integración todavía no está disponible: el backend no tiene
          conexión con WhatsApp ni una tabla de preferencias de notificación.
          Cuando se agregue ese soporte, podrás activar aquí el envío de
          alertas por este medio.
        </p>
      </div>

      <div className="perm-card">
        <h3>
          📅 Sincronizar con Calendario
          <span className="badge-proximamente">Próximamente</span>
        </h3>
        <p>
          Igual que con WhatsApp, la integración con Google/Outlook Calendar
          requiere una funcionalidad de backend que aún no existe. Se agregará
          en una siguiente iteración del proyecto.
        </p>
      </div>
    </>
  );
}