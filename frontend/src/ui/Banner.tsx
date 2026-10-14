import type { ReactNode } from "react";

export type BannerTone = "info" | "warn" | "bad";

interface BannerProps {
  tone?: BannerTone;
  children: ReactNode;
  action?: { label: string; onClick: () => void };
  hidden?: boolean;
}

/**
 * Mensaje de estado arriba de un formulario.
 * "bad" usa role="alert" (error inmediato); los demás usan role="status".
 */
export function Banner({ tone = "info", children, action, hidden }: BannerProps) {
  return (
    <div
      className={`k-banner k-banner--${tone}`}
      role={tone === "bad" ? "alert" : "status"}
      hidden={hidden}
    >
      <span>{children}</span>
      {action && (
        <button type="button" className="k-banner__action" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
