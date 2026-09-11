from sqlalchemy import text
from sqlalchemy.orm import Session
from datetime import datetime

# 1. Obtener gastos de un usuario específico (SELECT 3 de 06_VARIOS)
def obtener_gastos_usuario(db: Session, id_usuario: int):
    sql = text("""
        SELECT g.id_gasto, tg.detalle AS categoria, g.precio, g.estado, g.fecha_vencimiento 
        FROM gasto g 
        INNER JOIN tipo_gasto tg ON g.id_tipo = tg.id_tipo 
        WHERE tg.id_usuario = :id_usuario 
        ORDER BY g.fecha_vencimiento ASC;
    """)
    resultado = db.execute(sql, {"id_usuario": id_usuario})
    return [dict(row._mapping) for row in resultado]

# 2. Obtener todos los gastos con detalles del usuario (SELECT 2 de 06_VARIOS)
def obtener_detalles_todos_gastos(db: Session):
    sql = text("""
        SELECT g.id_gasto, u.nombre AS usuario, tg.clase, tg.detalle AS categoria, g.precio, g.estado, g.fecha_vencimiento 
        FROM gasto g 
        INNER JOIN tipo_gasto tg ON g.id_tipo = tg.id_tipo 
        INNER JOIN usuarios u ON tg.id_usuario = u.id_usuario 
        ORDER BY g.fecha_vencimiento DESC;
    """)
    resultado = db.execute(sql)
    return [dict(row._mapping) for row in resultado]

# 3. Crear un nuevo gasto (INSERT 4 de 06_VARIOS)
def crear_gasto(db: Session, id_tipo: int, fecha_vencimiento: datetime, precio: float, estado: str):
    sql = text("""
        INSERT INTO gasto (id_tipo, fecha_vencimiento, precio, estado) 
        VALUES (:id_tipo, :fecha_vencimiento, :precio, :estado) 
        RETURNING id_gasto, id_tipo, fecha_vencimiento, precio, estado;
    """)
    resultado = db.execute(sql, {
        "id_tipo": id_tipo,
        "fecha_vencimiento": fecha_vencimiento,
        "precio": precio,
        "estado": estado
    })
    db.commit() # Confirmamos la transacción en la BD
    return dict(resultado.fetchone()._mapping)

# 4. Actualizar el estado de un gasto (UPDATE 5 de 06_VARIOS)
def actualizar_estado_gasto(db: Session, id_gasto: int, estado: str):
    sql = text("""
        UPDATE gasto 
        SET estado = :estado 
        WHERE id_gasto = :id_gasto 
        RETURNING id_gasto, estado;
    """)
    resultado = db.execute(sql, {
        "estado": estado,
        "id_gasto": id_gasto
    })
    db.commit()
    fila = resultado.fetchone()
    if fila:
        return dict(fila._mapping)
    return None

# 5. Eliminar un gasto específico (DELETE 6 de 06_VARIOS)
def eliminar_gasto(db: Session, id_gasto: int):
    sql = text("""
        DELETE FROM gasto 
        WHERE id_gasto = :id_gasto;
    """)
    db.execute(sql, {"id_gasto": id_gasto})
    db.commit()
    return True

# =========================================================
# 6. EDITAR UN GASTO EXISTENTE (campos opcionales)
# =========================================================
def actualizar_gasto(
    db: Session,
    id_gasto: int,
    id_tipo: int = None,
    fecha_vencimiento: datetime = None,
    precio: float = None
):
    campos = []
    parametros = {"id_gasto": id_gasto}

    if id_tipo is not None:
        campos.append("id_tipo = :id_tipo")
        parametros["id_tipo"] = id_tipo

    if fecha_vencimiento is not None:
        campos.append("fecha_vencimiento = :fecha_vencimiento")
        parametros["fecha_vencimiento"] = fecha_vencimiento

    if precio is not None:
        campos.append("precio = :precio")
        parametros["precio"] = precio

    if not campos:
        return obtener_gasto_por_id(db, id_gasto)

    sql = text(f"""
        UPDATE gasto
        SET {", ".join(campos)}
        WHERE id_gasto = :id_gasto
        RETURNING id_gasto, id_tipo, fecha_vencimiento, precio, estado;
    """)
    resultado = db.execute(sql, parametros)
    db.commit()
    fila = resultado.fetchone()
    if fila:
        return dict(fila._mapping)
    return None

# =========================================================
# 7. OBTENER UN GASTO POR ID (usado internamente)
# =========================================================
def obtener_gasto_por_id(db: Session, id_gasto: int):
    sql = text("""
        SELECT id_gasto, id_tipo, fecha_vencimiento, precio, estado
        FROM gasto
        WHERE id_gasto = :id_gasto;
    """)
    resultado = db.execute(sql, {"id_gasto": id_gasto})
    fila = resultado.fetchone()
    if fila:
        return dict(fila._mapping)
    return None

# =========================================================
# 8. MARCAR AUTOMÁTICAMENTE LOS GASTOS PENDIENTES VENCIDOS
# =========================================================
# Llama a la función almacenada fn_actualizar_gastos_vencidos()
# (ver BaseDatos/07_FUNCION_VENCIDOS.sql). No escribe SQL de UPDATE
# aquí directamente: delega toda la lógica en la función de PostgreSQL,
# que a su vez dispara el trigger de trazabilidad ya existente.
def marcar_gastos_vencidos(db: Session):
    db.execute(text("SELECT fn_actualizar_gastos_vencidos();"))
    db.commit()
    return True

# ------------------------------------------------------------------------------
# 9. OBTENER GASTOS POR CLASE CON RESUMEN Y MÉTRICAS (NUEVO FILTRO)
# ------------------------------------------------------------------------------
def obtener_gastos_usuario_por_clase(db: Session, id_usuario: int, clase: str):

    sql = text("""
        SELECT
            g.id_gasto,
            tg.clase,
            tg.detalle AS categoria,
            g.precio,
            g.estado,
            TO_CHAR(g.fecha_vencimiento, 'YYYY-MM-DD HH24:MI:SS') AS fecha_vencimiento
        FROM gasto g
        INNER JOIN tipo_gasto tg ON g.id_tipo = tg.id_tipo
        WHERE tg.id_usuario = :id_usuario
          AND tg.clase ILIKE :clase
        ORDER BY g.fecha_vencimiento ASC;
    """)
    resultado = db.execute(sql, {
        "id_usuario": id_usuario,
        "clase": f"%{clase}%"
    })
   
    gastos = [dict(row._mapping) for row in resultado]
   
    # Cálculo de métricas agregadas para las tarjetas del Frontend
    total_recibos = len(gastos)
    monto_acumulado = sum(float(g["precio"]) for g in gastos if g["estado"] != "cancelado")
   
    return {
        "clase": clase,
        "total_recibos": total_recibos,
        "monto_acumulado": round(monto_acumulado, 2),
        "gastos": gastos
    }
