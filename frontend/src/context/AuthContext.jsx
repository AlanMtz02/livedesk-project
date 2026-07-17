import { createContext, useContext, useEffect, useState } from "react";

//1.Crear el contexto de autenticacion
const AuthContext = createContext(null);

// Función auxiliar nativa para decodificar el payload de un JWT
//Es necesario para poder tener rol y sub en el contexto global y pasarselo a todos los hijos
//Estructura del token= header.payload.signature. Es necesario obtener el payload porque ahi se encuentra el rol, token , sub
// Datos con el que fue creado el token ->
// payload = {
//   sub: str(usuario.id),
//   correo: usuario.correo,
//   rol: usuario.rol,
// };

const decodificarToken = (token) => {
  try {
    const base64Url = token.split(".")[1]; //Posicionar en el payload
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error al decodificar el token JWT:", error);
    return null;
  }
};

//2.Componente  proveedor (Provider) que envolvera a toda la aplicacion
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true); //true porque es el que envuelve toda la aplicacion

  //Se ejecuta para verificar si hay un token y esta al pendiente del token por si cambia
  useEffect(() => {
    if (token) {
      const datosUsuario = decodificarToken(token);
      if (datosUsuario) {
        setUsuario({
          id: datosUsuario.sub,
          correo: datosUsuario.correo,
          rol: datosUsuario.rol,
        });
      } else {
        // Si el token está corrupto o inválido, limpiamos la sesión
        logout();
      }
    }
    setCargando(false); //Finaliza la carga
  }, [token]);

  // Función para iniciar sesión (recibe el token puro del backend)
  const login = (accessToken) => {
    localStorage.setItem("token", accessToken); //Guarda el token en localstorage
    setToken(accessToken);
    const datosUsuario = decodificarToken(accessToken);
    if (datosUsuario) {
      setUsuario({
        id: datosUsuario.sub,
        correo: datosUsuario.correo,
        rol: datosUsuario.rol,
      });
      return datosUsuario.rol; // Retornamos el rol para saber a dónde redireccionar inmediatamente
    }
    return null;
  };

  // Función para cerrar sesión limpiando el almacenamiento y el estado
  const logout = () => {
    localStorage.removeItem("token"); //Removerlo del localstorage
    setToken(null); //Actualizar la variable
    setUsuario(null); //Limpiar tambien los datos del usuario
  };

  // Valores globales expuestos a los componentes
  // Siempre que cambien en algún componente, React se entera y vuelve a renderizar los componentes que usan ese contexto/variable useAuth()

  // En login, al inicio no entra al if(usuario) porque no hay token, pero al presionar el botón la variable usuario cambia y entonces React se entera y todo el componente se vuelve a renderizar

  // Porque esas variables (token, usuario, cargando) están en el AuthContext.Provider value{}” → correcto, son las que definen el estado global

  // las funciones (login, logout) no disparan render por sí mismas, pero cuando dentro de ellas cambias un estado (setUsuario, setToken) entonces sí se dispara el re-render.

  //Estas son las variables que react estara al pendiente si cambian para volver a renderizar el componente de quien las usa tanto el padre como el hijo.
  //si cambia algo en el AuthContext.Provider value{}, todos los componentes que usan useAuth() se re-renderizan.

  // La desestructuración const {usuario}=useAuth() no limita el re-render, solo indica qué valores vas a usar dentro del componente.Pero si cambia uno que no se desetructuro pero forma parte del contexto, igual ocurrira un re-render en el componente
  const valorContexto = {
    token,
    usuario, //Es el diccionario completo con correo,sub,rol
    cargando,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={valorContexto}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Hook personalizado para consumir el contexto de forma rápida y limpia
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      "useAuth debe utilizarse estrictamente dentro de un AuthProvider",
    );
  }
  return context;
};
