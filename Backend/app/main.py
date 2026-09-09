from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config.database import engine, Base, SessionLocal
import app.models

from app.routes.gasto_route import router as gasto_router
from app.routes.usuario_routes import router as usuario_router
from app.routes.recordatorio_routes import router as recordatorio_router
from app.routes.finanzas_routes import router as finanzas_router
from app.routes.trazabilidad_routes import router as trazabilidad_router
from app.routes.tipo_gasto_routes import router as tipo_gasto_router
from app.controllers.gasto_controller import marcar_gastos_vencidos

try:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    print("Conexión exitosa a PostgreSQL")
    Base.metadata.create_all(bind=engine)
except Exception as error:
    print(f"Error de conexión: {error}")

app = FastAPI(
    title="API Control de Gastos (SYNCPAGO)",
    description="API para gestión de usuarios y gastos",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api/v1"

app.include_router(usuario_router, prefix=API_PREFIX)
app.include_router(gasto_router, prefix=API_PREFIX)
app.include_router(recordatorio_router, prefix=API_PREFIX)
app.include_router(finanzas_router, prefix=API_PREFIX)
app.include_router(trazabilidad_router, prefix=API_PREFIX)
app.include_router(tipo_gasto_router, prefix=API_PREFIX)


# =========================================================
# TAREA PROGRAMADA: MARCAR GASTOS VENCIDOS AUTOMÁTICAMENTE
# =========================================================
# Se protege con try/except a propósito: si la librería APScheduler
# no está instalada (por ejemplo, no hay internet en el equipo donde
# se expone), el backend debe seguir arrancando con TODO lo demás
# funcionando normalmente, solo sin esta automatización puntual.
#
# INTERVALO_MINUTOS: se deja corto (15) para poder DEMOSTRARLO en vivo
# durante la sustentación. Para producción real, súbelo por ejemplo a
# 720 (cada 12 horas) una vez pasada la entrega.
INTERVALO_MINUTOS = 15

try:
    from apscheduler.schedulers.background import BackgroundScheduler

    def tarea_marcar_vencidos():
        db = SessionLocal()
        try:
            marcar_gastos_vencidos(db)
            print("Tarea programada: gastos vencidos actualizados")
        except Exception as error:
            print(f"Error en la tarea de gastos vencidos: {error}")
        finally:
            db.close()

    scheduler = BackgroundScheduler()
    scheduler.add_job(
        tarea_marcar_vencidos,
        "interval",
        minutes=INTERVALO_MINUTOS,
        misfire_grace_time=3600,  # tolera hasta 1 hora de retraso antes de saltarse la ejecución
    )
    scheduler.start()
    print(f"Tarea programada activa: gastos vencidos cada {INTERVALO_MINUTOS} minutos")
except ImportError:
    print(
        "APScheduler no está instalado — la actualización automática de "
        "vencidos queda deshabilitada, pero el resto de la API funciona con normalidad. "
        "Instala con: pip install apscheduler"
    )