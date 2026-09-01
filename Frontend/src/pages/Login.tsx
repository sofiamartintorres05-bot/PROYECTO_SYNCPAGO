import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!correo || !contrasena) {
      setError("Completa correo y contraseña.");
      return;
    }

    setCargando(true);
    try {
      await login(correo, contrasena);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-inner">
        <div className="auth-logo">
          SYNC<span>PAGO</span>
        </div>
        <div className="auth-card">
          <h1>Iniciar sesión</h1>
          <form onSubmit={handleSubmit}>
            <div className={`field-group${error ? " error" : ""}`}>
              <span className="icon">✉</span>
              <input
                type="email"
                placeholder="Correo electrónico"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />
            </div>
            <div className={`field-group${error ? " error" : ""}`}>
              <span className="icon">🔒</span>
              <input
                type="password"
                placeholder="Contraseña"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
              />
              {error && <span className="field-error">{error}</span>}
            </div>
            <button className="btn-primary" type="submit" disabled={cargando}>
              {cargando ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
          <Link to="/recuperar" className="forgot-link">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <p className="auth-link">
          ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}