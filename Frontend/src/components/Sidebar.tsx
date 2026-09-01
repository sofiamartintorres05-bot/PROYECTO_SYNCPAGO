import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

interface SidebarProps {
  open: boolean;
  onNavigate: () => void;
}

export default function Sidebar({ open, onNavigate }: SidebarProps) {
  const navigate = useNavigate();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `nav-item${isActive ? " active" : ""}`;

  function handleAgregarGasto() {
    navigate("/gastos?nuevo=1");
    onNavigate();
  }

  return (
    <nav className={`sidebar${open ? " open" : ""}`} id="sidebar" aria-label="Menú principal">
      <div className="sidebar-logo" role="img" aria-label="SyncPago">
        SYNC<span>PAGO</span>
      </div>
      <div className="sidebar-nav">
        <NavLink to="/dashboard" className={linkClass} onClick={onNavigate}>
          🏠 Inicio
        </NavLink>
        <NavLink to="/gastos" className={linkClass} onClick={onNavigate}>
          📋 Mis Gastos
        </NavLink>
        <NavLink to="/recordatorios" className={linkClass} onClick={onNavigate}>
          🔔 Recordatorios
        </NavLink>
        <NavLink to="/estadisticas" className={linkClass} onClick={onNavigate}>
          📊 Estadísticas
        </NavLink>
        <NavLink to="/historial" className={linkClass} onClick={onNavigate}>
          🕓 Historial
        </NavLink>
      </div>
      <button className="nav-btn-add" onClick={handleAgregarGasto}>
        + Agregar Gasto
      </button>
    </nav>
  );
}