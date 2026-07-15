from config.db import Base
from sqlalchemy import Column,Integer,String,Enum,ForeignKey
from sqlalchemy.orm import relationship

class TicketChat(Base):
    __tablename__='tickets_chat'
    
    #---Columnas---
    id=Column(Integer,primary_key=True,index=True)
    cliente_nombre=Column(String(100),nullable=False)
    #Llave foranea: Un agente pude tener muchos tickets pero un ticket siempre esta asociado a un solo agente y puede ser nulo si el ticket esta en espera y ningun agente lo ha tomado todavia
    # Si un agente(agente_id) es eliminado, este campo agente_id se vuelve NULL en lugar de borrar el ticket.
    agente_id=Column(Integer,ForeignKey('usuarios.id',ondelete='SET NULL'),nullable=True)
    estado=Column(Enum('en_espera','activo','cerrado',name='estados_ticket'),default='en_espera',nullable=False) #Al crearse, tiene un estado de 'en_espera'
    
    #Relacion logicas
    agente=relationship('Usuario',back_populates='tickets')
    # cascade= 'all,delete orphan' -> Si se borra un TicketChat, todos sus mensajes relacionados también se borran (Esta validacion tambien esta en la tabla Mensaje aplicada a la BD)
    mensaje=relationship('Mensaje',back_populates='ticket',cascade='all,delete-orphan')