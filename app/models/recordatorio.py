from sqlalchemy import Column, BigInteger, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.config.database import Base

class Recordatorio(Base):
    __tablename__ = "recordatorio"

    id_recordatorio = Column(BigInteger, primary_key=True, autoincrement=True)
    id_gasto = Column(BigInteger, ForeignKey("gasto.id_gasto", onupdate="CASCADE", ondelete="CASCADE"), nullable=False)
    tiempo_antelacion = Column(Integer, nullable=False, default=120)

    # Relación con Gasto
    gasto = relationship("Gasto")