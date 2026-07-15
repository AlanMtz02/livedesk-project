from passlib.context import CryptContext

#Crear el contexto usando argon2
pwd_context=CryptContext(schemes=['argon2'],deprecated='auto')

def generar_hash_password(password:str)->str:
    """
    Toma una contraseña en texto plano y devuelve su hash encriptado con Argon2.
    """
    return pwd_context.hash(password)

def verificar_password(password_plano:str,password_hashed:str)->bool:
    """
    Compara una contraseña en texto plano con el hash guardado en la base de datos.
    Devuelve True si coinciden, de lo contrario False.
    """
    return pwd_context.verify(password_plano,password_hashed)

