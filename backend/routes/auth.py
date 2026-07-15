from fastapi import APIRouter,Depends,HTTPException,status
from config.db import get_db
from sqlalchemy.orm import Session
from schemas.Usuario import UsuarioUpdateSchema,UsuarioCreateSchema,UsuarioOutSchema,LoginSchema,TokenResponseSchema
from models.Usuario import Usuario
from utils.seguridad import generar_hash_password,verificar_password
from utils.jwt import crear_token_acceso,decodificar_token_acceso
from utils.dependencies import obtener_usuario_actual

auth_router=APIRouter(prefix='/api/auth',tags=['Autenticación'])

#Necesita token y solo el supervisor puede crear agentes
@auth_router.post('/register',response_model=UsuarioOutSchema,status_code=status.HTTP_201_CREATED)
def registrar_usuario(datos:UsuarioCreateSchema,usuario_actual:dict=Depends(obtener_usuario_actual),db:Session=Depends(get_db)):
    """
    Registra un nuevo usuario en el sistema.
    PROTEGIDO: Solo un supervisor autenticado puede registrar nuevos usuarios.
    """
    #Validar que tenga un rol de supervisor
    if usuario_actual.get('rol')!='supervisor':
        raise HTTPException(status_code=403,detail='No tienes permisos de supervisor para registrar nuevos usuarios.')
    
    #Si el correo esta registrado ya, mandar httpexception
    usuario_existente=db.query(Usuario).filter(Usuario.correo==datos.correo).first()
    if usuario_existente:
        raise HTTPException(status_code=400, detail='El correo ya esta registrado.')
    
    #Encriptar contraseña
    hashed_password=generar_hash_password(datos.password)
    #Crear el registro en MYSQL con la contraseña hasheada
    nuevo_usuario=Usuario(correo=datos.correo,password_hashed=hashed_password,rol=datos.rol)
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario

@auth_router.post('/login',response_model=TokenResponseSchema)
def login_usuario(datos:LoginSchema,db:Session=Depends(get_db)):
    """
    Inicia sesión verificando las credenciales contra la base de datos.
    Si son correctas, emite un token JWT firmado.
    """
    #Buscar el usuario por correo
    usuario=db.query(Usuario).filter(Usuario.correo==datos.correo).first()
    if not usuario:
        raise HTTPException(status_code=401,detail='Credenciales incorrectas.')
    
    #Validar que la contraseña ingresada es correcta contra la hasheada
    password_valido=verificar_password(datos.password,usuario.password_hashed)
    if not password_valido:
        raise HTTPException(status_code=401,detail='Credenciales incorrectas.')
    
    #Preparar el diccionario para crear el token
    payload={
        'sub':str(usuario.id),
        'correo':usuario.correo,
        'rol':usuario.rol,
    }
    
    #Generar el token a partir del diccionario
    token=crear_token_acceso(payload)
    return{
        'access_token':token,
        'token_type':'bearer',
        'rol':usuario.rol,
    }
    