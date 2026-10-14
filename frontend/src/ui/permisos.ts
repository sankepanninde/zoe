/**
 * Matriz de permisos de la plataforma.
 * Fuente única: la usan la vista de roles y el panel según rol.
 * El backend debe aplicar las mismas reglas; esto solo controla lo que se muestra.
 */

export type Rol = "SUPER_ADMIN" | "ADMIN" | "LEADER" | "TECHNICIAN";
export type Nivel = "si" | "parcial" | "no";

export const roles: Rol[] = ["SUPER_ADMIN", "ADMIN", "LEADER", "TECHNICIAN"];

export const rolEtiqueta: Record<Rol, string> = {
  SUPER_ADMIN: "Super admin",
  ADMIN: "Admin",
  LEADER: "Líder",
  TECHNICIAN: "Técnico",
};

export interface Permiso {
  id: string;
  nombre: string;
  /** true cuando la regla todavía no está confirmada por el equipo. */
  supuesto?: boolean;
  valores: Record<Rol, [Nivel, string]>;
}

export const permisos: Permiso[] = [
  {
    id: "cronograma",
    nombre: "Ver cronograma",
    valores: {
      SUPER_ADMIN: ["si", "Todas las iglesias"],
      ADMIN: ["si", "Su iglesia"],
      LEADER: ["parcial", "Sus ministerios"],
      TECHNICIAN: ["parcial", "Solo su ministerio, lectura"],
    },
  },
  {
    id: "crearServicios",
    nombre: "Crear servicios",
    valores: {
      SUPER_ADMIN: ["si", "Automático al agregar servidores"],
      ADMIN: ["si", "Automático al agregar servidores"],
      LEADER: ["parcial", "Automático en su ministerio"],
      TECHNICIAN: ["no", "No"],
    },
  },
  {
    id: "editarServicios",
    nombre: "Editar servicios",
    valores: {
      SUPER_ADMIN: ["si", "Sí"],
      ADMIN: ["si", "Sí"],
      LEADER: ["parcial", "Solo donde participa su ministerio"],
      TECHNICIAN: ["no", "No"],
    },
  },
  {
    id: "asignar",
    nombre: "Asignar técnicos",
    valores: {
      SUPER_ADMIN: ["si", "Sí"],
      ADMIN: ["si", "Cualquiera"],
      LEADER: ["parcial", "Solo de sus ministerios"],
      TECHNICIAN: ["no", "No"],
    },
  },
  {
    id: "confirmar",
    nombre: "Confirmar o rechazar turnos",
    valores: {
      SUPER_ADMIN: ["no", "No aplica"],
      ADMIN: ["no", "No aplica"],
      LEADER: ["si", "Sus turnos"],
      TECHNICIAN: ["si", "Sus turnos"],
    },
  },
  {
    id: "usuarios",
    nombre: "Crear, editar o desactivar usuarios",
    valores: {
      SUPER_ADMIN: ["si", "Sí"],
      ADMIN: ["si", "Sí"],
      LEADER: ["parcial", "Solo de sus ministerios"],
      TECHNICIAN: ["no", "No"],
    },
  },
  {
    id: "crearAdmin",
    nombre: "Crear administradores y líderes",
    supuesto: true,
    valores: {
      SUPER_ADMIN: ["si", "Sí"],
      ADMIN: ["si", "Sí, incluido admin"],
      LEADER: ["no", "No"],
      TECHNICIAN: ["no", "No"],
    },
  },
  {
    id: "claves",
    nombre: "Resetear contraseñas",
    supuesto: true,
    valores: {
      SUPER_ADMIN: ["si", "Sí"],
      ADMIN: ["si", "Cualquiera"],
      LEADER: ["parcial", "Solo de sus técnicos"],
      TECHNICIAN: ["parcial", "Solo la propia"],
    },
  },
  {
    id: "configurar",
    nombre: "Configurar iglesia, ministerios y tipos de servicio",
    valores: {
      SUPER_ADMIN: ["si", "Sí"],
      ADMIN: ["si", "Sí"],
      LEADER: ["no", "No"],
      TECHNICIAN: ["no", "No"],
    },
  },
  {
    id: "sensibles",
    nombre: "Ver datos sensibles de otros",
    supuesto: true,
    valores: {
      SUPER_ADMIN: ["si", "Sí"],
      ADMIN: ["si", "Sí"],
      LEADER: ["no", "No"],
      TECHNICIAN: ["no", "No"],
    },
  },
  {
    id: "publicar",
    nombre: "Publicar anuncios",
    supuesto: true,
    valores: {
      SUPER_ADMIN: ["si", "Sí"],
      ADMIN: ["si", "Toda la iglesia"],
      LEADER: ["parcial", "Solo a su ministerio"],
      TECHNICIAN: ["no", "No"],
    },
  },
  {
    id: "leerAnuncios",
    nombre: "Leer anuncios",
    valores: {
      SUPER_ADMIN: ["si", "Sí"],
      ADMIN: ["si", "Sí"],
      LEADER: ["si", "Sí"],
      TECHNICIAN: ["si", "Sí"],
    },
  },
  {
    id: "impersonar",
    nombre: "Ver la plataforma como otro usuario",
    supuesto: true,
    valores: {
      SUPER_ADMIN: ["parcial", "Con registro de auditoría"],
      ADMIN: ["no", "No"],
      LEADER: ["no", "No"],
      TECHNICIAN: ["no", "No"],
    },
  },
  {
    id: "miClave",
    nombre: "Cambiar la propia contraseña",
    valores: {
      SUPER_ADMIN: ["si", "Sí"],
      ADMIN: ["si", "Sí"],
      LEADER: ["si", "Sí"],
      TECHNICIAN: ["si", "Sí"],
    },
  },
];

export function permiso(id: string): Permiso {
  const p = permisos.find((x) => x.id === id);
  if (!p) throw new Error(`Permiso desconocido: ${id}`);
  return p;
}

/** Devuelve true si el rol tiene algún nivel de acceso a la acción. */
export function puede(rol: Rol, id: string): boolean {
  return permiso(id).valores[rol][0] !== "no";
}
