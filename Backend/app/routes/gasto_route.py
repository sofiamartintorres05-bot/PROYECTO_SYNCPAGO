from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.controllers.gasto_controller import (
    obtener_gastos_usuario,
    obtener_detalles_todos_gastos,
    crear_gasto,
    actualizar_estado_gasto,
    actualizar_gasto,
    eliminar_gasto
)
from app.controllers.usuario_controller import obtener_usuario
from app.utils.response import response_success, response_error

router = APIRouter(
    prefix="/gastos",
    tags=["Gastos"]
)

# 1. LISTAR GASTOS DE UN USUARIO (SELECT 3)
@router.get("/usuario/{id_usuario}")
def listar_gastos_usuario(id_usuario: int, db: Session = Depends(get_db)):
    try:
        usuario = obtener_usuario(db, id_usuario)
        if not usuario:
            return response_error(
                mensaje="El usuario no existe",
                error="USUARIO_NOT_FOUND",
                code=404
            )
        gastos = obtener_gastos_usuario(db, id_usuario)
        return response_success(
            mensaje="Gastos e información del usuario encontrados",
            data={"usuario": usuario, "gastos": gastos},
            code=200
        )
    except Exception as error:
        return response_error(
            mensaje="Error al consultar los gastos del usuario",
            error=str(error),
            code=500
        )

# 2. OBTENER DETALLE DE TODOS LOS GASTOS GLOBALES (SELECT 2)
@router.get("/detalles")
def listar_detalles_todos_gastos(db: Session = Depends(get_db)):
    try:
        detalles = obtener_detalles_todos_gastos(db)
        return response_success(
            mensaje="Listado detallado de todos los gastos obtenido con éxito",
            data=detalles,
            code=200
        )
    except Exception as error:
        return response_error(
            mensaje="Error al listar los detalles de los gastos",
            error=str(error),
            code=500
        )

# 3. CREAR NUEVO GASTO (INSERT 4)
@router.post("/")
def registrar_gasto(
    id_tipo: int, 
    fecha_vencimiento: str, # Ejemplo: '2026-09-01 18:00:00'
    precio: float, 
    estado: str = "pendiente", 
    db: Session = Depends(get_db)
):
    try:
        fecha_dt = datetime.strptime(fecha_vencimiento, "%Y-%m-%d %H:%M:%S")
        nuevo = crear_gasto(db, id_tipo, fecha_dt, precio, estado)
        return response_success(
            mensaje="Gasto registrado con éxito. Recordatorio y trazabilidad creados por trigger.",
            data=nuevo,
            code=201
        )
    except Exception as error:
        return response_error(
            mensaje="Error al crear el gasto",
            error=str(error),
            code=500
        )

# 4. ACTUALIZAR ESTADO DE GASTO (UPDATE 5)
@router.patch("/{id_gasto}/estado")
def cambiar_estado_gasto(id_gasto: int, estado: str, db: Session = Depends(get_db)):
    try:
        actualizado = actualizar_estado_gasto(db, id_gasto, estado)
        if not actualizado:
            return response_error(
                mensaje="Gasto no encontrado",
                error="GASTO_NOT_FOUND",
                code=404
              )
        return response_success(
            mensaje="Estado del gasto actualizado con éxito",
            data=actualizado,
            code=200
        )
    except Exception as error:
        return response_error(
            mensaje="Error al actualizar el estado del gasto",
            error=str(error),
            code=500
        )

# =========================================================
# 5. EDITAR UN GASTO (campos opcionales: id_tipo, fecha, precio)
# =========================================================
@router.patch("/{id_gasto}")
def editar_gasto(
    id_gasto: int,
    id_tipo: int = None,
    fecha_vencimiento: str = None,  # 'YYYY-MM-DD HH:MM:SS'
    precio: float = None,
    db: Session = Depends(get_db)
):
    try:
        fecha_dt = (
            datetime.strptime(fecha_vencimiento, "%Y-%m-%d %H:%M:%S")
            if fecha_vencimiento else None
        )
        actualizado = actualizar_gasto(db, id_gasto, id_tipo, fecha_dt, precio)
        if not actualizado:
            return response_error(
                mensaje="Gasto no encontrado",
                error="GASTO_NOT_FOUND",
                code=404
            )
        return response_success(
            mensaje="Gasto actualizado con éxito",
            data=actualizado,
            code=200
        )
    except Exception as error:
        return response_error(
            mensaje="Error al editar el gasto",
            error=str(error),
            code=500
        )

# 6. ELIMINAR GASTO (DELETE 6)
@router.delete("/{id_gasto}")
def borrar_gasto(id_gasto: int, db: Session = Depends(get_db)):
    try:
        eliminar_gasto(db, id_gasto)
        return response_success(
            mensaje="Gasto eliminado con éxito",
            data={"id_gasto_eliminado": id_gasto},
            code=200
        )
    except Exception as error:
        return response_error(
            mensaje="Error al eliminar el gasto",
            error=str(error),
            code=500
        )