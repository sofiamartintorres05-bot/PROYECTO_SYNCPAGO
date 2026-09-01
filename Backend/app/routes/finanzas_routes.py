from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.controllers.finanzas_controller import (
    obtener_presupuesto_disponible,
    registrar_o_actualizar_finanzas
)
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

# =========================================================
# REGISTRAR O ACTUALIZAR EL PRESUPUESTO / DINERO DEL MES
# =========================================================
@router.post("/")
def guardar_finanzas(
    id_usuario: int,
    entrada_dinero: float,
    presupuesto_gastos: float,
    fecha: str = None,  # 'YYYY-MM-DD', opcional (por defecto hoy)
    db: Session = Depends(get_db)
):
    try:
        resultado = registrar_o_actualizar_finanzas(
            db, id_usuario, entrada_dinero, presupuesto_gastos, fecha
        )
        return response_success(
            mensaje="Presupuesto del mes guardado con éxito",
            data=resultado,
            code=201
        )
    except Exception as error:
        return response_error(
            mensaje="Error al guardar el presupuesto",
            error=str(error),
            code=500
        )