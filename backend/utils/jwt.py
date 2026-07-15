import os
from dotenv import load_dotenv
from datetime import datetime,timezone,timedelta
from jose import jwt,JWTError
from typing import Optional

#Cargar .env
load_dotenv()

#Utilizar valor por defecto
SECRET_KEY = os.getenv('SECRET_KEY','MI_CLAVE_SECRETA_SUPER_SEGURA_PARA_LIVEDESK_2026')
ALGORITHM='HS256'
ACCESS_TOKEN_EXPIRE_MINUTES=60 #El token dura 1 hora activo

def crear_token_acceso(payload:dict)->str:
    """
    Genera un JSON Web Token firmado.
    Recibe un diccionario con los datos del usuario (payload).
    """
    to_encode=payload.copy() #Copiar el diccionario que llega en una nueva variable
    tiempo_expiracion=datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)#Añadir la fecha de expiracion al diccionario
    to_encode.update({
        'exp':tiempo_expiracion
    })
    
    #Crear el token a partir del diccionario  to_encode usando el algoritmo HS256
    token=jwt.encode(to_encode,SECRET_KEY,algorithm=ALGORITHM)
    return token

def decodificar_token_acceso(token:str)->Optional[dict]:
    """
    Verifica la autenticidad y vigencia de un token.
    Devuelve el diccionario con los datos si es válido, o None si expiró o fue alterado.
    """
    try:
        #Intenta decodificar el token para obtener el diccionario con el que fue creado
        payload=jwt.decode(token,SECRET_KEY,algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
    
    