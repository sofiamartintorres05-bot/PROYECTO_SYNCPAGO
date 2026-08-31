from datetime import datetime
from sqlalchemy import Column, BigInteger, Numeric, TIMESTAMP, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.config.database import Base
from app.models.enums import EstadoGasto


class Gasto(Base):
    __tablename__ = "gasto"

    id_gasto = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )

    id_tipo = Column(
        BigInteger,
        ForeignKey("tipo_gasto.id_tipo", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False
    )

    fecha_vencimiento = Column(
        TIMESTAMP,
        nullable=False
    )

    precio = Column(
        Numeric(12, 2),
        nullable=False
    )

    estado = Column(
        Enum(EstadoGasto, name="estado_gasto_enum", native_enum=False),
        default=EstadoGasto.pendiente,
        server_default="pendiente"
    )

    fecha_registro = Column(
        TIMESTAMP,
        server_default=func.now(),
        default=datetime.utcnow
    )

    # Relaciones
    tipo_gasto = relationship(
        "TipoGasto",
        back_populates="gastos"
    )