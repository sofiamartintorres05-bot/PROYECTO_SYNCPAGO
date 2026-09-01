# ==============================================================================
# PROYECTO SYNCPAGO - CAPA DE ESQUEMAS DE SEGURIDAD Y AUTH (schemas/auth_schema.py)
# Estándar de Calidad ADSO - SENA | Instructor: Jesús Ropero Barbosa [1]
# ==============================================================================
# PRINCIPIO DE SEGURIDAD Y DISEÑO: "Las credenciales no deben almacenarse en texto plano" [3].
# Este archivo actúa como la aduana de seguridad del backend, validando la 
# estructura, complejidad y formato de las credenciales de los usuarios [3, 4].
# ==============================================================================

from pydantic import BaseModel, Field, field_validator
from typing import Optional
import re

class AuthBase(BaseModel):
    """
    Esquema Base para la información de autenticación de usuarios.
    
    JUSTIFICACIÓN TÉCNICA (SENA - MANTENIBILIDAD & USABILIDAD):
    Establece las reglas básicas del formato del correo electrónico en la frontera [3].
    Evita procesar peticiones en el servicio si el formato del correo es inválido.
    """
    email: str = Field(
        ..., 
        description="Correo electrónico único del usuario. Actúa como identificador de sesión."
    )

    @field_validator('email')
    @classmethod
    def validar_formato_email(cls, v: str) -> str:
        """
        REGLA DE NEGOCIO ACTIVA: El formato del correo electrónico debe ser válido.
        """
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        v_clean = v.lower().strip()
        if not re.match(email_regex, v_clean):
            raise ValueError("Usabilidad: El formato del correo electrónico ingresado no es válido.")
        return v_clean


class UserRegister(AuthBase):
    """
    DTO (Data Transfer Object) para el Registro de Nuevos Usuarios (POST /auth/register).
    
    JUSTIFICACIÓN TÉCNICA (SENA - REQUISITOS NO FUNCIONALES DE SEGURIDAD):
    Obliga a los clientes a registrar contraseñas con un estándar mínimo de complejidad,
    mitigando ataques de fuerza bruta y elevando el estándar de seguridad de la API [3].
    """
    nombre: str = Field(
        ..., 
        min_length=3, 
        max_length=100, 
        description="Nombre completo del usuario que se registrará en el sistema."
    )
    password: str = Field(
        ..., 
        description="Contraseña de acceso. Debe cumplir con políticas de complejidad activa [3]."
    )

    @field_validator('nombre')
    @classmethod
    def validar_nombre_alfabetico(cls, v: str) -> str:
        """
        REGLA DE SEGURIDAD: El nombre de usuario no debe contener caracteres extraños o scripts (XSS).
        """
        v_clean = v.strip()
        # Solo permite letras y espacios
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$', v_clean):
            raise ValueError("Validación: El nombre solo puede contener letras y espacios.")
        return v_clean

    @field_validator('password')
    @classmethod
    def validar_complejidad_password(cls, v: str) -> str:
        """
        REGLA DE NEGOCIO DE SEGURIDAD ACTIVA:
        La contraseña debe tener mínimo 8 caracteres, al menos una mayúscula y un número [3].
        """
        if len(v) < 8:
            raise ValueError("Seguridad: La contraseña debe tener una longitud mínima de 8 caracteres [3].")
        if not any(char.isupper() for char in v):
            raise ValueError("Seguridad: La contraseña debe incluir al menos una letra mayúscula [3].")
        if not any(char.isdigit() for char in v):
            raise ValueError("Seguridad: La contraseña debe incluir al menos un número [3].")
        return v


class UserLogin(AuthBase):
    """
    DTO para el Inicio de Sesión de Usuarios (POST /auth/login).
    Optimizado de forma ligera para no sobrecargar el payload de red.
    """
    password: str = Field(..., description="Contraseña en texto plano para validación contra hash de BD.")


class UserResponse(BaseModel):
    """
    DTO de Salida Seguro para retornar información de usuario tras registro o consulta.
    
    JUSTIFICACIÓN TÉCNICA (SENA - PRINCIPIO DE SEGURIDAD DE LA INFORMACIÓN):
    REGLA DE ORO: Las contraseñas (incluso hasheadas) JAMÁS deben viajar en las 
    respuestas HTTP hacia el cliente [3]. Este esquema filtra activamente los datos, 
    retornando exclusivamente campos públicos y seguros [3, 4].
    """
    id_usuario: int = Field(..., description="Identificador único generado en PostgreSQL.")
    nombre: str = Field(..., description="Nombre registrado del usuario.")
    email: str = Field(..., description="Correo electrónico registrado.")

    class ConfigDict:
        # En Pydantic v2 permite serializar directamente desde objetos ORM (PostgreSQL) [4].
        from_attributes = True


class Token(BaseModel):
    """
    DTO para retornar el token de acceso generado exitosamente (JWT).
    Requerido por el estándar OAuth2 Bearer para la autenticación en el Frontend [5].
    """
    access_token: str = Field(..., description="Token JWT firmado de forma segura por el Backend.")
    token_type: str = Field(default="bearer", description="Esquema de autenticación (por defecto Bearer).")


class TokenPayload(BaseModel):
    """
    DTO para validar el contenido decodificado del JWT en las rutas protegidas.
    Garantiza que el token contenga la identidad válida del usuario en cada petición [3].
    """
    id_usuario: Optional[int] = Field(default=None, description="ID del usuario extraído del payload del token.")