import { LogOut, MessageSquare, Shield, TicketCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import styles from './DashboardLayout.module.css';
import { useState } from "react";
import Historial from "../modules/historial/Historial";
function DashboardLayout({children}){
  //Obtener variables de AuthProvider
  const { usuario, logout } = useAuth();

  // 'chats' = Módulo actual de soporte técnico 
  // 'historial' = El nuevo módulo base listo para programar
  const [moduloActivo, setModuloActivo] = useState("chats");

  return (
    <div className={styles.contenedorPrincipal}>
      {/* 1. BARRA LATERAL GLOBAL (Navegación e info del Agente) */}
      <aside className={styles.sidebarGlobal}>
        <div className={styles.logoContenedor}>
          <span className={styles.logoTexto}>LD</span>
        </div>

        <nav className={styles.navegacion}>
          <button
            className={`${styles.botonNav} ${moduloActivo === "chats" ? styles.activo : ""}`}
            title="Chats Activos"
            onClick={() => setModuloActivo("chats")}
            ///////LOGICA PARA RENDERIZAR CHAT (Por defecto ya se muestra)
          >
            <MessageSquare size={22}></MessageSquare>
          </button>
          <button
            className={`${styles.botonNav} ${moduloActivo === "historial" ? styles.activo : ""}`}
            title="Tickets Cerrados"
            onClick={() => setModuloActivo("historial")}
            ///////LOGICA PARA RENDERIZAR EL HISTORIAL
          >
            <TicketCheck size={22}></TicketCheck>
          </button>
        </nav>

        <div className={styles.seccionUsuario}>
          <div className={styles.avatar} title={usuario?.correo}>
            {usuario?.correo?.charAt(0).toUpperCase() || "A"}
          </div>
          {usuario?.rol === "supervisor" && (
            <div className={styles.insigniaRol} title="Rol: Supervisor">
              <Shield size={14}></Shield>
            </div>
          )}
          <button
            className={styles.botonLogout}
            onClick={logout}
            title="Cerrar Sesión"
          >
            <LogOut size={20}></LogOut>
          </button>
        </div>
      </aside>
      {/* 2. CONTENIDO PRINCIPAL (Donde inyectaremos las listas y ventanas de chat) */}
      <main className={styles.contenidoPrincipal}>
        {moduloActivo==='chats' && children}
        {moduloActivo==='historial' && <Historial></Historial>}
      </main>
    </div>
  );
}

export default DashboardLayout;