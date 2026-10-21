import { useState } from "react";
import type { FormEvent } from "react";
import "./LoginForm.css";

export type Reason = "credenciales" | "bloqueada" | "red" | "sesion";

/** Resultado que devuelve el backend. Los errores de credenciales no dicen cuál campo falló. */
export type LoginResult =
  | { ok: true }
  | { ok: false; reason: Reason };

export interface LoginFormProps {
  sessionExpired?: boolean;
  /** Si falla por red, debe lanzar un error: el formulario muestra el aviso de conexión. */
  onSubmit: (data: { correo: string; clave: string }) => Promise<LoginResult>;
  onProvider?: (provider: "google" | "microsoft") => void;
  onRecover?: () => void;
  onRequestAccess?: () => void;
  onHelp?: () => void;
}

const mensajes: Record<Reason, { tono: "bad" | "warn" | "info"; texto: string }> = {
  credenciales: { tono: "bad", texto: "El correo o la contraseña no coinciden. Revisa e intenta de nuevo." },
  bloqueada: { tono: "warn", texto: "Demasiados intentos fallidos. Intenta de nuevo en 15 minutos." },
  red: { tono: "bad", texto: "No pudimos conectar. Revisa tu conexión e intenta de nuevo." },
  sesion: { tono: "info", texto: "Tu sesión venció. Entra de nuevo para continuar." },
};

const linkBoton = { justifySelf: "start", background: "none", border: 0, padding: 0, cursor: "pointer", font: "inherit" } as const;

export function LoginForm({
  sessionExpired = false,
  onSubmit,
  onProvider,
  onRecover,
  onRequestAccess,
  onHelp,
}: LoginFormProps) {
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [errores, setErrores] = useState<{ correo?: string; clave?: string }>({});
  const [estado, setEstado] = useState<LoginResult | null>(null);
  const [red, setRed] = useState(false);
  const [cargando, setCargando] = useState(false);

  function validar() {
    const e: typeof errores = {};
    const mail = correo.trim();
    if (!mail) e.correo = "Escribe tu correo.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) e.correo = "Revisa el formato, por ejemplo nombre@iglesia.org.";
    if (!clave) e.clave = "Escribe tu contraseña.";
    else if (clave.length < 8) e.clave = "Debe tener al menos 8 caracteres.";
    setErrores(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    setEstado(null);
    setRed(false);
    if (!validar()) return;
    setCargando(true);
    try {
      const res = await onSubmit({ correo: correo.trim(), clave });
      setEstado(res);
    } catch {
      setRed(true);
    } finally {
      setCargando(false);
    }
  }

  const aviso = red
    ? mensajes.red
    : estado && !estado.ok
      ? mensajes[estado.reason]
      : sessionExpired
        ? mensajes.sesion
        : null;

  return (
    <div className="login-wrap">
      <section className="login-card" aria-labelledby="titulo">
        <div className="login-mark">Gestión eclesial</div>
        <h1 id="titulo" className="login-title">Bienvenido <em>de nuevo</em>.</h1>
        <p className="login-sub">Todo lo que sirves, en un solo lugar.</p>

        {aviso && <p className="login-aviso" data-tono={aviso.tono} role="alert">{aviso.texto}</p>}

        {onProvider && (
          <>
            <button type="button" className="login-prov" onClick={() => onProvider("google")}>
              Continuar con Google
            </button>
            <button type="button" className="login-prov" onClick={() => onProvider("microsoft")}>
              Continuar con Microsoft
            </button>
          </>
        )}

        {onProvider && <div className="login-or">o con correo</div>}

        <form onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: 14 }}>
          <label className="login-field">
            Correo
            <input
              type="email"
              autoComplete="username"
              placeholder="nombre@iglesia.org"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              aria-invalid={errores.correo ? true : undefined}
            />
            <span className="login-error">{errores.correo}</span>
          </label>

          <label className="login-field">
            Contraseña
            <input
              type="password"
              autoComplete="current-password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              aria-invalid={errores.clave ? true : undefined}
            />
            <span className="login-error">{errores.clave}</span>
          </label>

          <button type="submit" className="login-btn" disabled={cargando}>
            {cargando ? "Verificando…" : "Entrar"}
          </button>
        </form>

        <div className="login-foot">
          <span>¿Tu iglesia aún no tiene cuenta?</span>
          {onRequestAccess ? (
            <button type="button" className="login-link" onClick={onRequestAccess} style={linkBoton}>
              Solicitar acceso
            </button>
          ) : (
            <a className="login-link" href="#solicitar">Solicitar acceso</a>
          )}
          {onRecover && (
            <button type="button" className="login-link" onClick={onRecover} style={linkBoton}>
              ¿Olvidaste tu contraseña?
            </button>
          )}
          {onHelp && (
            <button type="button" className="login-link" onClick={onHelp} style={linkBoton}>
              ¿Necesitas ayuda?
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
