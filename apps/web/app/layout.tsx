import "./globals.css";
import { Navigation } from "./components/Navigation";
import type { ReactNode } from "react";

export const metadata = {
  title: "Noticias Games",
  description: "Portal de noticias de games em Portugues Brasileiro."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Navigation />
        <main>{children}</main>
      </body>
    </html>
  );
}
