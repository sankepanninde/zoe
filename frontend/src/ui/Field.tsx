import { forwardRef, useId, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  help?: ReactNode;
}

/** Campo de línea inferior con etiqueta, ayuda y error. */
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, help, id, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const helpId = `${inputId}-help`;
  const errorId = `${inputId}-error`;
  const describedBy = [help ? helpId : "", error ? errorId : ""].filter(Boolean).join(" ") || undefined;

  return (
    <div className="k-field">
      <label className="k-field__label" htmlFor={inputId}>{label}</label>
      <input
        ref={ref}
        id={inputId}
        className="k-input"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {help && <div className="k-help" id={helpId}>{help}</div>}
      <div className="k-error" id={errorId}>{error}</div>
    </div>
  );
});

interface PasswordFieldProps extends Omit<FieldProps, "type"> {}

/** Campo de contraseña con botón para mostrar u ocultar. */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField(
  { label, error, help, id, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;
  const [visible, setVisible] = useState(false);

  return (
    <div className="k-field">
      <label className="k-field__label" htmlFor={inputId}>{label}</label>
      <div className="k-control">
        <input
          ref={ref}
          id={inputId}
          type={visible ? "text" : "password"}
          className="k-input"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...rest}
        />
        <button
          type="button"
          className="k-reveal"
          aria-controls={inputId}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      </div>
      {help && <div className="k-help">{help}</div>}
      <div className="k-error" id={errorId}>{error}</div>
    </div>
  );
});
