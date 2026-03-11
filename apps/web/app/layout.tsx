import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "Noticias Games",
  description: "Portal de noticias de games em Portugues Brasileiro."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <main>
          <header style={{ marginBottom: 24 }}>
            <h1 style={{ marginBottom: 8 }}>Noticias Games</h1>
            <nav style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/">Inicio</Link>
              <Link href="/news">Noticias</Link>
              <Link href="/news/novo-trailer-de-gta-6">Noticia exemplo</Link>
              <Link href="/games/elden-ring">Game exemplo</Link>
              <Link href="/best/rpg">Best RPG</Link>
              <Link href="/hardware/16gb">Hardware</Link>
              <Link href="/admin">Admin</Link>
            </nav>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
