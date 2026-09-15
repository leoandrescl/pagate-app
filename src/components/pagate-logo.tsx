import Image from "next/image";

/** Logo Pagate (PNG con transparencia real). Tamaño visual vía className. */
export function PagateLogo({
  className = "h-8 w-auto",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/pagate-logo.png"
      alt="Pagate"
      width={280}
      height={75}
      priority={priority}
      className={className}
    />
  );
}
