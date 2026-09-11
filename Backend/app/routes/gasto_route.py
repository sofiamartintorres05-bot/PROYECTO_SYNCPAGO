from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.config.database import get_db

# Importación de los controladores (Se incluyó la función que faltaba)
from app.controllers.gasto_controller import (
    obtener_gastos_usuario,
    obtener_detalles_todos_gastos,
    crear_gasto,
    actualizar_estado_gasto,
    actualizar_gasto,
    eliminar_gasto,
    marcar_gastos_vencidos,
    obtener_gastos_usuario_por_clase  # <--- Agregada aquí
)
from app.controllers.usuario_controller import obtener_usuario
from app.utils.response import response_success, response_error

router = APIRouter(
    prefix="/gastos",
    tags=["Gastos"]
)

# Funci'on auxiliar para parsear fechas de forma flexible (acepta con o sin hora)
def parsear_fecha(fecha_str: str) -> datetime:
    if not fecha_str:
        return None
    try:
        return datetime.strptime(fecha_str, "%Y-%m-%d %H:%M:%S")
    except ValueError:
        return datetime.strptime(fecha_str, "%Y-%m-%d")


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
    fecha_vencimiento: str, # Acepta '2026-09-01' o '2026-09-01 18:00:00'
    precio: float, 
    estado: str = "pendiente", 
    db: Session = Depends(get_db)
):
    try:
        fecha_dt = parsear_fecha(fecha_vencimiento)
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

# 5. EDITAR UN GASTO
@router.patch("/{id_gasto}")
def editar_gasto(
    id_gasto: int,
    id_tipo: int = None,
    fecha_vencimiento: str = None, 
    precio: float = None,
    db: Session = Depends(get_db)
):
    try:
        fecha_dt = parsear_fecha(fecha_vencimiento) if fecha_vencimiento else None
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

# 7. MARCAR MANUALMENTE LOS GASTOS VENCIDOS
@router.post("/actualizar-vencidos")
def actualizar_vencidos_manual(db: Session = Depends(get_db)):
    try:
        marcar_gastos_vencidos(db)
        return response_success(
            mensaje="Gastos vencidos actualizados con éxito",
            data=None,
            code=200
        )
    except Exception as error:
        return response_error(
            mensaje="Error al actualizar los gastos vencidos",
            error=str(error),
            code=500
        )

# 8. FILTRAR Y RESUMIR GASTOS POR CLASE
@router.get("/usuario/{id_usuario}/clase/{clase}")
def filtrar_gastos_por_clase(id_usuario: int, clase: str, db: Session = Depends(get_db)):
    clase_clean = clase.strip().lower()
    
    clases_permitidas = ["vital", "varios", "entretenimiento"]
    if clase_clean not in clases_permitidas:
        return response_error(
            mensaje=f"La clase '{clase}' no es válida. Las clases permitidas son: {', '.join(clases_permitidas)}",
            error="INVALID_CLASS_TYPE",
            code=400
        )

    try:
        usuario = obtener_usuario(db, id_usuario)
        if not usuario:
            return response_error(
                mensaje="El usuario no existe",
                error="USUARIO_NOT_FOUND",
                code=404
            )
        
        resumen = obtener_gastos_usuario_por_clase(db, id_usuario, clase_clean)
        
        return response_success(
            mensaje=f"Resumen y gastos de la clase '{clase_clean}' obtenidos exitosamente",
            data={
                "usuario": {
                    "id_usuario": getattr(usuario, "id_usuario", id_usuario),
                    "nombre": getattr(usuario, "nombre", ""),
                    "correo": getattr(usuario, "correo", "")
                },
                "clase": resumen.get("clase", clase_clean) if isinstance(resumen, dict) else clase_clean,
                "total_recibos": resumen.get("total_recibos", 0) if isinstance(resumen, dict) else 0,
                "monto_acumulado": resumen.get("monto_acumulado", 0.0) if isinstance(resumen, dict) else 0.0,
                "gastos": resumen.get("gastos", []) if isinstance(resumen, dict) else resumen
            },
            code=200
        )
    except Exception as error:
        return response_error(
            mensaje=f"Error al filtrar los gastos por la clase '{clase}'",
            error=str(error),
            code=500
        )