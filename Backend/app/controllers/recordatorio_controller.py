from sqlalchemy import text
from sqlalchemy.orm import Session

def obtener_alertas_recordatorios(db: Session):
    sql = text("""
        SELECT u.nombre AS usuario, tg.detalle AS gasto, g.fecha_vencimiento, 
               r.tiempo_antelacion AS minutos_antes, 
               (g.fecha_vencimiento - (r.tiempo_antelacion || ' minutes')::INTERVAL) AS fecha_notificacion 
        FROM recordatorio r 
        INNER JOIN gasto g ON r.id_gasto = g.id_gasto 
        INNER JOIN tipo_gasto tg ON g.id_tipo = tg.id_tipo 
        INNER JOIN usuarios u ON tg.id_usuario = u.id_usuario 
        WHERE g.estado = 'pendiente' 
        ORDER BY fecha_notificacion ASC;
    """)
    resultado = db.execute(sql)
    return [dict(row._mapping) for row in resultado]

def obtener_recordatorio_por_gasto(db: Session, id_gasto: int):
    sql = text("""
        SELECT id_recordatorio, id_gasto, tiempo_antelacion
        FROM recordatorio
        WHERE id_gasto = :id_gasto
        ORDER BY id_recordatorio DESC
        LIMIT 1;
    """)
    resultado = db.execute(sql, {"id_gasto": id_gasto})
    fila = resultado.fetchone()
    if fila:
        return dict(fila._mapping)
    return None

def actualizar_tiempo_antelacion(db: Session, id_gasto: int, tiempo_antelacion: int):
    sql = text("""
        UPDATE recordatorio
        SET tiempo_antelacion = :tiempo_antelacion
        WHERE id_recordatorio = (
            SELECT id_recordatorio
            FROM recordatorio
            WHERE id_gasto = :id_gasto
            ORDER BY id_recordatorio DESC
            LIMIT 1
        )
        RETURNING id_recordatorio, id_gasto, tiempo_antelacion;
    """)
    resultado = db.execute(sql, {
        "tiempo_antelacion": tiempo_antelacion,
        "id_gasto": id_gasto
    })
    db.commit()
    fila = resultado.fetchone()
    if fila:
        return dict(fila._mapping)
    return None

# =========================================================
# TODOS LOS RECORDATORIOS DE UN USUARIO EN UNA SOLA CONSULTA
# =========================================================
# Evita el N+1 (una petición por gasto) que hacía el frontend antes:
# ahora trae de una vez el tiempo_antelacion de cada gasto del usuario.
def obtener_recordatorios_usuario(db: Session, id_usuario: int):
    sql = text("""
        SELECT r.id_recordatorio, r.id_gasto, r.tiempo_antelacion
        FROM recordatorio r
        INNER JOIN gasto g ON r.id_gasto = g.id_gasto
        INNER JOIN tipo_gasto tg ON g.id_tipo = tg.id_tipo
        WHERE tg.id_usuario = :id_usuario
        ORDER BY r.id_gasto ASC, r.id_recordatorio DESC;
    """)
    resultado = db.execute(sql, {"id_usuario": id_usuario})
    filas = [dict(row._mapping) for row in resultado]

    # Si algún gasto llegara a tener más de un recordatorio, nos quedamos
    # con el más reciente por id_gasto (el ORDER BY ya deja ese primero).
    por_gasto = {}
    for fila in filas:
        if fila["id_gasto"] not in por_gasto:
            por_gasto[fila["id_gasto"]] = fila
    return list(por_gasto.values())