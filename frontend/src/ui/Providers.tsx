interface ProvidersProps {
  onSelect: (provider: "google" | "microsoft") => void;
}

/** Botones de inicio con proveedores, con separador hacia el formulario de correo. */
export function Providers({ onSelect }: ProvidersProps) {
  return (
    <>
      <div className="k-providers">
        <button type="button" className="k-provider" onClick={() => onSelect("google")}>
          Continuar con Google
        </button>
        <button type="button" className="k-provider" onClick={() => onSelect("microsoft")}>
          Continuar con Microsoft
        </button>
      </div>
      <div className="k-divider" aria-hidden="true">o con correo</div>
    </>
  );
}