from sqlalchemy import text
from sqlalchemy.orm import Session

# =========================================================
# OBTENER TODOS LOS USUARIOS
# =========================================================
def obtener_todos_usuarios(db: Session):
    sql = text("""
        SELECT id_usuario, nombre, correo, telefono, fecha_registro 
        FROM usuarios 
        ORDER BY id_usuario ASC;
    """)

    resultado = db.execute(sql)

    return [dict(row._mapping) for row in resultado]


# =========================================================
# OBTENER UN USUARIO POR ID
# =========================================================
def obtener_usuario(db: Session, id_usuario: int):
    sql = text("""
        SELECT id_usuario, nombre, correo, telefono, fecha_registro 
        FROM usuarios 
        WHERE id_usuario = :id_usuario;
    """)

    resultado = db.execute(sql, {"id_usuario": id_usuario})
    fila = resultado.fetchone()

    if fila:
        return dict(fila._mapping)

    return None


# =========================================================
# OBTENER UN USUARIO POR CORREO
# Se obtiene la contraseña para poder compararla
# =========================================================
def obtener_usuario_por_correo(db: Session, correo: str):
    sql = text("""
        SELECT id_usuario, nombre, correo, contrasena, telefono, fecha_registro 
        FROM usuarios 
        WHERE correo = :correo;
    """)

    resultado = db.execute(sql, {"correo": correo})
    fila = resultado.fetchone()

    if fila:
        return dict(fila._mapping)

    return None


# =========================================================
# REGISTRAR UN NUEVO USUARIO
# La contraseña se guarda directamente, SIN HASH
# =========================================================
def registrar_nuevo_usuario(
    db: Session,
    nombre: str,
    correo: str,
    contrasena: str,
    telefono: str = None
):
    sql = text("""
        INSERT INTO usuarios (nombre, correo, contrasena, telefono)
        VALUES (:nombre, :correo, :contrasena, :telefono)
        RETURNING id_usuario, nombre, correo, telefono, fecha_registro;
    """)

    resultado = db.execute(sql, {
        "nombre": nombre,
        "correo": correo,
        "contrasena": contrasena,
        "telefono": telefono
    })

    db.commit()

    usuario_creado = resultado.fetchone()

    if usuario_creado:
        return dict(usuario_creado._mapping)

    return None


# =========================================================
# AUTENTICAR / LOGIN DE USUARIO
# Comparación directa de contraseña
# =========================================================
def autenticar_usuario(db: Session, correo: str, contrasena: str):

    usuario = obtener_usuario_por_correo(db, correo)

    if not usuario:
        return None

    # Comparación directa
    if usuario["contrasena"] != contrasena:
        return None

    # No enviamos la contraseña al frontend
    usuario.pop("contrasena", None)

    return usuario