from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

# Importar motor, Base y modelos
from app.config.database import engine, Base
import app.models  # Carga los modelos para que Base los reconozca

# Importar Routers
from app.routes.gasto_route import router as gasto_router
from app.routes.usuario_routes import router as usuario_router
from app.routes.recordatorio_routes import router as recordatorio_router
from app.routes.finanzas_routes import router as finanzas_router
from app.routes.trazabilidad_routes import router as trazabilidad_router
from app.routes.tipo_gasto_routes import router as tipo_gasto_router


# =========================================================
# CREACIÓN DE TABLAS Y PRUEBA DE CONEXIÓN
# =========================================================

try:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    print("Conexión exitosa a PostgreSQL")
    
    # Crea las tablas definidas en los modelos si aún no existen
    Base.metadata.create_all(bind=engine)
except Exception as error:
    print(f"Error de conexión: {error}")


# =========================================================
# CREAR APLICACIÓN FASTAPI
# =========================================================

app = FastAPI(
    title="API Control de Gastos (SYNCPAGO)",
    description="API para gestión de usuarios y gastos",
    version="1.0.0"
)


# =========================================================
# CONFIGURACIÓN DE CORS
# =========================================================

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




# =========================================================
# REGISTRO DE RUTAS
# =========================================================

API_PREFIX = "/api/v1"



# Registrar los de antes
app.include_router(
    usuario_router, 
    prefix=API_PREFIX 
)

app.include_router( 
    gasto_router, 
    prefix=API_PREFIX 
)

# ¡AGREGAR ESTAS TRES LÍNEAS NUEVAS!
app.include_router( 
    recordatorio_router, 
    prefix=API_PREFIX 
)
app.include_router( 
    finanzas_router, 
    prefix=API_PREFIX 
)
app.include_router( 
    trazabilidad_router, 
    prefix=API_PREFIX 
)

# Router de categorías (tipo_gasto)
app.include_router(
    tipo_gasto_router,
    prefix=API_PREFIX
)


# =========================================================
# ENDPOINT PRINCIPAL (HOME)
# =========================================================

@app.get("/")
def inicio():
    return {
        "status": True,
        "mensaje": "API funcionando correctamente",
        "data": {
            "version": "v1",
            "api": "/api/v1"
        },
        "error": None,
        "code": 200
    }