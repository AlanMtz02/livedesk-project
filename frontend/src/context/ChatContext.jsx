import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";

//Crear el contexto
const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  //Obtener contexto del AuthProvider
  const { usuario } = useAuth();

  // ==========================================================================
  // ESTADOS GLOBALES DEL CHAT
  // ==========================================================================
  const [ticketsEnEspera, setTicketsEnEspera] = useState([]); // endpoint: /en-espera
  const [ticketsActivos, setTicketsActivos] = useState([]); // endpoint: /mis-activos
  const [ticketActivo, setTicketActivo] = useState(null); // El ticket seleccionado en pantalla
  const [mensajes, setMensajes] = useState({}); // Diccionario indexado por ticket_id: { [id]: [mensajes] }
  const [cargandoActivos, setCargandoActivos] = useState(false);
  const [cargandoEspera, setCargandoEspera] = useState(false);

  // 🔌 REFERENCIA DEL WEBSOCKET
  // Usamos useRef para mantener la misma instancia del Socket entre re-renders sin perder la conexión
  const socketRef = useRef(null);

  // ==========================================================================
  // EFECTO: Limpiar el estado si el usuario cierra sesión (Presiona un boton con la funcion logout)
  // ==========================================================================
  useEffect(() => {
    if (!usuario) {
      //Limpiar todas las variables propias del chat
      setTicketsEnEspera([]);
      setTicketsActivos([]);
      setTicketActivo(null);
      setMensajes({});

      // Si el usuario cierra sesión, cerramos la conexión Socket de forma limpia siempre y cuando exista una conexion actual
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    }
  }, [usuario]);

  const cargarMisTicketsActivos = async () => {
    if (!usuario) {
      return;
    }

    //Empieza la carga
    setCargandoActivos(true);
    try {
      //Obtengo el token porque los endpoints estan protegidos
      const token = localStorage.getItem("token");

      //Llamar al endpoint GET. Necesita token
      const respuesta = await fetch(
        "http://127.0.0.1:8000/api/tickets/mis-activos",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (respuesta.ok) {
        const data = await respuesta.json();
        setTicketsActivos(data); //Actualizo mis tickets activos
      }
    } catch (error) {
      console.error("Error al consultar /mis-activos:", error);
    } finally {
      setCargandoActivos(false);
    }
  };

  const cargarTicketsenEspera = async () => {
    if (!usuario) {
      return;
    }
    setCargandoEspera(true); //Iniciar la carga
    try {
      //Obtener el token porque el endpoint lo solicita
      const token = localStorage.getItem("token");

      //Hacer la llamada al endpont.Necesita token
      const respuesta = await fetch(
        "http://127.0.0.1:8000/api/tickets/en-espera",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (respuesta.ok) {
        const data = await respuesta.json();
        setTicketsEnEspera(data); //Actualizar los tickes en espera
      }
    } catch (error) {
      console.error("Error al consultar /en-espera:", error);
    } finally {
      setCargandoEspera(false); //Finaliza la carga
    }
  };

  // --------------------------------------------------------------------------
  // CONEXIÓN DINÁMICA DE WEBSOCKET AL SELECCIONAR O CAMBIAR DE TICKET
  // --------------------------------------------------------------------------
  //Cambia el foco del agente a una conversación y descarga su historial ordenado
  //Sirve para recuperar todos los mensajes ordenados de dicho ticket
  const seleccionarTicket = async (ticket) => {
    setTicketActivo(ticket); //Le paso el objeto ticket completo

    // Optimizamos: si ya tenemos los mensajes de este ticket en memoria, evitamos la petición HTTP
    if (!mensajes[ticket.id]) {
      try {
        //Obtener token porque el endpoint lo solicita
        const token = localStorage.getItem("token");

        //Aqui obtengo el historial de mensjes de dicho ticket por eso es HTTP
        const respuesta = await fetch(
          `http://127.0.0.1:8000/api/tickets/${ticket.id}/mensajes`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (respuesta.ok) {
          const data = await respuesta.json();
          setMensajes((prev) => ({
            ...prev, //Mantiene los mensajes previos que ya habia
            [ticket.id]: data, //Inserta los nuevos mensajes en la key del id del ticket
          }));
        }
      } catch (error) {
        console.error(
          `Error al recuperar historial del ticket ${ticket.id}:`,
          error,
        );
      }
    }
    //Desconectar socket previo si estaba abierto en otro ticket
    if (socketRef.current) {
      socketRef.current.close();
    }

    //Abrir conexion ws para el canal de mensajes y con el id actual del ticket
    const wsUrl = `ws://127.0.0.1:8000/ws/ticket/${ticket.id}`;
    const ws = new WebSocket(wsUrl);

    ////CASO 1: Al abrir la conexion
    ws.onopen = () => {
      console.log(`Conectado a la sala del ticket #${ticket.id}`);
    };

    ///CASO 2: Cuando el backend nos empuje un mensaje. event.data contiene el diccionario mensaje_a_enviar de chat.py
    ws.onmessage = (event) => {
      //Convierto de diccionario a json el mensaje recibido
      const mensajeRecibido = JSON.parse(event.data);

      // Inyectamos el objeto exactamente como lo envía FastAPI (id, ticket_id, remitente, contenido, creado_at)
      setMensajes((prev) => ({
        ...prev, //Mantengo todo lo que ya tenia la variable mensajes,
        [ticket.id]: [...(prev[ticket.id] || []), mensajeRecibido],
      }));
    };

    ///CASO 3:Error en la conexion
    ws.onerror = (event) => {
      if (event.code === 4004) {
        //ID no existe, asi esta programado en fastapi
        console.warn("El ticket no existe en la base de datos.");
      } else {
        console.log(`Conexión cerrada para el ticket #${ticket.id}`);
      }
    };

    socketRef.current = ws;
  };

  //ENVIAR MENSAJE EN FORMATO EXACTO QUE ESPERA FASTAPI
  const enviarMensaje = (contenidoTexto) => {
    //Validar que exista un ticketActivo o exista una conexion ws
    if (!ticketActivo || !socketRef.current) {
      console.warn("No hay WebSocket activo.");
      return;
    }

    // Formato exacto que espera: data = await websocket.receive_json() de fastapi
    const paquete = {
      remitente: "agente",
      contenido: contenidoTexto,
    };

    //Enviar por la conexion actual el mensaje convertido a JSON
    socketRef.current.send(JSON.stringify(paquete));
  };

  //Asigna un ticket de la sala de espera al agente logueado
  //Y ademas al ser asignado correctamente, se actualizan las otras variables puesto que uno que estaba en espera ahora es activo para mi y actualizar la ui
  const asignarTicketAConexion = async (ticketId) => {
    try {
      const token = localStorage.getItem("token");
      const respuesta = await fetch(
        `http://127.0.0.1:8000/api/tickets/${ticketId}/asignar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (respuesta.ok) {
        const ticketAsignado = await respuesta.json();
        // Al asignarse con éxito, refrescamos de inmediato mis tickets activos y en espera para actualizar la UI
        await Promise.all([cargarMisTicketsActivos(), cargarTicketsenEspera()]);

        //Abrir en automático la conversación y conectar el WS de inmediato
        if (ticketAsignado && ticketAsignado.id) {
          seleccionarTicket(ticketAsignado);
        }
      } else {
        const errorData = await respuesta.json();
        alert(errorData.detail || "No se pudo asignar el ticket.");
      }
    } catch (error) {
      console.error("Error en la asignación del ticket:", error);
    }
  };

  //Cerrar  un ticket activo
  // 🟢 ChatContext.jsx - finalizarTicket
  const finalizarTicket = async (ticketId) => {
    try {
      const token = localStorage.getItem("token");
      const respuesta = await fetch(
        `http://127.0.0.1:8000/api/tickets/${ticketId}/cerrar`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (respuesta.ok) {
        // 1. Si el ticket activo actual era el que cerramos, desconectamos el socket
        if (ticketActivo && ticketActivo.id === ticketId) {
          if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
          }
          setTicketActivo(null);
        }

        // 2. Sacamos de forma definitiva el ticket de la lista de activos en pantalla
        setTicketsActivos((prevActivos) =>
          prevActivos.filter((t) => t.id !== ticketId),
        );

        // 3. Limpiamos los mensajes en memoria para liberar recursos
        setMensajes((prev) => {
          const copia = { ...prev };
          delete copia[ticketId];
          return copia;
        });
      } else {
        const errorData = await respuesta.json();
        alert(errorData.detail || "No se pudo cerrar el ticket.");
      }
    } catch (error) {
      console.error("Error al cerrar el ticket:", error);
    }
  };

  // ==========================================================================
  // ESTRATEGIA DE POLLING AUTOMÁTICO (CADA 5 SEGUNDOS)
  // Con esto mantenemos la sala de espera fresca en tiempo real siempre y cuando este el usuario en sesion
  // ==========================================================================
  // 🟢 ChatContext.jsx - EFECTO DE POLLING CORREGIDO
  useEffect(() => {
    // 1. Si no hay usuario o es un cliente sin token de agente, no hacemos polling
    if (!usuario || usuario.rol === "cliente") return;

    // Ejecuciones iniciales para agentes
    cargarMisTicketsActivos();
    cargarTicketsenEspera();

    // Polling de 5 segundos solo para personal de soporte
    const intervalo = setInterval(() => {
      cargarTicketsenEspera();
    }, 5000);

    return () => clearInterval(intervalo);
  }, [usuario]);

  const valorContexto = {
    ticketsEnEspera,
    ticketsActivos,
    ticketActivo,
    mensajes,
    cargandoActivos,
    cargandoEspera,
    setTicketsActivos,
    setMensajes,
    seleccionarTicket,
    asignarTicketAConexion,
    finalizarTicket,
    cargarMisTicketsActivos,
    enviarMensaje,
  };

  return (
    /*Envuelve toda la app al igual que AuthProvider*/
    <ChatContext.Provider value={valorContexto}>
      {children}
    </ChatContext.Provider>
  );
};;

//Hook personalizado para consumir el contexto de forma rápida y limpia
export const useChat=()=>{
    const context=useContext(ChatContext);
    if (!context) {
      throw new Error(
        "useChat debe ser utilizado estrictamente dentro de un ChatProvider",
      );
    }
    return context;

}

