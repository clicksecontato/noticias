import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export const SITE_NAME = "Conhecimento Ampliado";
export const SITE_LOGO_SRC = "/logo.png";

/** C/A grandes; restante menor — só no topo do menu. */
export function SiteBrandTitle({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-0 items-baseline gap-x-1.5 truncate leading-none",
        className
      )}
      aria-hidden
    >
      <span className="inline-flex items-baseline">
        <span className="text-[1.15rem] font-bold tracking-tight">C</span>
        <span className="text-[0.68rem] font-medium tracking-wide text-foreground/90">
          onhecimento
        </span>
      </span>
      <span className="inline-flex items-baseline">
        <span className="text-[1.15rem] font-bold tracking-tight">A</span>
        <span className="text-[0.68rem] font-medium tracking-wide text-foreground/90">
          mpliado
        </span>
      </span>
    </span>
  );
}

interface SiteBrandProps {
  href?: string;
  /** Só a logo (menu recolhido). */
  compact?: boolean;
  /**
   * Título com C/A destacados (topo do menu).
   * Sem isto, o nome aparece em tamanho uniforme (nav/rodapé).
   */
  stylizedTitle?: boolean;
  className?: string;
  /** Classes do texto ao lado da logo (modo uniforme). */
  textClassName?: string;
  /** Tamanho visual da logo em px. */
  logoSize?: number;
  onClick?: () => void;
}

export function SiteBrand({
  href = "/",
  compact = false,
  stylizedTitle = false,
  className,
  textClassName,
  logoSize = 32,
  onClick,
}: SiteBrandProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "inline-flex min-w-0 items-center gap-2.5 font-semibold tracking-tight text-foreground no-underline hover:no-underline",
        className
      )}
      aria-label={SITE_NAME}
    >
      <Image
        src={SITE_LOGO_SRC}
        alt=""
        width={logoSize}
        height={logoSize}
        className="shrink-0 object-contain"
        priority
      />
      {compact ? null : stylizedTitle ? (
        <SiteBrandTitle />
      ) : (
        <span className={cn("truncate leading-tight", textClassName)}>
          {SITE_NAME}
        </span>
      )}
    </Link>
  );
}
