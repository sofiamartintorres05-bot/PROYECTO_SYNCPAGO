# ==============================================================================
# PROYECTO SYNCPAGO - CAPA DE ESQUEMAS DE VALIDACIÓN (schemas/pago_schema.py)
# Estándar de Calidad ADSO - SENA | Instructor: Jesús Ropero Barbosa [1]
# ==============================================================================
# PRINCIPIO DE TRAZABILIDAD: "Cada decisión de desarrollo debe poder rastrearse
# hasta una necesidad del proyecto" [2]. Este archivo no es solo código; es la
# barrera analítica que garantiza la integridad y seguridad de los datos [3].
# ==============================================================================

from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional

class PagoBase(BaseModel):
    """
    Esquema Base para la entidad Pago / Gasto.
    Define la estructura core requerida para la persistencia de datos [4].
    
    JUSTIFICACIÓN TÉCNICA (SENA - MANTENIBILIDAD & RENDIMIENTO):
    La tipación estricta (int, datetime, float) actúa como un validador estático síncrono.
    Esto cumple con el requisito no funcional de Mantenibilidad (organización de código)
    y evita sobrecargar la base de datos PostgreSQL con datos mal formateados [3].
    """
    id_tipo: int = Field(
        ..., 
        description="Identificador del tipo de gasto (FK a tabla tipo_gasto). "
                    "Esencial para mantener la integridad referencial en BD [5]."
    )
    fecha_vencimiento: datetime = Field(
        ..., 
        description="Fecha y hora exacta límite para realizar el pago. "
                    "Base para el cálculo de alertas y recordatorios de usuario."
    )
    precio: float = Field(
        ..., 
        description="Monto financiero asignado al gasto."
    )
    estado: str = Field(
        default="pendiente", 
        description="Estado actual del gasto. Restringido por negocio a 'pendiente' o 'pagado'."
    )

    # ----------------------------------------------------------------------
    # VALIDADORES DE REGLAS DE NEGOCIO (BACKEND)
    # ----------------------------------------------------------------------
    # El instructor Jesús Ropero Barbosa exige: "El aprendiz debe poder explicar:
    # 'Este código implementa esta regla de negocio'" [6].
    
    @field_validator('precio')
    @classmethod
    def validar_precio_positivo(cls, v: float) -> float:
        """
        REGLA DE NEGOCIO ACTIVA: El precio de un gasto debe ser estrictamente positivo.
        
        JUSTIFICACIÓN TÉCNICA (SENA - USABILIDAD):
        Si el frontend envía un monto negativo (por ejemplo, por un error de tipeo), \n        el backend intercepta la petición aquí, detiene el proceso y devuelve un error 
        estructurado '422 Unprocessable Entity' con un mensaje claro al usuario [3].
        """
        if v <= 0:
            raise ValueError("Regla de Negocio: El precio del gasto debe ser un monto estrictamente mayor a cero (0.00).")
        return round(v, 2)  # Redondeo controlado a 2 decimales para precisión financiera.

    @field_validator('estado')
    @classmethod
    def validar_estado_permitido(cls, v: str) -> str:
        """
        REGLA DE NEGOCIO ACTIVA: Un gasto solo puede transicionar entre estados válidos.
        
        JUSTIFICACIÓN TÉCNICA (SENA - SEGURIDAD Y CONSISTENCIA):
        Evita la inyección de estados inválidos no contemplados en el flujo de procesos [3].
        """
        estados_validos = {"pendiente", "pagado"}
        v_clean = v.lower().strip()
        if v_clean not in estados_validos:
            raise ValueError(f"Consistencia: El estado '{v}' no es permitido. Debe ser uno de: {', '.join(estados_validos)}")
        return v_clean


class PagoCreate(PagoBase):
    """
    DTO (Data Transfer Object) para la creación de un nuevo Pago/Gasto (POST /gastos/).
    
    JUSTIFICACIÓN TÉCNICA (SENA - CONEXIÓN CON SQL #4):
    Este esquema recibe los datos de entrada para la Consulta SQL #4 (INSERT INTO gasto).
    Nota de automatización: El trigger físico en PostgreSQL se activa inmediatamente 
    después de este insert para crear la trazabilidad y el recordatorio [7].
    """
    pass


class PagoResponse(PagoBase):
    """
    DTO para respuestas estándar individuales tras creación o modificación de un gasto.
    """
    id_gasto: int = Field(
        ..., 
        description="Identificador único autoincremental (PK) generado por PostgreSQL."
    )

    class ConfigDict:
        # En Pydantic v2, reemplaza el antiguo 'class Config: orm_mode = True'.
        # Permite leer datos directamente desde modelos relacionales (ORM) u objetos de BD.
        from_attributes = True


class PagoDetalle(BaseModel):
    """
    DTO Complejo para el mapeo de consultas relacionales enriquecidas (INNER JOINs).
    
    JUSTIFICACIÓN TÉCNICA (SENA - RENDIMIENTO):
    Este esquema de salida mapea exactamente los campos requeridos por las vistas,
    evitando la transferencia innecesaria de datos redundantes a través del canal [3].
    
    CONEXIÓN DIRECTA CON CONSULTAS SQL #2 Y #3:
    - SQL (2): Obtiene todos los gastos detallando el nombre de usuario y categoría.
    - SQL (3): Filtra gastos por usuario específico ordenados ascendentemente.
    """
    id_gasto: int
    usuario: str = Field(..., description="Nombre del usuario (obtenido vía INNER JOIN de la tabla usuarios) [Consulta SQL #2]")
    clase: str = Field(..., description="Clase de gasto (fijo / variable) desde la tabla tipo_gasto [Consulta SQL #2]")
    categoria: str = Field(..., description="Categoría detallada del gasto (ej. Servicios, Arriendo) [Consulta SQL #2, #3]")
    precio: float
    estado: str
    fecha_vencimiento: datetime

    class ConfigDict:
        from_attributes = True


class PagoEstadoUpdate(BaseModel):
    """
    DTO Ligero para actualizaciones parciales del estado de un gasto (PATCH /gastos/{id_gasto}/estado).
    
    JUSTIFICACIÓN TÉCNICA (SENA - PRINCIPIO DE RESPONSABILIDAD ÚNICA):
    En lugar de enviar todo el objeto en un PUT, enviamos únicamente el campo a modificar.
    Esto reduce el tráfico de red (Rendimiento) y protege el resto de columnas de modificaciones maliciosas (Seguridad) [3, 8].
    
    CONEXIÓN DIRECTA CON CONSULTA SQL #5:
    - SQL (5): UPDATE gasto SET estado = 'pagado' WHERE id_gasto = 1;
    """
    estado: str = Field(..., description="Nuevo estado a aplicar al gasto ('pendiente' o 'pagado')")

    @field_validator('estado')
    @classmethod
    def validar_estado_parcial(cls, v: str) -> str:
        estados_validos = {"pendiente", "pagado"}
        v_clean = v.lower().strip()
        if v_clean not in estados_validos:
            raise ValueError(f"Solo se permite actualizar el estado a: {', '.join(estados_validos)}")
        return v_clean