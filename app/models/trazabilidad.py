from datetime import datetime
from sqlalchemy import Column, BigInteger, String, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from app.config.database import Base

class Trazabilidad(Base):
    __tablename__ = "trazabilidad"

    id_trazabilidad = Column(BigInteger, primary_key=True, autoincrement=True)
    id_gasto = Column(BigInteger, ForeignKey("gasto.id_gasto", onupdate="CASCADE", ondelete="CASCADE"), nullable=False)
    estado = Column(String(20), nullable=False)
    fecha_registro = Column(TIMESTAMP, server_default=func.now(), default=datetime.utcnow)