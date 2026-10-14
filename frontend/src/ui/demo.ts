/* Datos de ejemplo de dashboard.html. Reemplazar por la respuesta del backend. */
import type { Announcement } from "./Announcements";
import type { Borrador, Evento, HoyItem, IglesiaResumen, Inscripcion, Peticion } from "./Bloques";

export const demoAnuncios: Announcement[] = [
  { id: "1", prioridad: "alta", categoria: "Voluntarios", titulo: "Se necesitan dos personas para sonido", resumen: "Dos voluntarios para la mesa de sonido del domingo.", cuerpo: "Dos voluntarios para la mesa de sonido del servicio de las 9:00 a. m. del domingo. Capacitación el sábado a las 4:00 p. m.\n\nResponde en comentarios.", fecha: "08 oct", leido: false, comentarios: [{ id: "c1", autor: "Andrea R.", cuando: "hace 2 h", texto: "Yo puedo el primer domingo." }] },
  { id: "2", prioridad: "alta", categoria: "Inscripciones", titulo: "Cierre del campamento juvenil: viernes 16", resumen: "Las inscripciones cierran el viernes.", cuerpo: "Las inscripciones cierran el viernes 16 de octubre a las 6:00 p. m.", fecha: "07 oct", leido: false, comentarios: [] },
  { id: "3", prioridad: "media", categoria: "Células", titulo: "Célula de los miércoles en casa de Patricia", resumen: "Durante octubre la célula se reúne en otra casa.", cuerpo: "Durante octubre la célula se reúne en la casa de la hermana Patricia, a las 7:00 p. m.", fecha: "05 oct", leido: true, comentarios: [] },
  { id: "4", prioridad: "baja", categoria: "General", titulo: "Oficina en horario reducido el lunes", resumen: "Atiende de 9:00 a. m. a 12:00 m.", cuerpo: "La oficina atiende de 9:00 a. m. a 12:00 m. el lunes del feriado.", fecha: "03 oct", leido: true, comentarios: [] },
];

export const demoEventos: Evento[] = [
  { id: "e1", cuando: "Dom 12 oct · 9:00", titulo: "Servicio de la mañana", lugar: "Santuario principal" },
  { id: "e2", cuando: "Mié 15 oct · 19:00", titulo: "Células de los miércoles", lugar: "Varias casas" },
  { id: "e3", cuando: "Vie 16 oct · 18:00", titulo: "Cierre de inscripción", lugar: "Campamento juvenil" },
  { id: "e4", cuando: "Dom 19 oct · 9:00", titulo: "Servicio de la mañana", lugar: "Santuario principal" },
];

export const demoHoy: HoyItem[] = [
  { id: "h1", n: 1, texto: "Turno sin cubrir · sonido", rol: "LE", destino: "asignar" },
  { id: "h2", n: 2, texto: "Cierres esta semana", rol: "AD", destino: "sem" },
];

export const demoInscripciones: Inscripcion[] = [
  { id: "i1", nombre: "Campamento juvenil", ocupados: 38, cupo: 50, cierra: "16 oct" },
  { id: "i2", nombre: "Retiro de matrimonios", ocupados: 44, cupo: 45, cierra: "20 oct" },
];

export const demoBorradores: Borrador[] = [
  { id: "b1", titulo: "Retiro: detalles", estado: "borrador", detalle: "Borrador" },
  { id: "b2", titulo: "Ofrenda especial", estado: "programado", detalle: "14 oct" },
];

export const demoPeticiones: Peticion[] = [
  { id: "p1", texto: "Salud familiar", hace: "Hace 2 días" },
];

export const demoIglesias: IglesiaResumen[] = [
  { id: "g1", nombre: "Betania", activos: 4, ultimo: "hace 1 día", sinLeer: 2, activa: true },
  { id: "g2", nombre: "Nueva Vida", activos: 2, ultimo: "hace 6 días", sinLeer: 0, activa: false },
  { id: "g3", nombre: "El Rey", activos: 5, ultimo: "hace 3 horas", sinLeer: 1, activa: true },
];

export const demoTendencia = [0, 1, 0, 2, 1, 3, 4];

import type { DatosRol, RolVista } from "./PanelRol";

export const demoRoles: Record<RolVista, DatosRol> = {
  TE: {
    nombre: "Mateo", ministerio: "Sonido",
    misTurnos: [
      { id: "t1", cuando: "Dom 12 oct · 9:00 a. m.", area: "Mesa de sonido", estado: "pendiente" },
      { id: "t2", cuando: "Dom 19 oct · 9:00 a. m.", area: "Monitores", estado: "confirmado" },
    ],
    cronograma: [
      { id: "c1", cuando: "Dom 12 · 9:00", estado: "falta", faltan: 1, integrantes: "Lucía M. · Andrea R." },
      { id: "c2", cuando: "Mié 15 · 19:00", estado: "completo", integrantes: "Carlos P. · Mateo R." },
    ],
    disponibles: [], semana: [], sinCubrir: 0, usuariosActivos: 0, anunciosRecientes: [], actividad: [],
  },
  LE: {
    nombre: "Carlos", ministerio: "Sonido",
    misTurnos: [{ id: "t3", cuando: "Mié 15 · 19:00", area: "Mesa de sonido", estado: "confirmado" }],
    cronograma: [
      { id: "c1", cuando: "Dom 12 · 9:00", estado: "falta", faltan: 1, integrantes: "Lucía M. · Andrea R." },
      { id: "c2", cuando: "Mié 15 · 19:00", estado: "completo", integrantes: "Carlos P. · Mateo R." },
    ],
    disponibles: [
      { id: "d1", nombre: "Mateo Ruiz", nota: "Libre el domingo 12" },
      { id: "d2", nombre: "Andrea Rojas", nota: "Ya tiene turno ese día" },
    ],
    semana: [], sinCubrir: 1, usuariosActivos: 0, anunciosRecientes: [], actividad: [],
  },
  AD: {
    nombre: "Andrea", ministerio: "Toda la iglesia",
    misTurnos: [], cronograma: [], disponibles: [],
    semana: [
      { dia: "Domingo 12", hora: "9:00 a. m.", ministerios: [{ nombre: "Sonido", cubiertos: 1, total: 2 }, { nombre: "Video", cubiertos: 2, total: 2 }, { nombre: "Recepción", cubiertos: 2, total: 2 }] },
      { dia: "Miércoles 15", hora: "7:00 p. m.", ministerios: [{ nombre: "Sonido", cubiertos: 2, total: 2 }, { nombre: "Alabanza", cubiertos: 3, total: 3 }] },
      { dia: "Domingo 19", hora: "9:00 a. m.", ministerios: [{ nombre: "Sonido", cubiertos: 2, total: 2 }, { nombre: "Recepción", cubiertos: 1, total: 2 }] },
    ],
    sinCubrir: 2, usuariosActivos: 24,
    anunciosRecientes: [
      { id: "a1", titulo: "Se necesitan dos personas para sonido", prioridad: "Alta", cuando: "Publicado hoy" },
      { id: "a2", titulo: "Cierre del campamento juvenil", prioridad: "Alta", cuando: "Publicado ayer" },
    ],
    actividad: [
      { id: "x1", texto: "Mateo R. confirmó Sonido", cuando: "Hace 1 h" },
      { id: "x2", texto: "Carlos P. rechazó Mié 15", cuando: "Hace 3 h" },
    ],
  },
};
