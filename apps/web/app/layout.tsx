import "./globals.css";
import { Navigation } from "./components/Navigation";
import { Footer } from "./components/Footer";
import { MainContentWrapper } from "./components/MainContentWrapper";
import type { ReactNode } from "react";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata = {
  title: {
    default: "Notícias IA",
    template: "%s | Notícias IA"
  },
  description: "Portal de notícias de inteligência artificial. Cobertura das principais fontes."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={cn("dark font-sans", geist.variable)}>
      <body className="flex min-h-screen flex-col" suppressHydrationWarning>
        <Navigation />
        <main className="min-h-0 flex-1 flex flex-col">
          <MainContentWrapper>{children}</MainContentWrapper>
        </main>
        <Footer />
      </body>
    </html>
  );
}
