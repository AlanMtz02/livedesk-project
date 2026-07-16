from pydantic import BaseModel
from typing import Literal,Optional
from datetime import datetime

class MensajeOutSchema(BaseModel):
    id:int
    ticket_id:int
    remitente:Literal['agente','cliente']
    contenido:str
    creado_at:datetime
    
    class Config:
        from_attributes=True
    