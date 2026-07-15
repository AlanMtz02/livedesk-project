from fastapi.security import HTTPBearer,HTTPAuthorizationCredentials
from fastapi import Security,HTTPException
from utils.jwt import decodificar_token_acceso
security=HTTPBearer() #Permite leer el header de la peticion

def obtener_usuario_actual(credenciales:HTTPAuthorizationCredentials=Security(security)):
    token=credenciales.credentials #Obtener token
    payload=decodificar_token_acceso(token) #Obtener el diccionario con el que fue creado el token
    if not payload:
        raise HTTPException(status_code=403,detail='Token invalido o expirado.')
    
    return payload
    