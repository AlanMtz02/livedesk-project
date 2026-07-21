import { useState } from "react";
import { useChat } from "../../context/ChatContext";
import styles from "./VentanaChat.module.css";
import { MessageSquareOff, Send } from "lucide-react";

function VentanaChat() {
  //Obtener variables de contexto
  const { ticketActivo, mensajes, setMensajes, finalizarTicket,enviarMensaje } = useChat();
  const [textoMensaje, setTextoMensaje] = useState("");

  // Extraer la lista de mensajes correspondiente al ticket abierto
  // Como 'mensajes' es un diccionario { [id]: [array] },
  // buscar la clave correspondiente a 'ticketActivo.id'. Si no existe aún, usamos un array vacío [].
  const listaMensajes = ticketActivo ? mensajes[ticketActivo.id] || [] : [];

  //Funcion para mandar mensaje
  const handleEnviar = async (e) => {
    e.preventDefault(); //Evita recargar la pagina en formularios
    if (!textoMensaje.trim() || !ticketActivo) return; //Valida que no envie ' ' o que exista un ticket seleccionado o activo

    // 2. Enviar a través del WebSocket expuesto por ChatContext
    enviarMensaje(textoMensaje);

    //Limpiar el input
    setTextoMensaje("");
  };;

  // CASO A: Si el agente NO ha seleccionado ningún ticket (ticketActivo === null)
  if (!ticketActivo) {
    return (
      <div className={styles.sinChatSeleccionado}>
        <MessageSquareOff
          size={48}
          style={{ marginBottom: "16px" }}
        ></MessageSquareOff>
        <h3>Sin conversación seleccionada</h3>
        <p>
          Selecciona un ticket de tu lista de activos para responder o toma uno
          nuevo de la sala de espera.
        </p>
      </div>
    );
  }

  // CASO B: Si HAY un ticket activo seleccionado en pantalla
  return (
    <div className={styles.contenedorChat}>
      {/* ENCABEZADO: Muestra los datos extraídos de 'ticketActivo' y el botón de cierre */}
      <div className={styles.headerChat}>
        <div className={styles.infoCliente}>
          <span className={styles.nombreCliente}>
            {ticketActivo.cliente_nombre}
          </span>
          <span className={styles.asuntoTicket}>
            Ticket #{ticketActivo.id} - Consulta General
          </span>
        </div>
          {/* Conectamos la función 'finalizarTicket' pasando el ID del ticket activo */}
          <button
            className={styles.botonCerrarTicket}
            onClick={(e) => finalizarTicket(ticketActivo.id)}
          >
            Finalizar Ticket
          </button>
      </div>
      {/* ÁREA DE MENSAJES: Mapea la 'listaMensajes' extraída del diccionario */}
      <div className={styles.areaMensajes}>
        {listaMensajes.length === 0 ? (
          <p
            style={{ textAlign: "center", color: "#94a3b8", marginTop: "20px" }}
          >
            No hay mensajes registrados en esta conversación.
          </p>
        ) : (
          listaMensajes.map((msg, index) => {
            const esAgente =
              msg.remitente ===
              "agente"; /*Necesario para saber quien manda mensaje*/
            return (
              <div
                key={index}
                className={`${styles.burbujaMensaje} ${esAgente ? styles.mensajeAgente : styles.mensajeCliente}`}
              >
                <div>{msg.contenido}</div>
                <span className={styles.mensajeFecha}>
                  {msg.creado_at
                    ? new Date(msg.creado_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </span>
              </div>
            );
          })
        )}
      </div>
      {/* INPUT DE RESPUESTA */}
      <form className={styles.areaInput} onSubmit={handleEnviar}>
        <input
          type="text"
          className={styles.inputTexto}
          placeholder="Escribe tu respuesta aquí..."
          value={textoMensaje}
          onChange={(e) => setTextoMensaje(e.target.value)}
        />
        <button type="submit" className={styles.botonEnviar}>
          <span>Enviar</span>
          <Send size={16}></Send>
        </button>
      </form>
    </div>
  );
}

export default VentanaChat;
