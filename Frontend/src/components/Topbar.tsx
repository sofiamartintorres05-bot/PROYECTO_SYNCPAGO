import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface TopbarProps {
  onToggleSidebar: () => void;
}

export default function Topbar({ onToggleSidebar }: TopbarProps) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="topbar" role="banner">
      <button className="menu-toggle" onClick={onToggleSidebar} aria-label="Abrir menú">
        ☰
      </button>
      <div className="search-bar" role="search">
        <span className="search-icon" aria-hidden="true">🔍</span>
        <input type="text" placeholder="Buscar..." aria-label="Buscar" />
      </div>
      <div className="topbar-right">
        <button className="notif-btn" aria-label="Notificaciones">🔔</button>
        <div
          className="user-menu"
          onClick={() => setDropdownOpen((v) => !v)}
          role="button"
          aria-haspopup="true"
        >
          <div className="avatar" aria-hidden="true">👤</div>
          <span>{usuario?.nombre ?? "Usuario"}</span> ▾
          <div className={`user-dropdown${dropdownOpen ? " open" : ""}`} role="menu">
            <div className="dd-header">
              <div className="dd-avatar" aria-hidden="true">👤</div>
              <div className="dd-name">{usuario?.nombre}</div>
              <div className="dd-email">{usuario?.correo}</div>
            </div>
            <div className="dd-item logout" onClick={handleLogout} role="menuitem">
              ↩ Cerrar sesión
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}