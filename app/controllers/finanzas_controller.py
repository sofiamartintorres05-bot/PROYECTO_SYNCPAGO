from sqlalchemy import text
from sqlalchemy.orm import Session

def obtener_presupuesto_disponible(db: Session, id_usuario: int):
    sql = text("""
        SELECT f.fecha AS mes, f.entrada_dinero, f.presupuesto_gastos, 
               COALESCE(SUM(g.precio), 0) AS total_gastado, 
               (f.presupuesto_gastos - COALESCE(SUM(g.precio), 0)) AS presupuesto_disponible 
        FROM finanzas f 
        LEFT JOIN tipo_gasto tg ON f.id_usuario = tg.id_usuario 
        LEFT JOIN gasto g ON tg.id_tipo = g.id_tipo AND DATE_TRUNC('month', g.fecha_vencimiento) = DATE_TRUNC('month', f.fecha) 
        WHERE f.id_usuario = :id_usuario 
        GROUP BY f.id_finanza, f.fecha, f.entrada_dinero, f.presupuesto_gastos 
        ORDER BY f.fecha DESC;
    """)
    resultado = db.execute(sql, {"id_usuario": id_usuario})
    return [dict(row._mapping) for row in resultado]