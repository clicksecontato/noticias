import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer__container">
        <p className="site-footer__brand">
          <Link href="/">Notícias Games</Link>
        </p>
        <nav className="site-footer__nav" aria-label="Rodapé">
          <Link href="/">Início</Link>
          <Link href="/news">Notícias</Link>
        </nav>
        <p className="site-footer__copy">
          Portal de notícias de games.
        </p>
      </div>
    </footer>
  );
}
