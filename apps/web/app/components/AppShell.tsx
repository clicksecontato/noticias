"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Navigation } from "./Navigation";
import { Footer } from "./Footer";
import { MainContentWrapper } from "./MainContentWrapper";

/**
 * Shell da app: no admin (ferramenta pessoal) não há menu superior nem rodapé —
 * só sidebar + conteúdo, como no exemplo-layout-final.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const isAdminApp =
    pathname.startsWith("/admin") && pathname !== "/admin/login";

  if (isAdminApp) {
    return (
      <main className="flex min-h-screen min-h-0 flex-1 flex-col">{children}</main>
    );
  }

  return (
    <>
      <Navigation />
      <main className="flex min-h-0 flex-1 flex-col">
        <MainContentWrapper>{children}</MainContentWrapper>
      </main>
      <Footer />
    </>
  );
}
