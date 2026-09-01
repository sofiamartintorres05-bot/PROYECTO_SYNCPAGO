import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import type { ClaseTipoGasto, TipoGasto } from "../interfaces/tipoGasto";
import type { Gasto } from "../interfaces/gasto";
import { tipoGastoService } from "../services/tipoGastoService";
import { gastosService } from "../services/gastosService";
import { toBackendDateTime, toDatetimeLocalValue } from "../utils/format";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";

interface GastoFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  categorias: TipoGasto[];
  onCategoriaCreada: (categoria: TipoGasto) => void;
  gastoEditar?: Gasto | null;
  idTipoResuelto?: number | null;
}

const CLASES: ClaseTipoGasto[] = ["vital", "entretenimiento", "varios"];

export default function GastoFormModal({
  open,
  onClose,
  onSaved,
  categorias,
  onCategoriaCreada,
  gastoEditar,
  idTipoResuelto,
}: GastoFormModalProps) {
  const { usuario } = useAuth();
  const { mostrarToast } = useToast();

  const esEdicion = Boolean(gastoEditar);

  const [idTipo, setIdTipo] = useState<string>("");
  const [nuevaCategoria, setNuevaCategoria] = useState(false);
  const [detalleNuevo, setDetalleNuevo] = useState("");
  const [claseNueva, setClaseNueva] = useState<ClaseTipoGasto | "">("");
  const [fecha, setFecha] = useState("");
  const [precio, setPrecio] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    if (gastoEditar) {
      setIdTipo(idTipoResuelto ? String(idTipoResuelto) : "");
      setFecha(toDatetimeLocalValue(gastoEditar.fecha_vencimiento));
      setPrecio(String(gastoEditar.precio));
    } else {
      setIdTipo("");
      setFecha("");
      setPrecio("");
    }
    setNuevaCategoria(false);
    setDetalleNuevo("");
    setClaseNueva("");
    setError("");
  }, [open, gastoEditar, idTipoResuelto]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!usuario) return;
    if (!fecha) {
      setError("La fecha de vencimiento es obligatoria.");
      return;
    }
    if (!precio || Number(precio) <= 0) {
      setError("Ingresa un precio válido mayor a 0.");
      return;
    }
    if (!nuevaCategoria && !idTipo) {
      setError("Selecciona una categoría.");
      return;
    }
    if (nuevaCategoria && !detalleNuevo.trim()) {
      setError("Escribe el nombre de la nueva categoría.");
      return;
    }

    setGuardando(true);
    try {
      let idTipoFinal = idTipo ? Number(idTipo) : null;

      if (nuevaCategoria) {
        const categoria = await tipoGastoService.crear(
          usuario.id_usuario,
          detalleNuevo.trim(),
          claseNueva || undefined
        );
        idTipoFinal = categoria.id_tipo;
        onCategoriaCreada(categoria);
      }

      if (!idTipoFinal) {
        setError("No se pudo determinar la categoría del gasto.");
        setGuardando(false);
        return;
      }

      const fechaBackend = toBackendDateTime(fecha);

      if (esEdicion && gastoEditar) {
        await gastosService.editar(gastoEditar.id_gasto, {
          id_tipo: idTipoFinal,
          fecha_vencimiento: fechaBackend,
          precio: Number(precio),
        });
        mostrarToast("Gasto actualizado ✓");
      } else {
        await gastosService.crear({
          id_tipo: idTipoFinal,
          fecha_vencimiento: fechaBackend,
          precio: Number(precio),
          estado: "pendiente",
        });
        mostrarToast("Gasto creado ✓");
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar el gasto.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal
      open={open}
      title={esEdicion ? "Editar gasto" : "Nuevo gasto"}
      onClose={onClose}
      footer={
        <>
          <button className="btn-danger" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn-save"
            type="submit"
            form="gasto-form"
            disabled={guardando}
          >
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </>
      }
    >
      <form id="gasto-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label>Categoría</label>
          {!nuevaCategoria ? (
            <div className="select-wrap">
              <select value={idTipo} onChange={(e) => setIdTipo(e.target.value)}>
                <option value="">Selecciona una categoría...</option>
                {categorias.map((cat) => (
                  <option key={cat.id_tipo} value={cat.id_tipo}>
                    {cat.detalle}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="form-row">
              <input
                type="text"
                placeholder="Nombre de la categoría"
                value={detalleNuevo}
                onChange={(e) => setDetalleNuevo(e.target.value)}
              />
              <div className="select-wrap">
                <select
                  value={claseNueva}
                  onChange={(e) => setClaseNueva(e.target.value as ClaseTipoGasto)}
                >
                  <option value="">Clase (opcional)</option>
                  {CLASES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <span
            className="forgot-link"
            style={{ display: "inline-block", marginTop: 8, color: "var(--blue-mid)" }}
            onClick={() => setNuevaCategoria((v) => !v)}
          >
            {nuevaCategoria ? "← Usar categoría existente" : "+ Crear nueva categoría"}
          </span>
        </div>

        <div className="form-field">
          <label>Fecha y hora de vencimiento</label>
          <input
            type="datetime-local"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label>Precio</label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
          />
        </div>

        {error && (
          <p className="field-error" style={{ display: "block" }}>
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}