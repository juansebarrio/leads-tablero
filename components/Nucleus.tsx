// Núcleo de marca JS80 — el sello visual del estudio.
// Usado en sidebar (brand), topbar mobile, y AI insight (más grande).

interface NucleusProps {
  size?: number;
  className?: string;
}

export function Nucleus({ size = 30, className = "" }: NucleusProps) {
  return (
    <div
      className={`rounded-full shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background:
          "conic-gradient(from 200deg, #FF8AA0 0deg, #FFB088 60deg, #6B8CFF 160deg, #8B6FFF 230deg, #5DC7E0 310deg, #FF8AA0 360deg)",
      }}
    />
  );
}
