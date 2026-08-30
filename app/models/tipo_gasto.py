from sqlalchemy import Column, BigInteger, String, ForeignKey, Enum
from sqlalchemy.orm import relationship

from app.config.database import Base
from app.models.enums import ClaseTipoGasto


class TipoGasto(Base):
    __tablename__ = "tipo_gasto"

    id_tipo = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )

    id_usuario = Column(
        BigInteger,
        ForeignKey("usuarios.id_usuario", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False
    )

    clase = Column(
        Enum(ClaseTipoGasto, name="clase_tipo_gasto_enum", native_enum=False),
        nullable=True
    )

    detalle = Column(
        String(150),
        nullable=False
    )

    # Relaciones
    usuario = relationship(
        "Usuario",
        back_populates="tipos_gasto"
    )

    gastos = relationship(
        "Gasto",
        back_populates="tipo_gasto",
        cascade="all, delete-orphan"
    )