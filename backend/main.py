from fastapi import FastAPI
from models.Mensaje import Mensaje
from models.TicketChat import TicketChat
from models.Usuarios import Usuario
from config.db import Base,engine

# Crear las tablas en MySQL Workbench si no existen
Base.metadata.create_all(bind=engine)

app = FastAPI(title="LiveDesk API")

@app.get('/')
def Bienvenida():
    return{
        'status':'LiveDesk API activa'
    }

