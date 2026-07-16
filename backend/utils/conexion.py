from fastapi import WebSocket
from typing import Dict,List

class ConnectionManager:
    def __init__(self):
        # Estructura:
        # conexiones_activas = {
        #     1: [ws1, ws2],   # Ticket 1 tiene 1 cliente y 1 agente conectados
        #     2: [ws3]         # Ticket 2 tiene un cliente conectado
        # }
        self.conexiones_activas:Dict[int,List[WebSocket]]={}
    
    async def conectar(self,websocket:WebSocket,ticket_id:int):
        """Acepta la conexión y la asocia a una sala de ticket específica."""
        await websocket.accept()
        #Si no esta, crear la key con ticket_id
        if ticket_id not in self.conexiones_activas:
            self.conexiones_activas[ticket_id]=[] #Crea la key con el id del ticket
        
        self.conexiones_activas[ticket_id].append(websocket) #Agrega a la key del id del ticket el valor websocket
    
    async def desconectar(self,websocket:WebSocket,ticket_id:int):
        """Remueve la conexión de la sala al cerrarse el socket."""
        if ticket_id in self.conexiones_activas:
            self.conexiones_activas[ticket_id].remove(websocket) #Remueve el valor de la key del id del ticket 
            
            # Si la sala se queda vacía, limpiamos el diccionario
            if not self.conexiones_activas[ticket_id]:
                del self.conexiones_activas[ticket_id] #Borrar la key del id del ticket
                
    async def enviar_mensaje_a_sala(self,mensaje_json:dict,ticket_id:int):
        """Envía un mensaje únicamente a los participantes de esa sala de chat."""
        if ticket_id in self.conexiones_activas:
            #Iterar sobre cada conexion de la key ticket_id = [w1,w2]
            for conexion in self.conexiones_activas[ticket_id]:
                try:
                    await conexion.send_json(mensaje_json) #Envia el mensaje a dicha conexion
                except Exception:
                    # En caso de que la conexión esté muerta pero no se haya disparado el disconnect
                    pass
        
# Instancia global única (Singleton) para ser compartida en toda la app
manager=ConnectionManager()

    