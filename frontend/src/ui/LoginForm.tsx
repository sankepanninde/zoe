import { useState } from "react";
import type { FormEvent } from "react";
import { Banner } from "./Banner";
import type { BannerTone } from "./Banner";
import { Button } from "./Button";
import { Field, PasswordField } from "./Field";
import { Providers } from "./Providers";

export type Reason = "credenciales" | "bloqueada" | "red" | "sesion";

/** Resultado que devuelve el backend. Los errores de credenciales no dicen cuál campo falló. */
export type LoginResult =
  | { ok: true }
  | { ok: false; reason: Reason };

export interface LoginFormProps {
  sessionExpired?: boolean;
  /** Si falla por red, debe lanzar un error: el formulario muestra el aviso de conexión. */
  onSubmit: (data: { correo: string; clave: string }) => Promise<LoginResult>;
  onProvider?: (provider: "google") => void;
  onRecover?: () => void;
  onRequestAccess?: () => void;
  onHelp?: () => void;
}

const mensajes: Record<Reason, { tone: BannerTone; text: string }> = {
  credenciales: { tone: "bad", text: "El correo o la contraseña no coinciden. Revisa e intenta de nuevo." },
  bloqueada: { tone: "warn", text: "Demasiados intentos fallidos. Intenta de nuevo en 15 minutos." },
  red: { tone: "bad", text: "No pudimos conectar. Revisa tu conexión e intenta de nuevo." },
  sesion: { tone: "info", text: "Tu sesión venció. Entra de nuevo para continuar." },
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
    <div className="k-page k-page--compacta">
      <header className="k-page__top">
        <span className="k-mark">Gestión eclesial</span>
        <span>Acceso seguro</span>
      </header>

      <main className="k-page__main">
        <section className="k-login-card" aria-labelledby="titulo">
          <div className="k-heading">
            <h1 id="titulo">Bienvenido de nuevo.</h1>
            <p>Todo lo que sirves, en un solo lugar.</p>
          </div>

          <form className="k-form" onSubmit={handleSubmit} noValidate>
            {aviso && <Banner tone={aviso.tone}>{aviso.text}</Banner>}

            {onProvider && <Providers onSelect={onProvider} />}

            <Field
              label="Correo"
              type="email"
              autoComplete="username"
              placeholder="nombre@iglesia.org"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              error={errores.correo}
            />

            <PasswordField
              label="Contraseña"
              autoComplete="current-password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              error={errores.clave}
            />

            <div className="k-row">
              <label className="k-check">
                <input type="checkbox" name="recordar" /> Mantener sesión
              </label>
              {onRecover ? (
                <button type="button" className="k-link" onClick={onRecover} style={linkBoton}>
                  ¿Olvidaste tu contraseña?
                </button>
              ) : (
                <a className="k-link" href="#recuperar">¿Olvidaste tu contraseña?</a>
              )}
            </div>

            <Button type="submit" loading={cargando} loadingText="Verificando…">
              Entrar
            </Button>

            <div className="k-foot">
              <span>¿Tu iglesia aún no tiene cuenta?</span>
              {onRequestAccess ? (
                <button type="button" className="k-link" onClick={onRequestAccess} style={linkBoton}>
                  Solicitar acceso para mi iglesia
                </button>
              ) : (
                <a className="k-link" href="#solicitar">Solicitar acceso para mi iglesia</a>
              )}
              {onHelp && (
                <button type="button" className="k-link" onClick={onHelp} style={linkBoton}>
                  ¿Necesitas ayuda?
                </button>
              )}
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}