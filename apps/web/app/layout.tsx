import "./globals.css";
import { AppShell } from "./components/AppShell";
import type { ReactNode } from "react";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata = {
  title: {
    default: "Notícias IA",
    template: "%s | Notícias IA",
  },
  description:
    "Ferramenta pessoal de agregação e pauta de inteligência artificial.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={cn("dark font-sans", geist.variable)}>
      <body className="flex min-h-screen flex-col" suppressHydrationWarning>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
