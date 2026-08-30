from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.controllers.trazabilidad_controller import obtener_historial_gasto
from app.utils.response import response_success, response_error

router = APIRouter(
    prefix="/trazabilidad",
    tags=["Trazabilidad"]
)

@router.get("/gasto/{id_gasto}")
def consultar_historial(id_gasto: int, db: Session = Depends(get_db)):
    try:
        historial = obtener_historial_gasto(db, id_gasto)
        return response_success(
            mensaje="Historial de cambios (trazabilidad) del gasto obtenido",
            data=historial,
            code=200
        )
    except Exception as error:
        return response_error(
            mensaje="Error al consultar el historial del gasto",
            error=str(error),
            code=500
        )