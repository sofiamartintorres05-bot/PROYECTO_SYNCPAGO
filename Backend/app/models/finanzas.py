from datetime import date
from sqlalchemy import Column, BigInteger, Date, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.config.database import Base

class Finanzas(Base):
    __tablename__ = "finanzas"

    id_finanza = Column(BigInteger, primary_key=True, autoincrement=True)
    id_usuario = Column(BigInteger, ForeignKey("usuarios.id_usuario", onupdate="CASCADE", ondelete="CASCADE"), nullable=False)
    fecha = Column(Date, nullable=False, default=date.today)
    entrada_dinero = Column(Numeric(12, 2), nullable=False, default=0.00)
    presupuesto_gastos = Column(Numeric(12, 2), nullable=False, default=0.00)

    # Relación con Usuario
    usuario = relationship("Usuario")