from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.controllers.finanzas_controller import obtener_presupuesto_disponible
from app.utils.response import response_success, response_error

router = APIRouter(
    prefix="/finanzas",
    tags=["Finanzas"]
)

@router.get("/usuario/{id_usuario}/presupuesto")
def consultar_presupuesto(id_usuario: int, db: Session = Depends(get_db)):
    try:
        presupuesto = obtener_presupuesto_disponible(db, id_usuario)
        return response_success(
            mensaje="Presupuesto disponible por mes para el usuario",
            data=presupuesto,
            code=200
        )
    except Exception as error:
        return response_error(
            mensaje="Error al consultar el presupuesto disponible",
            error=str(error),
            code=500
        )