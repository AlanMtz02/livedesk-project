import { useChat } from "../../context/ChatContext";
import styles from './SidebarTickets.module.css';

function SidebarTickets(){
    //Obtengo variables de contexto
    const {ticketsActivos,ticketsEnEspera,ticketActivo,seleccionarTicket,asignarTicketAConexion}=useChat();

    return (
      <aside className={styles.sidebarContenedor}>
        <div className={styles.encabezado}>
          <h2 className={styles.titulo}>Bandeja de entrada</h2>
          <span className={styles.subtitulo}>
            Gestion de soporte en tiempo real
          </span>
        </div>
        <div className={styles.listaContenedor}>
          {/* SECCIÓN 1: MIS CHATS ACTIVOS */}
          <div className={styles.seccion}>
            <div className={styles.seccionTitulo}>
              <span>Mis chats activos</span>
              <span className={styles.contadorBadge}>
                {ticketsActivos.length}
              </span>
            </div>
            {ticketsActivos.length === 0 ? (
              <p className={styles.vacioTexto}>No tienes chats asignados.</p>
            ) : (
              ticketsActivos.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`${styles.tarjetaTicket} ${ticket.id === ticketActivo ? styles.activa : ""}`}
                  onClick={() => seleccionarTicket(ticket)}
                >
                  <div className={styles.tarjetaHeader}>
                    <span className={styles.nombreCliente}>
                      {ticket.cliente_nombre}
                    </span>
                    <span className={styles.ticketId}>{ticket.id}</span>
                  </div>
                  <div className={styles.ultimoMensaje}>
                    Conversacion activa
                  </div>
                </div>
              ))
            )}
          </div>
          <hr
            style={{
              border: "none",
              borderTop: "1px solid #f1f5f9",
              margin: "0",
            }}
          />

          {/* SECCIÓN 2: SALA DE ESPERA (POLLING DE 5s) */}
          <div className={styles.seccion}>
            <div className={styles.seccionTitulo}>
              <span>Sala de espera</span>
              <span className={styles.contadorBadgeEspera}>
                {ticketsEnEspera.length}
              </span>
            </div>
            {ticketsEnEspera.length === 0 ? (
              <p className={styles.vacioTexto}>Sin tickets en espera.</p>
            ) : (
              ticketsEnEspera.map((ticket) => (
                <div key={ticket.id} className={styles.tarjetaTicket}>
                  <div className={styles.tarjetaHeader}>
                    <span className={styles.nombreCliente}>
                      {ticket.cliente_nombre}
                    </span>
                    <span className={styles.ticketId}>#{ticket.id}</span>
                  </div>
                  <div className={styles.ultimoMensaje}>
                    Esperando agente...
                  </div>
                  <button
                    className={styles.botonAsignar}
                    onClick={(e) => {
                      e.stopPropagation(); // Evita seleccionar el ticket antes de asignárselo
                      asignarTicketAConexion(ticket.id);
                    }}
                  >
                    Tomar Ticket
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
    );

}

export default SidebarTickets;