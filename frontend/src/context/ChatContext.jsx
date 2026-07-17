import { createContext, useContext, useEffect, useState } from "react";
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

  //Cambia el foco del agente a una conversación y descarga su historial ordenado
  //Sirve para recuperar todos los mensajes ordenados de dicho ticket
  const seleccionarTicket = async (ticket) => {
    setTicketActivo(ticket); //Le paso el objeto ticket completo

    // Optimizamos: si ya tenemos los mensajes de este ticket en memoria, evitamos la petición HTTP
    if (!mensajes[ticket.id]) {
      try {
        //Obtener token porque el endpoint lo solicita
        const token = localStorage.getItem("token");

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
            [ticket.id]: data, //Inserta los nuevos mensajes
          }));
        }
      } catch (error) {
        console.error(
          `Error al recuperar historial del ticket ${ticket.id}:`,
          error,
        );
      }
    }
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
        // Al asignarse con éxito, refrescamos de inmediato mis tickets activos y en espera para actualizar la UI
        await Promise.all([cargarMisTicketsActivos(), cargarTicketsEnEspera()]);
      } else {
        const errorData = await respuesta.json();
        alert(errorData.detail || "No se pudo asignar el ticket.");
      }
    } catch (error) {
      console.error("Error en la asignación del ticket:", error);
    }
  };

  //Cerrar  un ticket activo
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
        // Si el ticket cerrado era el que estaba activo en pantalla, deseleccionamos
        if (ticketActivo && ticketActivo.id === ticketId) {
          ticketActivo(null);
        }

        //Volver ahora a cargar mis tickets activos porque se acabo de cerrar uno
        await cargarMisTicketsActivos();
      }
    } catch (error) {
      console.error("Error al cerrar el ticket:", error);
    }
  };

  // ==========================================================================
  // ESTRATEGIA DE POLLING AUTOMÁTICO (CADA 5 SEGUNDOS)
  // Con esto mantenemos la sala de espera fresca en tiempo real siempre y cuando este el usuario en sesion
  // ==========================================================================
  useEffect(() => {
    if (!usuario) {
      return;
    }

    // Ejecuciones iniciales inmediatas al loguearse
    cargarMisTicketsActivos();
    cargarTicketsenEspera();

    // Configuración del intervalo cíclico de 5 segundos
    const intervalo = setInterval(() => {
      cargarTicketsenEspera(); //Cada 5 segundos llamo al endpoint para verificar si hay nuevos tickets en espera
    }, 5000);

    //Funcion de limpieza
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
  };

  return (
    /*Envuelve toda la app al igual que AuthProvider*/
    <ChatContext.Provider value={valorContexto}>
      {children}
    </ChatContext.Provider>
  );
};

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

