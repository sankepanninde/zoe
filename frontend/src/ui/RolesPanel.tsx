import { useMemo, useState } from "react";
import { permisos, puede, rolEtiqueta, roles } from "./permisos";
import type { Nivel, Rol } from "./permisos";

export interface UsuarioGestion {
  id: string;
  nombre: string;
  ministerio: string;
  rol: Rol;
}

export interface RolesPanelProps {
  /** Rol con el que se está viendo el panel. */
  rolActual: Rol;
  usuarios: UsuarioGestion[];
  onCambiarRol?: (usuarioId: string, rol: Rol) => void;
  onResetearClave?: (usuarioId: string) => void;
  /** Solo SUPER_ADMIN. El padre debe registrar la acción en auditoría. */
  onVerComo?: (usuarioId: string) => void;
}

const estadoTexto: Record<Nivel, string> = { si: "Disponible", parcial: "Parcial", no: "No disponible" };
const estadoClase: Record<Nivel, string> = { si: "k-status--ok", parcial: "k-status--warn", no: "k-status--mute" };
const marca: Record<Nivel, string> = { si: "✓", parcial: "◐", no: "—" };

/** Panel de roles: tarjetas, vista previa por rol, matriz y usuarios. */
export function RolesPanel({ rolActual, usuarios, onCambiarRol, onResetearClave, onVerComo }: RolesPanelProps) {
  const [vista, setVista] = useState<Rol>(rolActual);
  const [bannerUsuario, setBannerUsuario] = useState<string | null>(null);

  const modulos = useMemo(
    () => [
      { nombre: "Cronograma", id: "cronograma" },
      { nombre: "Servicios", id: "editarServicios" },
      { nombre: "Asignaciones", id: "asignar" },
      { nombre: "Mis turnos", id: "confirmar" },
      { nombre: "Usuarios", id: "usuarios" },
      { nombre: "Configuración", id: "configurar" },
      { nombre: "Anuncios", id: "publicar" },
      { nombre: "Ver como otro usuario", id: "impersonar" },
    ],
    []
  );

  return (
    <div className="k-panel">
      <header className="k-top">
        <span className="k-mark">Roles y permisos</span>
        <div className="k-seg" role="group" aria-label="Vista previa como">
          {roles.map((r) => (
            <button key={r} type="button" aria-pressed={vista === r} onClick={() => setVista(r)}>
              {rolEtiqueta[r]}
            </button>
          ))}
        </div>
      </header>

      <section className="k-grid-4" aria-label="Roles">
        {roles.map((r) => (
          <button
            key={r}
            type="button"
            className="k-card k-role"
            aria-pressed={vista === r}
            onClick={() => setVista(r)}
          >
            <span className="k-role__name">{r}</span>
            <span className="k-muted">{rolEtiqueta[r]}</span>
          </button>
        ))}
      </section>

      <section aria-labelledby="k-prev">
        <div className="k-sec-title" id="k-prev"><span>Qué ve este rol</span><span>{rolEtiqueta[vista]}</span></div>
        <div className="k-grid-2">
          {modulos.map((m) => {
            const [nivel, detalle] = permisos.find((p) => p.id === m.id)!.valores[vista];
            return (
              <div className="k-card k-module" key={m.id}>
                <span>{m.nombre}</span>
                <span className={`k-status ${estadoClase[nivel]}`}>{estadoTexto[nivel]}</span>
                <small className="k-muted">{detalle}</small>
              </div>
            );
          })}
        </div>
      </section>

      {bannerUsuario && (
        <div className="k-banner k-banner--warn" role="status">
          <span>Estás viendo la plataforma como <strong>{bannerUsuario}</strong>. Cada acción queda registrada.</span>
          <button type="button" className="k-banner__action" onClick={() => setBannerUsuario(null)}>Salir de la vista</button>
        </div>
      )}

      <section aria-labelledby="k-matriz">
        <div className="k-sec-title" id="k-matriz"><span>Matriz de permisos</span><span>✓ sí · ◐ parcial · — no</span></div>
        <div className="k-table-wrap">
          <table className="k-table">
            <thead>
              <tr>
                <th>Acción</th>
                {roles.map((r) => (
                  <th key={r} aria-current={r === vista ? "true" : undefined}>{rolEtiqueta[r]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permisos.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.nombre}
                    {p.supuesto && <span className="k-tag k-tag--supuesto">Supuesto</span>}
                  </td>
                  {roles.map((r) => {
                    const [nivel, detalle] = p.valores[r];
                    return (
                      <td key={r}>
                        <span className="k-cell">
                          <span aria-hidden="true">{marca[nivel]}</span>
                          {detalle}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="k-usuarios">
        <div className="k-sec-title" id="k-usuarios"><span>Usuarios</span></div>
        <div className="k-table-wrap">
          <table className="k-table">
            <thead>
              <tr><th>Nombre</th><th>Ministerio</th><th>Rol</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {usuarios.map((u) => {
                const puedeGestionar = puede(vista, "usuarios");
                const puedeClave = puede(vista, "claves");
                const puedeVerComo = puede(vista, "impersonar") && Boolean(onVerComo);
                const opciones = roles.filter((r) =>
                  vista === "SUPER_ADMIN" || (vista === "ADMIN" && r !== "SUPER_ADMIN") || (vista === "LEADER" && r === "TECHNICIAN")
                );
                return (
                  <tr key={u.id}>
                    <td>{u.nombre}</td>
                    <td>{u.ministerio}</td>
                    <td>
                      <label className="k-sr" htmlFor={`rol-${u.id}`}>Rol de {u.nombre}</label>
                      <select
                        id={`rol-${u.id}`}
                        className="k-select k-select--compact"
                        value={u.rol}
                        disabled={!puedeGestionar}
                        onChange={(e) => onCambiarRol?.(u.id, e.target.value as Rol)}
                      >
                        {roles.map((r) => (
                          <option key={r} value={r} disabled={!opciones.includes(r)}>{rolEtiqueta[r]}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className="k-acts">
                        <button type="button" className="k-link-btn" disabled={!puedeClave} onClick={() => onResetearClave?.(u.id)}>
                          Resetear contraseña
                        </button>
                        {puedeVerComo && (
                          <button
                            type="button"
                            className="k-link-btn"
                            onClick={() => {
                              setBannerUsuario(u.nombre);
                              onVerComo?.(u.id);
                            }}
                          >
                            Ver como
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
