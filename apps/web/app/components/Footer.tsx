import Link from "next/link";
import { SiteBrand } from "./SiteBrand";

const FOOTER_LINKS = [
  { href: "/", label: "Início" },
  { href: "/news", label: "Notícias" },
  { href: "/videos", label: "Vídeos" },
  { href: "/sistema", label: "Sistema" },
  { href: "/roteiro", label: "Roteiro" },
];

export function Footer() {
  return (
    <footer
      className="mt-auto border-t border-white/5 bg-background/85"
      role="contentinfo"
    >
      <div className="mx-auto flex max-w-[960px] flex-col gap-4 px-4 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <SiteBrand href="/" logoSize={28} textClassName="text-base" />
        <nav className="flex flex-wrap gap-6" aria-label="Rodapé">
          {FOOTER_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="font-medium text-muted-foreground no-underline hover:text-primary hover:no-underline"
            >
              {label}
            </Link>
          ))}
        </nav>
        <p>Agregação e pauta de inteligência artificial.</p>
      </div>
    </footer>
  );
}
