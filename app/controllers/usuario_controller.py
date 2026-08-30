from sqlalchemy import text
from sqlalchemy.orm import Session


# =========================================================
# OBTENER USUARIO POR ID
# =========================================================

def obtener_usuario(
    db: Session,
    id_usuario: int
):
    sql = text("""
        SELECT
            u.id_usuario,
            u.nombre,
            u.telefono,
            u.correo,
            u.fecha_registro
        FROM usuarios u
        WHERE u.id_usuario = :id_usuario
    """)

    resultado = db.execute(
        sql,
        {
            "id_usuario": id_usuario
        }
    ).first()

    if not resultado:
        return None

    return dict(resultado._mapping)


# =========================================================
# LISTAR TODOS LOS USUARIOS
# =========================================================

def obtener_todos_los_usuarios(
    db: Session
):
    sql = text("""
        SELECT
            u.id_usuario,
            u.nombre,
            u.telefono,
            u.correo,
            u.fecha_registro
        FROM usuarios u
        ORDER BY u.id_usuario ASC
    """)

    resultado = db.execute(sql)

    return [
        dict(row._mapping)
        for row in resultado
    ]