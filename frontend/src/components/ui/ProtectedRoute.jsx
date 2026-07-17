
import { useAuth } from "../../context/AuthContext";
import {Navigate} from 'react-router-dom';
//Componente para proteger rutas.
//  children -> componente que envuelve dicha funciona y renderiza en caso que si cumpla
// rolesPermitidos -> lista de strings con los roles permitidos para que se renderize
function ProtectedRoute({children,rolesPermitidos}){
  //Obtener variables de contexto
  const { usuario, cargando } = useAuth();

  // 1. Mientras se lee y valida el token en localStorage, mostramos un estado de carga
  if (cargando) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#f1f5f9",
          color: "#64748b",
          fontWeight: "600",
          fontSize: "1.2rem",
        }}
      >
        Cargando sesión de LiveDesk
      </div>
    );
  }

  // 2. Si el usuario no está autenticado, lo redireccionamos de inmediato al Login
  if (!usuario) {
    return <Navigate to="/login" replace></Navigate>;
  }

  // 3. Aqui si esta autenticado pero la ruta requiere roles específicos y el rol del usuario no está incluido, denegamos el acceso
  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#f1f5f9",
          color: "#0f172a",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <h1 style={{ color: "#ef4444", marginBottom: "10px" }}>
          Acceso restringido
        </h1>
        <p style={{ color: "#64748b", marginBottom: "20px" }}>
          Tu cuenta con rol de <strong>{usuario.rol}</strong> no tiene
          autorización para visualizar esta pantalla
        </p>
        <button
          onClick={() =>
            (window.location.href =
              usuario.rol === "supervisor" ? "/supervision" : "/agente")
          }
          style={{
            backgroundColor: "#2563eb",
            color: "white",
            padding: "10px 20px",
            borderRadius: "6px",
            fontWeight: "600",
          }}
        >
          Volver a mi panel seguro
        </button>
      </div>
    );
  }

  // 4. Si pasa todas las validaciones, renderiza el componente hijo de forma segura
  return children;
}

export default ProtectedRoute;