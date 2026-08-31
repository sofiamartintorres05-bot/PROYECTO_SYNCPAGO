from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.controllers.usuario_controller import (
    registrar_nuevo_usuario, 
    autenticar_usuario,
    obtener_todos_usuarios,
    obtener_usuario
)
from app.utils.response import response_success, response_error

router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"]
)

# =========================================================
# 1. ENDPOINT PARA REGISTRAR USUARIOS
# =========================================================
@router.post("/registro")
def registrar_usuario(
    nombre: str,
    correo: str,
    contrasena: str,
    telefono: str = None,
    db: Session = Depends(get_db)
):
    try:
        nuevo_usuario = registrar_nuevo_usuario(
            db=db,
            nombre=nombre,
            correo=correo,
            contrasena=contrasena,
            telefono=telefono
        )
        return response_success(
            mensaje="Usuario registrado exitosamente con contraseña protegida",
            data=nuevo_usuario,
            code=201
        )
    except Exception as error:
        if "unique constraint" in str(error).lower() or "correo" in str(error).lower():
            return response_error(
                mensaje="El correo electrónico ya se encuentra registrado",
                error="EMAIL_ALREADY_EXISTS",
                code=400
            )
        return response_error(
            mensaje="Error al registrar el usuario",
            error=str(error),
            code=500
        )

# =========================================================
# 2. ENDPOINT PARA INICIAR SESIÓN (LOGIN)
# =========================================================
@router.post("/login")
def login_usuario(
    correo: str,
    contrasena: str,
    db: Session = Depends(get_db)
):
    try:
        usuario_autenticado = autenticar_usuario(db, correo, contrasena)
        
        if not usuario_autenticado:
            return response_error(
                mensaje="Credenciales incorrectas (correo o contraseña no válidos)",
                error="INVALID_CREDENTIALS",
                code=401
            )
            
        return response_success(
            mensaje="Inicio de sesión exitoso",
            data=usuario_autenticado,
            code=200
        )
    except Exception as error:
        return response_error(
            mensaje="Error al intentar iniciar sesión",
            error=str(error),
            code=500
        )

# =========================================================
# 3. ENDPOINT PARA LISTAR TODOS LOS USUARIOS
# =========================================================
@router.get("/")
def listar_usuarios(db: Session = Depends(get_db)):
    try:
        usuarios = obtener_todos_usuarios(db)
        return response_success(
            mensaje="Listado de usuarios obtenido con éxito",
            data=usuarios,
            code=200
        )
    except Exception as error:
        return response_error(
            mensaje="Error al listar los usuarios",
            error=str(error),
            code=500
        )

# =========================================================
# 4. ENDPOINT PARA OBTENER UN USUARIO POR ID
# =========================================================
@router.get("/{id_usuario}")
def buscar_usuario(id_usuario: int, db: Session = Depends(get_db)):
    try:
        usuario = obtener_usuario(db, id_usuario)
        if not usuario:
            return response_error(
                mensaje="El usuario solicitado no existe",
                error="USER_NOT_FOUND",
                code=404
            )
        return response_success(
            mensaje="Información del usuario obtenida con éxito",
            data=usuario,
            code=200
        )
    except Exception as error:
        return response_error(
            mensaje="Error al obtener la información del usuario",
            error=str(error),
            code=500
        )