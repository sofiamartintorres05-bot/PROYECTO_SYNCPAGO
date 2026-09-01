from sqlalchemy import text
from sqlalchemy.orm import Session

CLASES_VALIDAS = {"vital", "entretenimiento", "varios"}

# =========================================================
# LISTAR CATEGORÍAS (TIPOS DE GASTO) DE UN USUARIO
# =========================================================
def obtener_categorias_usuario(db: Session, id_usuario: int):
    sql = text("""
        SELECT id_tipo, id_usuario, clase, detalle
        FROM tipo_gasto
        WHERE id_usuario = :id_usuario
        ORDER BY detalle ASC;
    """)
    resultado = db.execute(sql, {"id_usuario": id_usuario})
    return [dict(row._mapping) for row in resultado]

# =========================================================
# CREAR UNA NUEVA CATEGORÍA (TIPO DE GASTO)
# =========================================================
def crear_categoria(db: Session, id_usuario: int, detalle: str, clase: str = None):
    if clase is not None and clase not in CLASES_VALIDAS:
        raise ValueError(
            f"La clase '{clase}' no es válida. Debe ser una de: {', '.join(CLASES_VALIDAS)}"
        )

    sql = text("""
        INSERT INTO tipo_gasto (id_usuario, clase, detalle)
        VALUES (:id_usuario, :clase, :detalle)
        RETURNING id_tipo, id_usuario, clase, detalle;
    """)
    resultado = db.execute(sql, {
        "id_usuario": id_usuario,
        "clase": clase,
        "detalle": detalle
    })
    db.commit()
    return dict(resultado.fetchone()._mapping)