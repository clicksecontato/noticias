import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/", label: "Início" },
  { href: "/news", label: "Notícias" },
  { href: "/roteiro", label: "Roteiro" },
];

export function Footer() {
  return (
    <footer
      className="mt-auto border-t border-border bg-card"
      role="contentinfo"
    >
      <div className="mx-auto flex max-w-[960px] flex-col gap-4 px-4 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p className="font-medium text-foreground">
          <Link href="/" className="hover:underline">
            Notícias Games
          </Link>
        </p>
        <nav className="flex gap-6" aria-label="Rodapé">
          {FOOTER_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className="hover:text-foreground hover:underline">
              {label}
            </Link>
          ))}
        </nav>
        <p>Portal de notícias de games.</p>
      </div>
    </footer>
  );
}
