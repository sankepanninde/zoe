import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Banner } from "./Banner";
import { Button } from "./Button";
import { Field } from "./Field";

export interface SolicitudIglesia {
  iglesia: string;
  ciudad: string;
  nombre: string;
  correo: string;
  telefono: string;
}

export interface RequestAccessProps {
  /** Envía la solicitud al administrador general. Si falla, debe lanzar un error: el formulario conserva los datos. */
  onSubmit: (data: SolicitudIglesia) => Promise<void>;
  onBack: () => void;
}

type Campo = keyof SolicitudIglesia;

const correoValido = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

/* Solicitud de acceso para una iglesia nueva. La aprueba el administrador general. */
export function RequestAccess({ onSubmit, onBack }: RequestAccessProps) {
  const [datos, setDatos] = useState<SolicitudIglesia>({ iglesia: "", ciudad: "", nombre: "", correo: "", telefono: "" });
  const [errores, setErrores] = useState<Partial<Record<Campo, string>>>({});
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

  function cambiar(campo: Campo) {
    return (e: ChangeEvent<HTMLInputElement>) => setDatos((d) => ({ ...d, [campo]: e.target.value }));
  }

  function validar() {
    const e: Partial<Record<Campo, string>> = {};
    if (!datos.iglesia.trim()) e.iglesia = "Escribe el nombre de tu iglesia.";
    if (!datos.nombre.trim()) e.nombre = "Escribe tu nombre.";
    if (!datos.correo.trim()) e.correo = "Escribe un correo de contacto.";
    else if (!correoValido(datos.correo.trim())) e.correo = "Revisa el formato, por ejemplo nombre@iglesia.org.";
    setErrores(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    setAviso(null);
    if (!validar()) return;
    setCargando(true);
    try {
      await onSubmit({
        iglesia: datos.iglesia.trim(),
        ciudad: datos.ciudad.trim(),
        nombre: datos.nombre.trim(),
        correo: datos.correo.trim(),
        telefono: datos.telefono.trim(),
      });
      setEnviado(true);
    } catch {
      setAviso("No pudimos enviar tu solicitud. Tus datos siguen aquí; intenta de nuevo.");
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
        <section className="k-login-card" aria-labelledby="titulo-solicitar">
          <div className="k-heading">
            <h1 id="titulo-solicitar">Solicita acceso para tu iglesia.</h1>
            <p>Revisamos cada solicitud y te enviamos el código de tu iglesia por correo. Suele tomar un día hábil.</p>
          </div>

          {enviado ? (
            <div className="k-form">
              <Banner tone="info">
                Recibimos tu solicitud. Te escribiremos al correo que nos diste cuando tu iglesia esté lista.
              </Banner>
              <Button variant="ghost" onClick={onBack}>Volver a entrar</Button>
            </div>
          ) : (
            <form className="k-form" onSubmit={handleSubmit} noValidate>
              {aviso && <Banner tone="bad">{aviso}</Banner>}

              <Field
                label="Nombre de la iglesia"
                autoComplete="organization"
                placeholder="Iglesia Betania"
                value={datos.iglesia}
                onChange={cambiar("iglesia")}
                error={errores.iglesia}
              />

              <Field
                label="Ciudad"
                autoComplete="address-level2"
                placeholder="Bogotá"
                value={datos.ciudad}
                onChange={cambiar("ciudad")}
              />

              <Field
                label="Tu nombre"
                autoComplete="name"
                placeholder="Nombre y apellido"
                value={datos.nombre}
                onChange={cambiar("nombre")}
                error={errores.nombre}
              />

              <Field
                label="Correo de contacto"
                type="email"
                autoComplete="email"
                placeholder="nombre@iglesia.org"
                value={datos.correo}
                onChange={cambiar("correo")}
                error={errores.correo}
              />

              <Field
                label="Teléfono"
                type="tel"
                autoComplete="tel"
                placeholder="300 000 0000"
                value={datos.telefono}
                onChange={cambiar("telefono")}
                help="Opcional. Solo para confirmar tu solicitud."
              />

              <Button type="submit" loading={cargando} loadingText="Enviando…">
                Enviar solicitud
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
