import { AuthProvider, useAuth } from "./context/AuthContext";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ui/ProtectedRoute";
import LoginPage from "./components/pages/LoginPage";
import { ChatProvider } from "./context/ChatContext";
import DashboardLayout from "./components/layout/Dashboardlayout";
import SidebarTickets from "./components/layout/SidebarTickets";

const LoginTemporal = () => {
  //Obtengo variables de contexto
  const { usuario, login } = useAuth();

  // Si ya está logueado, lo redirigimos automáticamente según su rol
  if (usuario) {
    return (
      <Navigate
        to={usuario.rol === "supervisor" ? "/supervision" : "/agente"}
        replace
      ></Navigate>
    );
  }

  //No esta autenticado, por lo tanto, mostrar el login
  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h2>🔑 LiveDesk Login (Vista Temporal)</h2>
      <p style={{ margin: "15px 0", color: "#64748b" }}>
        Simula un inicio de sesión rápido:
      </p>
      <button
        onClick={() =>
          login(
            "FAKETO_SIMULADO_AGENTE.eyJzdWIiOiIyIiwiY29ycmVvIjoiYWdlbnRlQGxleC5jb20iLCJyb2wiOiJhZ2VudGUifQ.signature",
          )
        }
        style={{
          padding: "10px 20px",
          backgroundColor: "#10b981",
          color: "white",
          marginRight: "10px",
          borderRadius: "4px",
          fontWeight: "bold",
        }}
      >
        Entrar como Agente
      </button>
      <button
        onClick={() =>
          login(
            "FAKETO_SIMULADO_SUPER.eyJzdWIiOiIxIiwiY29ycmVvIjoic3VwZXJAc3VwZXIuY29tIiwicm9sIjoic3VwZXJ2aXNvciJ9.signature",
          )
        }
        style={{
          padding: "10px 20px",
          backgroundColor: "#2563eb",
          color: "white",
          borderRadius: "4px",
          fontWeight: "bold",
        }}
      >
        Entrar como Supervisor
      </button>
    </div>
  );
};

const DashboardAgenteTemporal = () => {
  //Obtengo variables de contexto
  const { logout, usuario } = useAuth();
  return (
    <div style={{ display: "flex", width: "100%", height: "100%" }}>
      {/* Columna 2: Sidebar de Tickets */}
      <SidebarTickets></SidebarTickets>

      {/* Columna 3 (Temporal para pruebas visuales) */}
      <div style={{ flex: 1, padding: "40px", backgroundColor: "#f8fafc" }}>
        <h3>💬 Ventana de Chat (Próxima Tarea)</h3>
        <p style={{ color: "#64748b" }}>
          Selecciona un ticket de la lista para ver la conversación.
        </p>
      </div>
    </div>
  );
};

const DashboardSupervisorTemporal = () => {
  //Obtengo variables de contexto
  const { usuario, logout } = useAuth();
  return (
    <div style={{ padding: "40px" }}>
      <h1>👑 Panel de Supervisión</h1>
      <p style={{ margin: "10px 0" }}>
        Bienvenido: <strong>{usuario?.correo}</strong> (ID: {usuario?.id})
      </p>
      <button
        onClick={logout}
        style={{
          padding: "8px 16px",
          backgroundColor: "#ef4444",
          color: "white",
          borderRadius: "4px",
        }}
      >
        Cerrar Sesión
      </button>
    </div>
  );
};

const Pagina404 = () => (
  <div style={{ padding: "40px", textAlign: "center" }}>
    <h1 style={{ color: "#ef4444" }}>404 - Página No Encontrada</h1>
    <p>La sección que buscas no existe en LiveDesk.</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <BrowserRouter>
          <Routes>
            {/* Ruta Pública: Login */}
            <Route path="/login" element={<LoginPage></LoginPage>}></Route>

            {/* Ruta Protegida: Dashboard de Agente (Solo Rol: 'agente') */}
            <Route
              path="/agente"
              element={
                <ProtectedRoute rolesPermitidos={["agente"]}>
                  <DashboardLayout>
                    <DashboardAgenteTemporal></DashboardAgenteTemporal>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            ></Route>

            {/* Ruta Protegida: Dashboard de Supervisor (Solo Rol: 'supervisor') */}
            <Route
              path="/supervision"
              element={
                <ProtectedRoute rolesPermitidos={["supervisor"]}>
                  <DashboardLayout>
                    <DashboardSupervisorTemporal></DashboardSupervisorTemporal>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            ></Route>

            {/* Redirección por defecto: si entra a la raíz "/" decide a dónde mandarlo */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Captura cualquier otra URL inválida */}
            <Route path="*" element={<Pagina404></Pagina404>} />
          </Routes>
        </BrowserRouter>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
