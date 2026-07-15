from fastapi import APIRouter,Depends,HTTPException
from schemas.Tickets import TicketOutSchema
from config.db import get_db
from sqlalchemy.orm import Session
from utils.dependencies import obtener_usuario_actual
from models.TicketChat import TicketChat
from models.Usuario import Usuario

ticket_router=APIRouter(prefix='/api/tickets',tags=['Gestión de tickets'])

#Endpoint para poder listar los tickets en espera. Se comportara en 'tiempo real' ya que en react constamente estaremos consultado cada 5 segundos aproximadamente
@ticket_router.get('/en-espera',response_model=list[TicketOutSchema])
def obtener_tickets_en_espera(usuario_actual:dict=Depends(obtener_usuario_actual),db:Session=Depends(get_db)):
    """
    Retorna la lista de todos los tickets que están en la sala de espera.
    PROTEGIDO: Requiere token JWT válido (Cualquier agente o supervisor).
    """
    #Obtener tickets que esten 'en_espera'
    tickets=db.query(TicketChat).filter(TicketChat.estado=='en_espera').all()
    return tickets

@ticket_router.post('/{id}/asignar',response_model=TicketOutSchema)
def asignar_ticket(id:int,usuario_actual:dict=Depends(get_db),db:Session=Depends(get_db)):
    """
    Asigna un ticket en espera al agente que realiza la petición.
    PROTEGIDO: Requiere token JWT válido.
    """
    #1.Buscar el ticket en la bd
    ticket=db.query(TicketChat).filter(TicketChat.id==id).first()
    if not ticket:
        raise HTTPException(status_code=404,detail='El ticket solicitado no existe.')
    
    #2.Validar que aun este en espera (que nadie lo haya tomado)
    if ticket.estado!='en_espera':
        raise HTTPException(status_code=400, detail='Este ticket ya ha sido asignado a otro agente o ya está cerrado.')
    
    #3.Obtener el id del agente que va tomar dicho ticket
    agente_id_autenticado=int(usuario_actual.get('sub'))
    
    #4.Actualizar el estado y agente del ticket
    ticket.estado='activo'
    ticket.agente_id=agente_id_autenticado
    db.commit()
    db.refresh(ticket)
    return ticket  
    
    