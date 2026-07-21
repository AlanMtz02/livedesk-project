import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import styles from './LoginForm.module.css';
import {Loader2, Lock, LogIn, Mail} from 'lucide-react'
import { useNavigate } from "react-router-dom";

function LoginForm(){
  //Obtener variables de contexto
  const { login } = useAuth();

  //Instanciar navegador
  const navigate=useNavigate();

  //Variables de estado
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const manejarEnvio = async (e) => {
    e.preventDefault(); //Evita que recargue la pagina con formularios
    setError(""); //Reniciar errores
    setCargando(true); //Iniciar carga

    // Validación básica en frontend antes de gastar recursos de red
    if (!correo || !contrasena) {
      setError("Por favor, completa todos los campos requeridos.");
      setCargando(false);
      return;
    }

    try{
      //Llamar al endpoint POST de login
      const respuesta = await fetch("http://127.0.0.1:8000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correo: correo, //Misma clave que espera el schema
          password: contrasena, //Misma clave que espera el schema
        }),
      });

      const data = await respuesta.json();
      if (!respuesta.ok) {
        // Captura el 'Credenciales incorrectas.' de los raise HTTPException
        throw new Error(data.detail || "Error al iniciar sesión.");
      }
      //Iniciar sesion usando la funcion login que mete al local storage el token que devuelve el backend, actualiza con seToken,setUsuario y devuelve el rol
      const rol = login(data.access_token);
      // Redirigir de inmediato usando el rol que devolvió el login()
      if (rol === "supervisor") {
        navigate("/supervision", { replace: true });
      } else {
        navigate("/agente", { replace: true });
      }
    }
    catch(err){
        //Actualizar error
        setError(err.message);
    }
    finally{
        //Siempre llegara aqui, y terminara la carga
        setCargando(false);
    }
  };

  return (
    <div className={styles.tarjeta}>
      <h2 className={styles.titulo}>LiveDesk 2026</h2>
      <p className={styles.subtitulo}>Ingresa tus credenciales corporativas</p>
      {error && <div className={styles.alertaError}>{error}</div>}

      <form onSubmit={manejarEnvio}>
        <div className={styles.grupoInput}>
          <label className={styles.etiqueta}>Correo Electrónico</label>
          <div className={styles.inputContenedor}>
            <Mail size={18} className={styles.icono}></Mail>
            <input
              type="email"
              className={styles.campo}
              placeholder="correo@empresa.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              disabled={cargando}
              
            ></input>
          </div>
        </div>
        <div className={styles.grupoInput}>
          <label className={styles.etiqueta}>Contraseña:</label>
          <div className={styles.inputContenedor}>
            <Lock size={18} className={styles.icono}></Lock>
            <input
              type="password"
              className={styles.campo}
              placeholder="••••••••"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              disabled={cargando}
              
            ></input>
          </div>
        </div>
        <button type="submit" className={styles.botonEnviar} disabled={cargando}>
            {cargando ? (
                <>
                <Loader2 size={18} style={{animation:'1s spin linear infinite'}}></Loader2>
                </>
            ) : (
                <>
                <LogIn size={18}></LogIn>
                Iniciar Sesión
                </>
            )}
        </button>
      </form>
    </div>
  );
}

export default LoginForm;