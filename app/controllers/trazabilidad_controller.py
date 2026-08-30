from sqlalchemy import text
from sqlalchemy.orm import Session

def obtener_historial_gasto(db: Session, id_gasto: int):
    sql = text("""
        SELECT t.estado AS estado_registrado, 
               TO_CHAR(t.fecha_registro, 'YYYY-MM-DD HH24:MI:SS') AS fecha_cambio 
        FROM trazabilidad t 
        WHERE t.id_gasto = :id_gasto 
        ORDER BY t.fecha_registro DESC;
    """)
    resultado = db.execute(sql, {"id_gasto": id_gasto})
    return [dict(row._mapping) for row in resultado]