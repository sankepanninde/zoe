import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import "./Disponibilidad.css";

/* Mi disponibilidad: la persona marca en qué horarios puede servir, y bloquea fechas
   en que no puede. Muestra los servicios de la iglesia y los turnos de sus ministerios. */

export interface Servicio {
  id: string;
  nombre: string;
  dia: number; // 0 = lunes … 6 = domingo
  hora: string; // "08:00 – 09:30"
}

export interface HorarioMinisterio {
  id: string;
  min: string; // id del ministerio
  ministerioNombre: string;
  nombre: string;
  dia: number;
  hora: string;
}

export interface Bloqueo {
  id: number;
  desde: string; // "2026-10-24"
  hasta: string;
}

export interface DisponibilidadProps {
  /** Pastor que también sirve: la pantalla cambia la etiqueta a "· también sirves". */
  perfil?: "siervo" | "pastor";
  servicios?: Servicio[];
  horariosMinisterio?: HorarioMinisterio[];
  /** Ids de los ministerios a los que pertenece la persona. */
  misMinisterios?: string[];
  /** Ids de los horarios que la persona ya marcó. */
  marcadosIniciales?: string[];
  bloqueosIniciales?: Bloqueo[];
  semanaInicio?: string;
  hoy?: string;
  onCambio?: (marcados: string[], bloqueos: Bloqueo[]) => void;
}

const NOMBRES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const corto = (d: Date) => d.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
const lunesDe = (f: string) => {
  const d = new Date(f + "T00:00");
  return addDays(d, -((d.getDay() + 6) % 7));
};

export function Disponibilidad({
  perfil = "siervo",
  servicios = [],
  horariosMinisterio = [],
  misMinisterios = [],
  marcadosIniciales = [],
  bloqueosIniciales = [],
  semanaInicio = "2026-10-12",
  hoy = "2026-10-13",
  onCambio,
}: DisponibilidadProps) {
  const [semana, setSemana] = useState(() => lunesDe(semanaInicio));
  const [marcados, setMarcados] = useState<Set<string>>(new Set(marcadosIniciales));
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>(bloqueosIniciales);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  // Servicios de la iglesia más los horarios de los ministerios de la persona.
  const todos = useMemo(
    () => [
      ...servicios.map((s) => ({ ...s, min: undefined as string | undefined, nombreMin: undefined as string | undefined })),
      ...horariosMinisterio
        .filter((h) => misMinisterios.includes(h.min))
        .map((h) => ({ id: h.id, nombre: h.nombre, dia: h.dia, hora: h.hora, min: h.min, nombreMin: h.ministerioNombre })),
    ],
    [servicios, horariosMinisterio, misMinisterios],
  );

  const bloqueado = (f: string) => bloqueos.some((b) => f >= b.desde && f <= b.hasta);

  const cambiar = (nuevo: Set<string>, nuevosBloqueos: Bloqueo[]) => {
    setMarcados(nuevo);
    setBloqueos(nuevosBloqueos);
    onCambio?.([...nuevo], nuevosBloqueos);
  };

  const alternar = (id: string) => {
    const nuevo = new Set<string>(marcados);
    nuevo.has(id) ? nuevo.delete(id) : nuevo.add(id);
    cambiar(nuevo, bloqueos);
  };

  const bloquear = (e: FormEvent) => {
    e.preventDefault();
    const fin = hasta || desde;
    if (!desde) return setError("Elige la fecha de inicio.");
    if (fin < desde) return setError("La fecha final debe ser después de la inicial.");
    setError("");
    const nuevo: Bloqueo = { id: Date.now(), desde, hasta: fin };
    setDesde("");
    setHasta("");
    cambiar(marcados, [...bloqueos, nuevo]);
    setAviso("Fechas bloqueadas. No te asignarán turnos en ese rango.");
  };

  const quitarBloqueo = (id: number) => cambiar(marcados, bloqueos.filter((b) => b.id !== id));

  const finSemana = addDays(semana, 6);
  const etiqueta = perfil === "pastor" ? "Mi disponibilidad · también sirves" : "Mi disponibilidad";
  const total = todos.length;
  const resumen =
    marcados.size === 0 ? "Aún no marcas horarios."
      : marcados.size === total ? "Puedes servir en todos los horarios."
        : `Puedes servir en ${marcados.size} de ${total} horarios.`;

  return (
    <div className="disp-wrap">
      <header className="disp-cab">
        <div>
          <span className="k-label">{etiqueta}</span>
          <h1>¿Cuándo puedes servir?</h1>
          <p className="k-muted">{resumen}</p>
        </div>
        <div className="disp-acciones">
          <button type="button" className="k-btn k-btn--ghost k-btn--auto" onClick={() => setSemana(addDays(semana, -7))} aria-label="Semana anterior">←</button>
          <span className="k-muted disp-rango">{corto(semana)} – {corto(finSemana)}</span>
          <button type="button" className="k-btn k-btn--ghost k-btn--auto" onClick={() => setSemana(addDays(semana, 7))} aria-label="Semana siguiente">→</button>
        </div>
      </header>

      {aviso && <div className="aviso" role="status">{aviso}</div>}

      <div className="disp-semana" aria-label="Disponibilidad de la semana">
        {Array.from({ length: 7 }, (_, i) => {
          const d = addDays(semana, i);
          const f = iso(d);
          const lista = todos.filter((s) => s.dia === i);
          const bloq = bloqueado(f);
          return (
            <div key={f} className={"disp-dia" + (f === hoy ? " disp-dia--hoy" : "") + (bloq ? " disp-dia--bloqueado" : "")}>
              <div className="disp-dia__cab">
                <b>{d.getDate()}</b> {NOMBRES[i]}{bloq ? " · no puedo" : ""}
              </div>
              <div className="disp-dia__cuerpo">
                {lista.length === 0 ? (
                  <div className="disp-vacio">Sin servicios</div>
                ) : (
                  lista.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="disp-srv"
                      aria-pressed={marcados.has(s.id)}
                      disabled={bloq}
                      onClick={() => alternar(s.id)}
                    >
                      <span className={"disp-etq" + (s.min ? "" : " disp-etq--iglesia")}>{s.min ? s.nombreMin : "Iglesia"}</span>
                      <strong>{s.nombre}</strong>
                      <small>{s.hora}</small>
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <section className="caja" aria-labelledby="disp-bloqueos">
        <div>
          <h2 id="disp-bloqueos" className="disp-h2">Fechas en que no puedo</h2>
          <p className="k-muted">Vacaciones o una semana puntual. Ahí no te asignan nada.</p>
        </div>
        <form className="disp-form" onSubmit={bloquear} noValidate>
          <label className="k-field">
            <span className="k-field__label">Desde</span>
            <input className="k-input" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </label>
          <label className="k-field">
            <span className="k-field__label">Hasta (opcional)</span>
            <input className="k-input" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </label>
          <button type="submit" className="k-btn k-btn--auto">Bloquear</button>
        </form>
        {error && <p className="k-error" role="alert">{error}</p>}
        <div>
          {bloqueos.length === 0 ? (
            <p className="k-muted">No tienes fechas bloqueadas.</p>
          ) : (
            bloqueos.map((b) => (
              <div key={b.id} className="disp-fila">
                <span>
                  {new Date(b.desde + "T00:00").toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                  {b.hasta !== b.desde && " – " + new Date(b.hasta + "T00:00").toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                </span>
                <button type="button" className="k-btn k-btn--ghost k-btn--auto" onClick={() => quitarBloqueo(b.id)}>Quitar</button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
