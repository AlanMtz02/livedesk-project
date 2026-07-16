from fastapi import APIRouter,Depends,HTTPException
from config.db import get_db
from sqlalchemy.orm import Session
from schemas.Metricas import MetricasOutSchema
from utils.dependencies import obtener_usuario_actual
from models.TicketChat import TicketChat

supervision_router=APIRouter(prefix='/api/supervision',tags=['Supervisión'])

@supervision_router.get('/metricas',response_model=MetricasOutSchema)
def obtener_metricas_dashboard(usuario_actual:dict=Depends(obtener_usuario_actual),db:Session=Depends(get_db)):
    """
    Calcula y retorna los indicadores clave (KPIs) de rendimiento para el dashboard del supervisor.
    PROTEGIDO: Solo accesible para usuarios con rol de 'supervisor'.
    """
    #1. Validar que el usuario tenga un rol de supervisor
    if usuario_actual.get('rol')!='supervisor':
        raise HTTPException(status_code=403,detail='No tienes los privilegios de supervisor necesarios para ver las métricas.')
    
    #2.Realizar las consultas de conteo en MYSQL usando .count()
    tickets_en_espera=db.query(TicketChat).filter(TicketChat.estado=='en_espera').count()
    tickets_activos=db.query(TicketChat).filter(TicketChat.estado=='activo').count()
    tickets_cerrados=db.query(TicketChat).filter(TicketChat.estado=='cerrado').count()
    
    #3.Retornar diccionario que encaja con el schema de salida
    return{
        'tickets_en_espera':tickets_en_espera,
        'tickets_activos':tickets_activos,
        'tickets_cerrados':tickets_cerrados,
    }
