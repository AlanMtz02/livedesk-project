from fastapi import APIRouter,Depends,WebSocket,WebSocketDisconnect
from config.db import get_db
from models.Mensaje import Mensaje
from models.TicketChat import TicketChat
from utils.conexion import manager
from datetime import datetime,timezone

chat_router=APIRouter(prefix='/ws',tags=['Chat en tiempo real'])

@chat_router.websocket('/ticket/{ticket_id}')
async def websocket_endpoint(ticket_id:int,websocket:WebSocket):
    """
    Ruta de WebSocket para el intercambio de mensajes en tiempo real dentro de un ticket.
    Guarda cada mensaje en MySQL y lo retransmite al instante a la sala.
    """
    
    # 1.Abrir sesion rápida de base de datos únicamente cuando se necesite guardar un mensaje
    db_gen=get_db()
    db=next(db_gen)
    
    #2.Validar que exista el ticket_id antes de aceptar la conexion
    ticket=db.query(TicketChat).filter(TicketChat.id==ticket_id).first()
    if not ticket:
        #Cerrar el socket con codigo de error personalizado si el ticket no existe
        await websocket.close(code=4004)
        return
    
    #3. Conectar al usuario a la sala correspondiente del ticket
    await manager.conectar(websocket,ticket_id)
    
    try:
        while True:
            # Esperar a recibir un mensaje en formato JSON desde el cliente o agente
            # # Formato esperado: { "remitente": "agente"/"cliente", "contenido": "Mensaje de prueba" }
            data=await websocket.receive_json()
            
            # 4. Guardar el mensaje de forma persistente en MySQL usando una sesión limpia
            nuevo_mensaje=Mensaje(
                ticket_id=ticket_id,
                remitente=data.get('remitente'),
                contenido=data.get('contenido')
            )
            db.add(nuevo_mensaje)
            db.commit()
            db.refresh(nuevo_mensaje)
            
            # 4. Estructurar el JSON que se enviará en tiempo real a los participantes de la sala que seran solo agente y cliente
            #creado_at siempre tiene un valor porque en models tiene su default. El else es solo un seguro extra para que en dado caso fuera None (casi imposible), siempre mande una fecha ACTUAL como respaldo
            mensaje_a_enviar = {
                "id": nuevo_mensaje.id,
                "ticket_id": nuevo_mensaje.ticket_id,
                "remitente": nuevo_mensaje.remitente,
                "contenido": nuevo_mensaje.contenido,
                "creado_at": nuevo_mensaje.creado_at.isoformat() if nuevo_mensaje.creado_at else datetime.now(timezone.utc).isoformat()
            }
            
            # 5. Difundir el mensaje únicamente a los conectados a este ticket_id. El manager se encarga de iterar solo sobre las conexiones que estan en la key de ticket_id
            await manager.enviar_mensaje_a_sala(mensaje_a_enviar,ticket_id)
    
        
    #Formas de desconexion limpia
    except WebSocketDisconnect:
        # Gestionar la desconexión limpia del usuario
        manager.desconectar(websocket,ticket_id)
        
    except Exception as e:
        # En caso de cualquier error inesperado, desconectamos el socket para evitar fugas de memoria
        manager.desconectar(websocket,ticket_id)
