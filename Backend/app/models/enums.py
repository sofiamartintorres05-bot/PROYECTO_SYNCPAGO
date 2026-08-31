import enum


class ClaseTipoGasto(str, enum.Enum):
    vital = "vital"
    entretenimiento = "entretenimiento"
    varios = "varios"


class EstadoGasto(str, enum.Enum):
    pendiente = "pendiente"
    pagado = "pagado"
    vencido = "vencido"
    cancelado = "cancelado"