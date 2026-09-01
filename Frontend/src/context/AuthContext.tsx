import React, { createContext, useEffect, useState } from "react";
import type { Usuario } from "../interfaces/usuario";
import { usuariosService } from "../services/usuariosService";

const STORAGE_KEY = "sp_usuario";

interface AuthContextValue {
  usuario: Usuario | null;
  cargando: boolean;
  login: (correo: string, contrasena: string) => Promise<void>;
  registrar: (
    nombre: string,
    correo: string,
    contrasena: string,
    telefono?: string
  ) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (guardado) {
      try {
        setUsuario(JSON.parse(guardado));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setCargando(false);
  }, []);

  async function login(correo: string, contrasena: string) {
    const data = await usuariosService.login(correo, contrasena);
    setUsuario(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  async function registrar(
    nombre: string,
    correo: string,
    contrasena: string,
    telefono?: string
  ) {
    const data = await usuariosService.registrar(nombre, correo, contrasena, telefono);
    setUsuario(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function logout() {
    setUsuario(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, registrar, logout }}>
      {children}
    </AuthContext.Provider>
  );
}