from datetime import date, datetime
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


# =========================================================
# CREAR O ACTUALIZAR EL PRESUPUESTO DEL MES (UPSERT MANUAL)
# =========================================================
# Regla de negocio: existe un único registro de finanzas por
# usuario y por mes (año-mes de la columna 'fecha').
def registrar_o_actualizar_finanzas(
    db: Session,
    id_usuario: int,
    entrada_dinero: float,
    presupuesto_gastos: float,
    fecha: str = None
):
    fecha_dt = datetime.strptime(fecha, "%Y-%m-%d").date() if fecha else date.today()

    sql_buscar = text("""
        SELECT id_finanza
        FROM finanzas
        WHERE id_usuario = :id_usuario
          AND DATE_TRUNC('month', fecha) = DATE_TRUNC('month', CAST(:fecha AS DATE))
        LIMIT 1;
    """)
    existente = db.execute(sql_buscar, {
        "id_usuario": id_usuario,
        "fecha": fecha_dt
    }).fetchone()

    if existente:
        sql_update = text("""
            UPDATE finanzas
            SET entrada_dinero = :entrada_dinero,
                presupuesto_gastos = :presupuesto_gastos
            WHERE id_finanza = :id_finanza
            RETURNING id_finanza, id_usuario, fecha, entrada_dinero, presupuesto_gastos;
        """)
        resultado = db.execute(sql_update, {
            "entrada_dinero": entrada_dinero,
            "presupuesto_gastos": presupuesto_gastos,
            "id_finanza": existente._mapping["id_finanza"]
        })
    else:
        sql_insert = text("""
            INSERT INTO finanzas (id_usuario, fecha, entrada_dinero, presupuesto_gastos)
            VALUES (:id_usuario, :fecha, :entrada_dinero, :presupuesto_gastos)
            RETURNING id_finanza, id_usuario, fecha, entrada_dinero, presupuesto_gastos;
        """)
        resultado = db.execute(sql_insert, {
            "id_usuario": id_usuario,
            "fecha": fecha_dt,
            "entrada_dinero": entrada_dinero,
            "presupuesto_gastos": presupuesto_gastos
        })

    db.commit()
    return dict(resultado.fetchone()._mapping)