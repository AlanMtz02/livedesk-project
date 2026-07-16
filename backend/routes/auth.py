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


@auth_router.get('/agentes', response_model=list[UsuarioOutSchema])
def listar_agentes(usuario_actual: dict = Depends(obtener_usuario_actual), db: Session = Depends(get_db)):
    """
    Retorna la lista de todos los usuarios con rol de 'agente' en el sistema.
    PROTEGIDO: Solo accesible para el rol de 'supervisor'.
    """
    #Validar que quien consulta sea un supervisor
    if usuario_actual.get('rol') != 'supervisor':
        raise HTTPException(
            status_code=403, detail='No tienes permisos de supervisor para consultar la lista de agentes.')

    #Listar los usuarios con el rol agente
    agentes = db.query(Usuario).filter(Usuario.rol == 'agente').all()
    return agentes


@auth_router.delete('/agentes/{id}', status_code=status.HTTP_200_OK)
def eliminar_agente(id: int, usuario_actual: dict = Depends(obtener_usuario_actual), db: Session = Depends(get_db)):
    """
    Elimina un agente de la base de datos por su ID.
    PROTEGIDO: Solo accesible para el rol de 'supervisor'.
    """
    # 1. Validar que sea un supervisor
    if usuario_actual.get('rol') != 'supervisor':
        raise HTTPException(
            status_code=403, detail='No tienes permisos de supervisor para eliminar usuarios.')

    # 2. Evitar que el supervisor se elimine a sí mismo
    supervisor_id = int(usuario_actual.get('sub'))
    if id == supervisor_id:
        raise HTTPException(
            status_code=400, detail='Operación inválida: Un supervisor no puede eliminarse a sí mismo del sistema.')

    # 3. Validar que exista el agente
    agente = db.query(Usuario).filter(Usuario.id == id).first()
    if not agente:
        raise HTTPException(
            status_code=404, detail='El agente solicitado no existe.')

    # 4. Validar que realmente sea un agente y no otro supervisor
    if agente.rol != 'agente':
        raise HTTPException(
            status_code=400, detail='Operación denegada: Solo se permite la eliminación de cuentas con rol de agente.')

    # 5. Hacer el borrado físico
    db.delete(agente)
    db.commit()
    return {"detail": f"Agente con ID {id} eliminado exitosamente. Los tickets asociados han sido desvinculados correctamente."}
