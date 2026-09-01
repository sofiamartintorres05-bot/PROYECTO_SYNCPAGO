import React from "react";
import { Link } from "react-router-dom";

// El backend no tiene endpoint de recuperación de contraseña (no hay envío
// de correos ni tabla de tokens de restablecimiento). Esta página se deja
// visible, con el diseño original, pero informando la limitación real en
// vez de simular un envío que no existe.
export default function ForgotPassword() {
  return (
    <div className="auth-screen">
      <div className="auth-inner">
        <div className="auth-logo">
          SYNC<span>PAGO</span>
        </div>
        <div className="auth-card">
          <h1>Recuperar contraseña</h1>
          <div className="info-box">
            Esta función todavía no está disponible: el backend aún no tiene un
            servicio de recuperación de contraseña por correo. Contacta al
            administrador para restablecer tu acceso mientras se agrega esta
            funcionalidad.
          </div>
        </div>
        <p className="auth-link">
          <Link to="/">Volver al inicio de sesión</Link>
        </p>
      </div>
    </div>
  );
}