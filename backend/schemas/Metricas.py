from pydantic import BaseModel

class MetricasOutSchema(BaseModel):
    tickets_en_espera:int
    tickets_activos:int
    tickets_cerrados:int
    
    class Config:
        from_attributes=True
        
        