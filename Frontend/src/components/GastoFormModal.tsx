import React, { useEffect, useMemo, useState } from "react";
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

const CLASES: { valor: ClaseTipoGasto; etiqueta: string }[] = [
  { valor: "vital", etiqueta: "Vital" },
  { valor: "entretenimiento", etiqueta: "Entretenimiento" },
  { valor: "varios", etiqueta: "Varios" },
];

const OPCION_NUEVO = "__nuevo__";

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

  const [clase, setClase] = useState<ClaseTipoGasto | "">("");
  const [idTipo, setIdTipo] = useState<string>("");
  const [detalleNuevo, setDetalleNuevo] = useState("");
  const [fecha, setFecha] = useState("");
  const [precio, setPrecio] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    if (gastoEditar && idTipoResuelto) {
      const categoriaActual = categorias.find((c) => c.id_tipo === idTipoResuelto);
      setClase(categoriaActual?.clase ?? "");
      setIdTipo(String(idTipoResuelto));
      setFecha(toDatetimeLocalValue(gastoEditar.fecha_vencimiento));
      setPrecio(String(gastoEditar.precio));
    } else {
      setClase("");
      setIdTipo("");
      setFecha("");
      setPrecio("");
    }
    setDetalleNuevo("");
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, gastoEditar, idTipoResuelto]);

  const detallesFiltrados = useMemo(() => {
    if (!clase) return categorias;
    return categorias.filter((c) => c.clase === clase);
  }, [categorias, clase]);

  const creandoNuevoDetalle = idTipo === OPCION_NUEVO;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!usuario) return;

    if (!clase) {
      setError("Selecciona una categoría.");
      return;
    }
    if (!fecha) {
      setError("La fecha de vencimiento es obligatoria.");
      return;
    }
    if (!precio || Number(precio) <= 0) {
      setError("Ingresa un precio válido mayor a 0.");
      return;
    }
    if (!idTipo) {
      setError("Selecciona el detalle del gasto.");
      return;
    }
    if (creandoNuevoDetalle && !detalleNuevo.trim()) {
      setError("Escribe el nombre del nuevo detalle.");
      return;
    }

    setGuardando(true);
    try {
      let idTipoFinal = creandoNuevoDetalle ? null : Number(idTipo);

      if (creandoNuevoDetalle) {
        const categoria = await tipoGastoService.crear(
          usuario.id_usuario,
          detalleNuevo.trim(),
          clase
        );
        idTipoFinal = categoria.id_tipo;
        onCategoriaCreada(categoria);
      }

      if (!idTipoFinal) {
        setError("No se pudo determinar el detalle del gasto.");
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
      title={esEdicion ? "Editar recibo" : "Nuevo recibo"}
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
            {guardando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Confirmar"}
          </button>
        </>
      }
    >
      <form id="gasto-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label>Categoría</label>
          <div className="select-wrap">
            <select
              value={clase}
              onChange={(e) => {
                setClase(e.target.value as ClaseTipoGasto);
                setIdTipo("");
              }}
            >
              <option value="">Selecciona categoría...</option>
              {CLASES.map((c) => (
                <option key={c.valor} value={c.valor}>
                  {c.etiqueta}
                </option>
              ))}
            </select>
          </div>
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
            placeholder="Valor"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label>Detalle del gasto</label>
          <div className="select-wrap">
            <select value={idTipo} onChange={(e) => setIdTipo(e.target.value)}>
              <option value="">Detalle</option>
              {detallesFiltrados.map((c) => (
                <option key={c.id_tipo} value={c.id_tipo}>
                  {c.detalle}
                </option>
              ))}
              <option value={OPCION_NUEVO}>+ Crear nuevo detalle...</option>
            </select>
          </div>
          {creandoNuevoDetalle && (
            <input
              type="text"
              style={{ marginTop: 8 }}
              placeholder="Nombre del nuevo detalle"
              value={detalleNuevo}
              onChange={(e) => setDetalleNuevo(e.target.value)}
            />
          )}
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