from fastapi import FastAPI
from models.Mensaje import Mensaje
from models.TicketChat import TicketChat
from models.Usuario import Usuario
from config.db import Base,engine
from routes.auth import auth_router
from routes.tickets import ticket_router
from routes.supervision import supervision_router
from fastapi.middleware.cors import CORSMiddleware

# Crear las tablas en MySQL Workbench si no existen
Base.metadata.create_all(bind=engine)

app = FastAPI(title="LiveDesk API")

# Permite  peticiones desde React (Vite corre en 5173 por defecto) o * (cualquier puerto)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Registrar enrutadores
app.include_router(auth_router)
app.include_router(ticket_router)
app.include_router(supervision_router)

@app.get('/')
def Bienvenida():
    return{
        'status':'LiveDesk API activa'
    }

