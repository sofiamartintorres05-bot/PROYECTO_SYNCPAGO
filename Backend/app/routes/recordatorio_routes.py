from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.controllers.recordatorio_controller import (
    obtener_alertas_recordatorios,
    obtener_recordatorio_por_gasto,
    actualizar_tiempo_antelacion
)
from app.utils.response import response_success, response_error

router = APIRouter(
    prefix="/recordatorios",
    tags=["Recordatorios"]
)

@router.get("/alertas")
def listar_alertas(db: Session = Depends(get_db)):
    try:
        alertas = obtener_alertas_recordatorios(db)
        return response_success(
            mensaje="Alertas de recordatorios obtenidas",
            data=alertas,
            code=200
        )
    except Exception as error:
        return response_error(
            mensaje="Error al consultar las alertas",
            error=str(error),
            code=500
        )

# =========================================================
# OBTENER EL RECORDATORIO (MINUTOS DE ANTELACIÓN) DE UN GASTO
# =========================================================
@router.get("/gasto/{id_gasto}")
def consultar_recordatorio_gasto(id_gasto: int, db: Session = Depends(get_db)):
    try:
        recordatorio = obtener_recordatorio_por_gasto(db, id_gasto)
        if not recordatorio:
            return response_error(
                mensaje="Este gasto no tiene un recordatorio asociado",
                error="RECORDATORIO_NOT_FOUND",
                code=404
            )
        return response_success(
            mensaje="Recordatorio del gasto obtenido con éxito",
            data=recordatorio,
            code=200
        )
    except Exception as error:
        return response_error(
            mensaje="Error al consultar el recordatorio del gasto",
            error=str(error),
            code=500
        )

# =========================================================
# ACTUALIZAR LOS MINUTOS DE ANTELACIÓN DE UN GASTO
# =========================================================
@router.patch("/gasto/{id_gasto}")
def editar_tiempo_antelacion(
    id_gasto: int,
    tiempo_antelacion: int,
    db: Session = Depends(get_db)
):
    try:
        if tiempo_antelacion <= 0:
            return response_error(
                mensaje="El tiempo de antelación debe ser mayor a 0 minutos",
                error="TIEMPO_ANTELACION_INVALIDO",
                code=422
            )
        actualizado = actualizar_tiempo_antelacion(db, id_gasto, tiempo_antelacion)
        if not actualizado:
            return response_error(
                mensaje="Este gasto no tiene un recordatorio asociado",
                error="RECORDATORIO_NOT_FOUND",
                code=404
            )
        return response_success(
            mensaje="Tiempo de antelación actualizado con éxito",
            data=actualizado,
            code=200
        )
    except Exception as error:
        return response_error(
            mensaje="Error al actualizar el tiempo de antelación",
            error=str(error),
            code=500
        )