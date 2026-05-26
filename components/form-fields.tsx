"use client";

// Helpers compartidos por los drawers de formularios.
// Mantienen el look del sistema (panel-2 cuando hay value, focus violeta).

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2.5">
        <span className="text-[11.5px] font-semibold text-ink-2">{label}</span>
        {hint && <span className="text-[11px] text-muted-2">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

interface InputProps {
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  filled?: boolean;
  step?: string;
  min?: string | number;
  autoFocus?: boolean;
}

export function FormInput({
  type,
  value,
  onChange,
  placeholder,
  required,
  filled,
  step,
  min,
  autoFocus,
}: InputProps) {
  const bg = filled ? "bg-panel-2 border-line" : "bg-panel border-line";
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      step={step}
      min={min}
      autoFocus={autoFocus}
      className={`border rounded-md px-3 py-2.5 font-body text-[13.5px] text-ink w-full focus:outline-none focus:border-violeta focus:shadow-[0_0_0_3px_var(--color-violeta-soft)] placeholder:text-muted-2 ${bg}`}
    />
  );
}

interface TextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  minHeight?: string;
  maxLength?: number;
}

export function FormTextarea({
  value,
  onChange,
  placeholder,
  required,
  minHeight = "70px",
  maxLength = 2000,
}: TextareaProps) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      maxLength={maxLength}
      style={{ minHeight }}
      className="bg-panel border border-line rounded-md px-3 py-2.5 font-body text-[13.5px] text-ink resize-y leading-[1.5] focus:outline-none focus:border-violeta focus:shadow-[0_0_0_3px_var(--color-violeta-soft)] placeholder:text-muted-2"
    />
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="font-body text-[10.5px] bg-white border border-line px-1.5 py-px rounded-sm text-muted mx-px">
      {children}
    </kbd>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10.5px] font-bold tracking-[0.06em] uppercase text-muted">
      {children}
    </div>
  );
}

interface ChipsProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}

export function Chips<T extends string>({ options, value, onChange }: ChipsProps<T>) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`px-3.5 py-1.5 rounded-full font-medium text-[12.5px] cursor-pointer border transition ${
              selected
                ? "bg-ink text-white border-ink"
                : "bg-panel text-ink-2 border-line hover:border-ink-2"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

interface FormFooterProps {
  onCancel: () => void;
  submitLabel: string;
  pending: boolean;
  pendingLabel?: string;
  variant?: "primary" | "danger" | "success";
  hint?: React.ReactNode;
}

// Footer estándar: hint a la izquierda (oculto en mobile), grid de
// Cancelar + acción primaria a la derecha (apilado vertical en mobile).
export function FormFooter({
  onCancel,
  submitLabel,
  pending,
  pendingLabel,
  variant = "primary",
  hint,
}: FormFooterProps) {
  const primary =
    variant === "danger"
      ? "bg-rojo text-white border border-rojo hover:opacity-90"
      : variant === "success"
        ? "bg-verde text-white border border-verde hover:opacity-90"
        : "bg-ink text-white border border-ink hover:bg-violeta hover:border-violeta";
  return (
    <>
      <span className="hidden md:inline-flex items-center gap-1 text-[11.5px] text-muted">
        {hint ?? (
          <>
            <Kbd>⌘</Kbd>
            <Kbd>↵</Kbd> confirmar
          </>
        )}
      </span>
      <div className="grid grid-cols-[1fr_2fr] md:flex md:gap-2.5 gap-2 w-full md:w-auto">
        <button
          type="button"
          onClick={onCancel}
          className="border border-line bg-panel text-ink-2 rounded-md font-medium text-[13px] px-4 py-2.5 md:py-2 hover:border-ink-2 cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className={`${primary} rounded-md font-medium text-[13px] px-4 py-2.5 md:py-2 cursor-pointer disabled:opacity-60 disabled:cursor-wait`}
        >
          {pending ? (pendingLabel ?? "Guardando...") : submitLabel}
        </button>
      </div>
    </>
  );
}

interface ErrorBannerProps {
  error: string | null;
}

export function ErrorBanner({ error }: ErrorBannerProps) {
  if (!error) return null;
  return (
    <div className="bg-rojo-soft border border-rojo/20 text-rojo text-[12.5px] rounded-md px-3 py-2">
      {error}
    </div>
  );
}
