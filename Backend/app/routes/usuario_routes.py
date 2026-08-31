from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config.database import get_db

from app.controllers.usuario_controller import (
    obtener_usuario,
    obtener_todos_los_usuarios
)

from app.utils.response import (
    response_success,
    response_error
)

router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"]
)



# =========================================================
# LISTAR TODOS LOS USUARIOS
# =========================================================

@router.get("")
def listar_usuarios(
    db: Session = Depends(get_db)
):
    try:
        usuarios = obtener_todos_los_usuarios(db)

        if not usuarios:
            return response_error(
                mensaje="No hay usuarios registrados",
                error="USUARIOS_NOT_FOUND",
                code=404
            )

        # Formatear la fecha_registro de cada usuario para la respuesta JSON
        data = []
        for usuario in usuarios:
            registro = usuario.copy()
            if registro.get("fecha_registro"):
                registro["fecha_registro"] = registro["fecha_registro"].isoformat()
            data.append(registro)

        return response_success(
            mensaje="Lista de usuarios obtenida correctamente",
            data=data,
            code=200
        )

    except Exception as error:
        return response_error(
            mensaje="Error al consultar los usuarios",
            error=str(error),
            code=500
        )
# =========================================================
# OBTENER USUARIO POR ID
# =========================================================

@router.get("/{id_usuario}")
def obtener_usuario_por_id(
    id_usuario: int,
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

        # Formatear la fecha a ISO STRING para JSON
        if usuario.get("fecha_registro"):
            usuario["fecha_registro"] = usuario["fecha_registro"].isoformat()

        return response_success(
            mensaje="Usuario encontrado correctamente",
            data=usuario,
            code=200
        )

    except Exception as error:
        return response_error(
            mensaje="Error al consultar el usuario",
            error=str(error),
            code=500
        )