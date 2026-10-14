import { useState } from "react";
import type { FormEvent } from "react";
import { Banner } from "./Banner";
import { Button } from "./Button";
import { Field } from "./Field";

export interface ForgotPasswordProps {
  /** Envía el enlace de recuperación. Si falla, debe lanzar un error. */
  onSubmit: (correo: string) => Promise<void>;
  onBack: () => void;
}

/* Recuperar contraseña. Por seguridad, el mensaje de éxito no revela si el correo existe. */
export function ForgotPassword({ onSubmit, onBack }: ForgotPasswordProps) {
  const [correo, setCorreo] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [aviso, setAviso] = useState<{ tone: "bad"; text: string } | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    const mail = correo.trim();
    setAviso(null);
    if (!mail) return setError("Escribe tu correo.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) return setError("Revisa el formato, por ejemplo nombre@iglesia.org.");
    setError(undefined);
    setCargando(true);
    try {
      await onSubmit(mail);
      setEnviado(true);
    } catch {
      setAviso({ tone: "bad", text: "No pudimos enviar el enlace. Revisa tu conexión e intenta de nuevo." });
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="k-page">
      <header className="k-page__top">
        <span className="k-mark">Gestión eclesial</span>
        <span>Acceso seguro</span>
      </header>

      <main className="k-page__main">
        <section className="k-login-card" aria-labelledby="titulo-recuperar">
          <div className="k-heading">
            <h1 id="titulo-recuperar">Recupera tu acceso.</h1>
            <p>Escribe el correo de tu cuenta y te enviaremos un enlace para crear una contraseña nueva.</p>
          </div>

          {enviado ? (
            <div className="k-form">
              <Banner tone="info">
                Si el correo está registrado, en unos minutos recibirás el enlace. Revisa también tu carpeta de spam.
              </Banner>
              <Button variant="ghost" onClick={onBack}>Volver a entrar</Button>
            </div>
          ) : (
            <form className="k-form" onSubmit={handleSubmit} noValidate>
              {aviso && <Banner tone={aviso.tone}>{aviso.text}</Banner>}

              <Field
                label="Correo"
                type="email"
                autoComplete="username"
                placeholder="nombre@iglesia.org"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                error={error}
              />

              <Button type="submit" loading={cargando} loadingText="Enviando…">
                Enviar enlace
              </Button>

              <p className="k-foot">
                <button type="button" className="k-link" onClick={onBack} style={{ justifySelf: "start", background: "none", border: 0, padding: 0, cursor: "pointer", font: "inherit" }}>
                  Volver a entrar
                </button>
              </p>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
