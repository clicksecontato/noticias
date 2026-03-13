import "./globals.css";
import { Navigation } from "./components/Navigation";
import { Footer } from "./components/Footer";
import type { ReactNode } from "react";

export const metadata = {
  title: {
    default: "Notícias Games",
    template: "%s | Notícias Games"
  },
  description: "Portal de notícias de games. Cobertura das principais fontes."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Navigation />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
