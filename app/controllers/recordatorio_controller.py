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