from fastapi import APIRouter,Depends,HTTPException
from schemas.Tickets import TicketOutSchema
from schemas.Mensajes import MensajeOutSchema
from config.db import get_db
from sqlalchemy.orm import Session
from utils.dependencies import obtener_usuario_actual
from models.TicketChat import TicketChat
from models.Usuario import Usuario
from models.Mensaje import Mensaje

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
    
    
@ticket_router.get('/mis-activos',response_model=list[TicketOutSchema])
def obtener_mis_tickets_activos(usuario_actual:dict=Depends(get_db),db:Session=Depends(get_db)):
    """
    Retorna la lista de los tickets que están siendo atendidos actualmente por el agente autenticado.
    PROTEGIDO: Requiere token JWT válido.
    """
    agente_id_autenticado=int(usuario_actual.get('sub'))
    # Filtrar en MySQL por el ID del agente y que el estado sea estrictamente 'activo'
    tickets_activos=db.query(TicketChat).filter(TicketChat.agente_id==agente_id_autenticado,TicketChat.estado=='activo').all()
    return tickets_activos

@ticket_router.patch('/{id}/cerrar',response_model=TicketOutSchema)
def cerrar_ticket(id:int,usuario_actual:dict=Depends(obtener_usuario_actual),db:Session=Depends(get_db)):
    """
    Cierra un ticket de chat activo.
    PROTEGIDO: Requiere token JWT válido.
    """
    #1.Buscar el ticket por ID
    ticket=db.query(TicketChat).filter(TicketChat.id==id).first()
    if not ticket:
        raise HTTPException(status_code=404,detail='El ticket solicitado no existe.')
    
    #2.Validar que el ticket no este cerrado
    if ticket.estado=='cerrado':
        raise HTTPException(status_code=400,detail='El estado del ticket ya esta cerrado.')
    
    # 3. Validar que el agente que lo cierra sea el dueño del ticket o que si al menos no es es el dueño, quien lo esta cerrando (el que esta logueado) es un supervisor
    agente_id_autenticado=int(usuario_actual.get('sub'))
    rol_autenticado=str(usuario_actual.get('rol'))
    if ticket.agente_id!=agente_id_autenticado and rol_autenticado!='supervisor':
        raise HTTPException(status_code=400, detail='No tienes permisos para cerrar un ticket asignado a otro agente.')
    
    #4.Actualizar el estado del ticket
    ticket.estado='cerrado'
    db.commit()
    db.refresh(ticket)
    return ticket

@ticket_router.get('/{id}/mensajes',response_model=list[MensajeOutSchema])
def obtener_historial_mensajes(id:int,usuario_actual:dict=Depends(obtener_usuario_actual),db:Session=Depends(get_db)):
    """
    Retorna todo el historial de mensajes de un ticket específico ordenado de forma ascendente (Primero los mas antiguos).
    PROTEGIDO: Requiere token JWT válido.
    """
    #1.Validar que el ticket exista
    ticket=db.query(TicketChat).filter(TicketChat==id).first()
    if not ticket:
        raise HTTPException(status_code=404,detail='El ticket solicitado no existe.')
    
    #2.Consultar y ordenar los mensajes del mas antiguo al mas reciente
    mensajes=db.query(Mensaje).filter(Mensaje.ticket_id==id).order_by(Mensaje.creado_at.asc()).all()
    
    return mensajes
    
