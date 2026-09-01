from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.controllers.tipo_gasto_controller import (
    obtener_categorias_usuario,
    crear_categoria
)
from app.controllers.usuario_controller import obtener_usuario
from app.utils.response import response_success, response_error

router = APIRouter(
    prefix="/tipo-gasto",
    tags=["Categorías"]
)

# =========================================================
# 1. LISTAR CATEGORÍAS DE UN USUARIO
# =========================================================
@router.get("/usuario/{id_usuario}")
def listar_categorias(id_usuario: int, db: Session = Depends(get_db)):
    try:
        usuario = obtener_usuario(db, id_usuario)
        if not usuario:
            return response_error(
                mensaje="El usuario no existe",
                error="USUARIO_NOT_FOUND",
                code=404
            )
        categorias = obtener_categorias_usuario(db, id_usuario)
        return response_success(
            mensaje="Categorías del usuario obtenidas con éxito",
            data=categorias,
            code=200
        )
    except Exception as error:
        return response_error(
            mensaje="Error al listar las categorías",
            error=str(error),
            code=500
        )

# =========================================================
# 2. CREAR UNA NUEVA CATEGORÍA
# =========================================================
@router.post("/")
def registrar_categoria(
    id_usuario: int,
    detalle: str,
    clase: str = None,
    db: Session = Depends(get_db)
):
    try:
        usuario = obtener_usuario(db, id_usuario)
        if not usuario:
            return response_error(
                mensaje="El usuario no existe",
                error="USUARIO_NOT_FOUND",
                code=404
            )
        nueva = crear_categoria(db, id_usuario, detalle, clase)
        return response_success(
            mensaje="Categoría creada con éxito",
            data=nueva,
            code=201
        )
    except ValueError as error:
        return response_error(
            mensaje="Datos inválidos para crear la categoría",
            error=str(error),
            code=422
        )
    except Exception as error:
        return response_error(
            mensaje="Error al crear la categoría",
            error=str(error),
            code=500
        )