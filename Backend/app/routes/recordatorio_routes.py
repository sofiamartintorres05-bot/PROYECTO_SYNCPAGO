from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.controllers.recordatorio_controller import obtener_alertas_recordatorios
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