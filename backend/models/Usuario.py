from config.db import Base
from sqlalchemy import Column,Integer,Enum,String
from sqlalchemy.orm import relationship

class Usuario(Base):
    __tablename__='usuarios'
    
    #---Columnas---
    id=Column(Integer,primary_key=True,index=True)
    correo=Column(String(150),unique=True,nullable=False,index=True)
    password_hashed=Column(String(255),nullable=False)
    rol=Column(Enum('agente','supervisor',name='roles_usuario'),nullable=False) #agente,supervisor  
    
    # Relación lógica: un agente/supervisor puede tener múltiples tickets asignados
    #Apunta a la clase Python y luego al campo
    tickets=relationship('TicketChat',back_populates='agente')
    