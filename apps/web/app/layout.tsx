import "./globals.css";
import { Navigation } from "./components/Navigation";
import { Footer } from "./components/Footer";
import type { ReactNode } from "react";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata = {
  title: {
    default: "Notícias Games",
    template: "%s | Notícias Games"
  },
  description: "Portal de notícias de games. Cobertura das principais fontes."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={cn("dark font-sans", geist.variable)}>
      <body className="flex min-h-screen flex-col">
        <Navigation />
        <main className="flex-1">
        <div className="mx-auto max-w-[960px] px-4 py-6">{children}</div>
      </main>
        <Footer />
      </body>
    </html>
  );
}
