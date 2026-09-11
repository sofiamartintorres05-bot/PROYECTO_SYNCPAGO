# ==============================================================================
# ARCHIVO COMPLETO: app/controllers/gasto_controller.py
# ==============================================================================
from datetime import datetime
from sqlalchemy import text
from sqlalchemy.orm import Session


# ------------------------------------------------------------------------------
# 1. OBTENER GASTOS DE UN USUARIO ESPECÍFICO (SELECT 3)
# ------------------------------------------------------------------------------
def obtener_gastos_usuario(db: Session, id_usuario: int):
    """
    Consulta todos los recibos pertenecientes a un usuario en la base de datos.
    """
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
        ORDER BY g.fecha_vencimiento ASC;
    """)
    resultado = db.execute(sql, {"id_usuario": id_usuario})
    return [dict(row._mapping) for row in resultado]


# ------------------------------------------------------------------------------
# 2. OBTENER DETALLE DE TODOS LOS GASTOS GLOBALES (SELECT 2)
# ------------------------------------------------------------------------------
def obtener_detalles_todos_gastos(db: Session):
    """
    Consulta el listado general de gastos incluyendo el nombre del usuario propietario.
    """
    sql = text("""
        SELECT 
            g.id_gasto, 
            u.nombre AS usuario, 
            tg.clase, 
            tg.detalle AS categoria, 
            g.precio, 
            g.estado, 
            TO_CHAR(g.fecha_vencimiento, 'YYYY-MM-DD HH24:MI:SS') AS fecha_vencimiento 
        FROM gasto g 
        INNER JOIN tipo_gasto tg ON g.id_tipo = tg.id_tipo 
        INNER JOIN usuarios u ON tg.id_usuario = u.id_usuario 
        ORDER BY g.fecha_vencimiento DESC;
    """)
    resultado = db.execute(sql)
    return [dict(row._mapping) for row in resultado]


# ------------------------------------------------------------------------------
# 3. OBTENER GASTOS POR CLASE CON RESUMEN Y MÉTRICAS (NUEVO FILTRO)
# ------------------------------------------------------------------------------
def obtener_gastos_usuario_por_clase(db: Session, id_usuario: int, clase: str):
    """
    Filtra los recibos de un usuario por clase (ej. 'servicios', 'arriendo'),
    retornando la lista detallada junto con el conteo total y el dinero acumulado.
    """
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


# ------------------------------------------------------------------------------
# 4. CREAR UN NUEVO GASTO (INSERT 4)
# ------------------------------------------------------------------------------
def crear_gasto(db: Session, id_tipo: int, fecha_vencimiento: datetime, precio: float, estado: str):
    """
    Registra un nuevo gasto en la tabla 'gasto' de PostgreSQL.
    """
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
    db.commit()
    return dict(resultado.fetchone()._mapping)


# ------------------------------------------------------------------------------
# 5. ACTUALIZAR ESTADO DE UN GASTO (UPDATE 5)
# ------------------------------------------------------------------------------
def actualizar_estado_gasto(db: Session, id_gasto: int, estado: str):
    """
    Actualiza el estado de un gasto ('pendiente', 'pagado', 'vencido', 'cancelado').
    """
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


# ------------------------------------------------------------------------------
# 6. ELIMINAR UN GASTO ESPECÍFICO (DELETE 6)
# ------------------------------------------------------------------------------
def eliminar_gasto(db: Session, id_gasto: int):
    """
    Elimina físicamente un registro de la tabla 'gasto'.
    """
    sql = text("""
        DELETE FROM gasto 
        WHERE id_gasto = :id_gasto;
    """)
    db.execute(sql, {"id_gasto": id_gasto})
    db.commit()
    return True