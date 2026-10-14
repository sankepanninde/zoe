import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  block?: boolean;
  loading?: boolean;
  loadingText?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    block = true,
    loading = false,
    loadingText = "Cargando…",
    disabled,
    children,
    className = "",
    ...rest
  },
  ref
) {
  const classes = [
    "k-btn",
    variant === "ghost" ? "k-btn--ghost" : "",
    block ? "" : "k-btn--auto",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? loadingText : children}
    </button>
  );
});
