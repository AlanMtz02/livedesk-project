import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base,sessionmaker

#Cargar las variables de entorno del archivo .env
load_dotenv()

#Obtener la url de la base de datos
DATABASE_URL=os.getenv('DATABASE_URL')

#1.Varible que me permite crear la conexion a la BD
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True, #Verifica conexiones muertas antes de usarlas (evita caídas del pool)
    pool_recycle=3600 # Recicla las conexiones cada hora para que MySQL no las cierre por inactividad)
)

#2.Variable que me permite crear sesiones en la BD
SessionLocal=sessionmaker(bind=engine,autoflush=False,autocommit=False)

#3.Variable que me permite crear tablas MYSQL con clases de Python
Base=declarative_base()

#Funcion que me permite crear una sesion en la BD y al final cerrar dicha sesion
def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()