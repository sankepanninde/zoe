import { useId } from "react";

export interface TabOption<T extends string> {
  value: T;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface TabsProps<T extends string> {
  label: string;
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Pestañas de rol con navegación por flechas. */
export function Tabs<T extends string>({ label, options, value, onChange }: TabsProps<T>) {
  const groupId = useId();

  function move(current: number, step: number) {
    const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
    const pos = enabled.indexOf(current);
    const next = enabled[(pos + step + enabled.length) % enabled.length];
    onChange(options[next].value);
    document.getElementById(`${groupId}-${options[next].value}`)?.focus();
  }

  return (
    <div className="k-tabs" role="tablist" aria-label={label}>
      {options.map((opt, i) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            id={`${groupId}-${opt.value}`}
            role="tab"
            type="button"
            className="k-tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") move(i, 1);
              if (e.key === "ArrowLeft") move(i, -1);
            }}
          >
            {opt.label}
            {opt.description && <small>{opt.description}</small>}
          </button>
        );
      })}
    </div>
  );
}
