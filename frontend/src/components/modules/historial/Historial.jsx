import { History } from "lucide-react";
import styles from "./Historial.module.css";
function Historial() {
  return (
    <div className={styles.contenedor}>
      <History size={64} color="#64748b" style={{ marginBottom: "20px" }} />
      <h1 className={styles.titulo}>Historial de Tickets Cerrados</h1>
      <p className={styles.descripcion}>
        [Mockup Base] Este módulo está preparado para consultar en el futuro tu
        endpoint de
        <strong> GET /api/tickets/historial</strong> y auditar las
        conversaciones finalizadas.
      </p>
    </div>
  );
}

export default Historial;
