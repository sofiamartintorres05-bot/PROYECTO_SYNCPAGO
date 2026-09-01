import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute() {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return null;
  }

  if (!usuario) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}