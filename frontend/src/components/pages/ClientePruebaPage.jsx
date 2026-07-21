import { useState, useEffect, useRef } from "react";

export default function ClientePruebaPage() {
  const [nombre, setNombre] = useState("");
  const [ticketActivo, setTicketActivo] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [estadoConexion, setEstadoConexion] = useState("Desconectado");
  const [ticketFinalizado, setTicketFinalizado] = useState(false); // 👈 Nuevo estado para el cierre del chat

  const socketRef = useRef(null);
  const scrollRef = useRef(null);

  // 1. Restaurar sesión previa si existe en localStorage
  useEffect(() => {
    const ticketGuardado = localStorage.getItem("live_desk_client_ticket");
    if (ticketGuardado) {
      try {
        const ticket = JSON.parse(ticketGuardado);
        setTicketActivo(ticket);
      } catch (err) {
        console.error("Error al parsear el ticket guardado:", err);
        localStorage.removeItem("live_desk_client_ticket");
      }
    }
  }, []);

  // 2. Conectar al WebSocket cuando exista un ticket activo
  useEffect(() => {
    if (!ticketActivo?.id) return;

    const wsUrl = `ws://127.0.0.1:8000/ws/ticket/${ticketActivo.id}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setEstadoConexion("Conectado");
      setTicketFinalizado(false);
      console.log("Cliente conectado al WebSocket");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // 🛑 Detectar si el backend envía un evento de finalización
        if (data.tipo === "ticket_finalizado") {
          setEstadoConexion("Finalizado");
          setTicketFinalizado(true);
          return;
        }

        if (Array.isArray(data)) {
          setMensajes(data);
        } else {
          setMensajes((prev) => [...prev, data]);
        }
      } catch (error) {
        console.error("Error al procesar mensaje del socket:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("Error en WebSocket:", error);
      setEstadoConexion("Error de conexión");
    };

    ws.onclose = (event) => {
      setEstadoConexion("Desconectado");
      // Si el WebSocket se cierra estando activo el ticket, marcamos la sesión como finalizada
      setTicketFinalizado(true);
      console.log("WebSocket cerrado");
    };

    return () => {
      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        ws.close();
      }
      socketRef.current = null;
    };
  }, [ticketActivo?.id]);

  // Autoscroll al último mensaje
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  // 3. Crear ticket vía POST
  const handleCrearTicket = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    try {
      const res = await fetch("http://127.0.0.1:8000/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_nombre: nombre }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("live_desk_client_ticket", JSON.stringify(data));
        setTicketActivo(data);
        setTicketFinalizado(false);
      } else {
        console.error("Error al crear el ticket:", res.statusText);
      }
    } catch (err) {
      console.error("Error de red al crear el ticket:", err);
    }
  };

  // 4. Enviar mensaje por WebSocket
  const handleEnviarMensaje = (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !socketRef.current || ticketFinalizado) return;

    const payload = {
      contenido: nuevoMensaje,
      remitente: "cliente", // 👈 Nombre exacto de la clave en FastAPI
    };

    if (socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
      setNuevoMensaje("");
    } else {
      console.warn("El WebSocket no está abierto.");
    }
  };

  // 5. Finalizar/Salir del chat para iniciar uno nuevo
  const handleSalirChat = () => {
    if (socketRef.current) {
      socketRef.current.close();
    }
    localStorage.removeItem("live_desk_client_ticket");
    setTicketActivo(null);
    setMensajes([]);
    setNombre("");
    setTicketFinalizado(false);
  };

  return (
    <div style={styles.contenedorPadre}>
      <div style={styles.tarjetaChat}>
        {/* Cabecera */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.tituloHeader}>LiveDesk - Soporte</h1>
            {ticketActivo && (
              <p style={styles.subtituloHeader}>
                Ticket #{ticketActivo.id} | Estado:{" "}
                <span
                  style={{
                    color: ticketFinalizado
                      ? "#ef4444"
                      : estadoConexion === "Conectado"
                        ? "#10b981"
                        : "#f59e0b",
                  }}
                >
                  {ticketFinalizado ? "Ticket Finalizado" : estadoConexion}
                </span>
              </p>
            )}
          </div>
          {ticketActivo && (
            <button onClick={handleSalirChat} style={styles.botonSalir}>
              Nuevo Chat
            </button>
          )}
        </div>

        {/* Cuerpo / Pantallas */}
        {!ticketActivo ? (
          /* PANTALLA 1: Formulario de inicio */
          <form onSubmit={handleCrearTicket} style={styles.formulario}>
            <h2
              style={{
                fontSize: "18px",
                margin: "0 0 8px 0",
                textAlign: "center",
              }}
            >
              Iniciar conversación
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: "#94a3b8",
                margin: "0 0 20px 0",
                textAlign: "center",
              }}
            >
              Ingresa tu nombre para conectarte con un agente disponible.
            </p>

            <div style={{ marginBottom: "16px", width: "100%" }}>
              <label style={styles.labelInput}>Tu Nombre</label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Alan Lomas"
                style={styles.inputGeneral}
              />
            </div>

            <button type="submit" style={styles.botonEnviar}>
              Iniciar Chat
            </button>
          </form>
        ) : (
          /* PANTALLA 2: Chat en tiempo real */
          <div style={styles.cuerpoChat}>
            {/* Area de Mensajes */}
            <div style={styles.areaMensajes}>
              {mensajes.length === 0 ? (
                <p
                  style={{
                    textAlign: "center",
                    color: "#64748b",
                    fontSize: "13px",
                    marginTop: "auto",
                    marginBottom: "auto",
                  }}
                >
                  Te has conectado al chat. Escribe un mensaje para empezar.
                </p>
              ) : (
                mensajes.map((msg, index) => {
                  const esCliente = msg.remitente === "cliente";
                  return (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: esCliente ? "flex-end" : "flex-start",
                        marginBottom: "10px",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "80%",
                          padding: "8px 14px",
                          borderRadius: "12px",
                          fontSize: "14px",
                          backgroundColor: esCliente ? "#059669" : "#334155",
                          color: "#ffffff",
                          borderBottomRightRadius: esCliente ? "2px" : "12px",
                          borderBottomLeftRadius: esCliente ? "12px" : "2px",
                        }}
                      >
                        {msg.contenido}
                      </div>
                      <span
                        style={{
                          fontSize: "10px",
                          color: "#64748b",
                          marginTop: "3px",
                        }}
                      >
                        {esCliente ? "Tú" : "Agente"}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={scrollRef} />
            </div>

            {/* Footer / Input de envío o Banner de finalización */}
            {ticketFinalizado ? (
              <div style={styles.bannerFinalizado}>
                <p
                  style={{
                    margin: "0 0 10px 0",
                    fontSize: "13px",
                    color: "#94a3b8",
                  }}
                >
                  Esta conversación ha sido finalizada por el agente.
                </p>
                <button onClick={handleSalirChat} style={styles.botonNuevoChat}>
                  Iniciar nueva consulta
                </button>
              </div>
            ) : (
              <form onSubmit={handleEnviarMensaje} style={styles.footerForm}>
                <input
                  type="text"
                  value={nuevoMensaje}
                  onChange={(e) => setNuevoMensaje(e.target.value)}
                  placeholder={
                    estadoConexion === "Conectado"
                      ? "Escribe tu mensaje..."
                      : "Conectando al chat..."
                  }
                  disabled={estadoConexion !== "Conectado"}
                  style={{ ...styles.inputGeneral, flex: 1 }}
                />
                <button
                  type="submit"
                  disabled={
                    estadoConexion !== "Conectado" || !nuevoMensaje.trim()
                  }
                  style={{
                    ...styles.botonEnviarMensaje,
                    opacity:
                      estadoConexion === "Conectado" && nuevoMensaje.trim()
                        ? 1
                        : 0.5,
                    cursor:
                      estadoConexion === "Conectado" && nuevoMensaje.trim()
                        ? "pointer"
                        : "not-allowed",
                  }}
                >
                  Enviar
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Estilos JS puros
const styles = {
  contenedorPadre: {
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    boxSizing: "border-box",
    fontFamily: "sans-serif",
  },
  tarjetaChat: {
    width: "100%",
    maxWidth: "420px",
    height: "600px",
    backgroundColor: "#1e293b",
    borderRadius: "12px",
    border: "1px solid #334155",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    backgroundColor: "#020617",
    padding: "14px 16px",
    borderBottom: "1px solid #334155",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tituloHeader: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "bold",
    color: "#34d399",
  },
  subtituloHeader: {
    margin: "2px 0 0 0",
    fontSize: "11px",
    color: "#94a3b8",
  },
  botonSalir: {
    backgroundColor: "#dc2626",
    color: "#ffffff",
    border: "none",
    padding: "4px 10px",
    borderRadius: "4px",
    fontSize: "12px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  formulario: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "24px",
    boxSizing: "border-box",
  },
  labelInput: {
    display: "block",
    fontSize: "12px",
    color: "#94a3b8",
    marginBottom: "6px",
  },
  inputGeneral: {
    width: "100%",
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "6px",
    padding: "10px 12px",
    color: "#ffffff",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },
  botonEnviar: {
    width: "100%",
    backgroundColor: "#059669",
    color: "#ffffff",
    border: "none",
    padding: "10px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "10px",
  },
  cuerpoChat: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  areaMensajes: {
    flex: 1,
    padding: "16px",
    overflowY: "auto",
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    display: "flex",
    flexDirection: "column",
  },
  footerForm: {
    padding: "12px",
    backgroundColor: "#020617",
    borderTop: "1px solid #1e293b",
    display: "flex",
    gap: "8px",
  },
  botonEnviarMensaje: {
    backgroundColor: "#059669",
    color: "#ffffff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "bold",
  },
  bannerFinalizado: {
    padding: "16px",
    backgroundColor: "#020617",
    borderTop: "1px solid #334155",
    textAlign: "center",
  },
  botonNuevoChat: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
