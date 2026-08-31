from datetime import datetime
from sqlalchemy import Column, BigInteger, String, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.config.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id_usuario = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )

    telefono = Column(
        String(20)
    )

    nombre = Column(
        String(100),
        nullable=False
    )

    correo = Column(
        String(100),
        nullable=False,
        unique=True
    )

    contrasena = Column(
        String(255),
        nullable=False
    )

    fecha_registro = Column(
        TIMESTAMP,
        server_default=func.now(),
        default=datetime.utcnow
    )

    # Relación uno-a-muchos con TipoGasto
    tipos_gasto = relationship(
        "TipoGasto",
        back_populates="usuario",
        cascade="all, delete-orphan"
    )