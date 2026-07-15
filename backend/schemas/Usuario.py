from pydantic import BaseModel, EmailStr, Field
from typing import Literal,Optional


class UsuarioCreateSchema(BaseModel):
    correo: EmailStr  # Valida formato de email real (ej. nombre@dominio.com)
    password: str = Field(..., min_length=6,
                          description="La contraseña debe tener al menos 6 caracteres")
    rol: Literal['agente', 'supervisor']  # Valores obligatorios


class UsuarioOutSchema(BaseModel):
    id:int
    correo:EmailStr
    rol:str

    # Configuración para que Pydantic pueda leer objetos de SQLAlchemy (ORM)    
    class Config:
        from_attributes = True

class UsuarioUpdateSchema(BaseModel):
    # Todos los campos son opcionales para permitir actualizaciones parciales
    correo: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=6, description="La contraseña debe tener al menos 6 caracteres si se desea cambiar")
    rol: Optional[Literal["agente", "supervisor"]] = None
    
class LoginSchema(BaseModel):
    correo:EmailStr
    password:str
    
class TokenResponseSchema(BaseModel):
    access_token:str
    token_type:str='bearer' #Si estara en el json y por defecto sera bearer
    rol:str
