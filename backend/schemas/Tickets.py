from pydantic import BaseModel
from typing import Literal,Optional

class TicketOutSchema(BaseModel):
    id:int
    cliente_nombre:str
    agente_id:Optional[int]=None
    estado:Literal['en_espera','activo','cerrado'] #Estados fijos
    
    
    class Config:
        from_attributes=True

