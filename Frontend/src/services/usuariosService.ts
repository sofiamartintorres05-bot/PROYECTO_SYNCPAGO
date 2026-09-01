import { api } from "./api";
import type { Usuario } from "../interfaces/usuario";

export const usuariosService = {
  login(correo: string, contrasena: string) {
    return api.post<Usuario>("/usuarios/login", { correo, contrasena });
  },

  registrar(nombre: string, correo: string, contrasena: string, telefono?: string) {
    return api.post<Usuario>("/usuarios/registro", {
      nombre,
      correo,
      contrasena,
      telefono,
    });
  },

  obtener(idUsuario: number) {
    return api.get<Usuario>(`/usuarios/${idUsuario}`);
  },
};