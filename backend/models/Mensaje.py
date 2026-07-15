from config.db import Base
from sqlalchemy import Column,Integer,String,ForeignKey,Enum,DateTime
from datetime import datetime,timezone
from sqlalchemy.orm import relationship

class Mensaje(Base):
    __tablename__='mensajes'
    
    #---Columnas---
    id=Column(Integer,primary_key=True,index=True)
    #Un ticket puede tener muchos mensajes pero un mensaje siempre pertenece a un ticket
    #Si se borra un ticket (ticket_id), todos los mensajes asociados a ese ticket se eliminan automaticamente
    ticket_id=Column(Integer,ForeignKey('tickets_chat.id',ondelete='CASCADE'),nullable=False)
    remitente=Column(Enum('agente','cliente',name='remitentes_mensaje'),nullable=False)
    contenido=Column(String(1000),nullable=False)
    creado_at=Column(DateTime,default=datetime.now(timezone.utc),nullable=False) #Toma la fecha y hora de cuando se creo
    
    #Relacion logica
    ticket=relationship('TicketChat',back_populates='mensaje')
    