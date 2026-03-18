"use client";

import { usePathname } from "next/navigation";

/**
 * No admin (exceto login), renderiza os filhos sem o wrapper de largura máxima,
 * para o layout do admin usar toda a largura (sidebar à esquerda + conteúdo à direita).
 * Nas demais rotas, mantém o container centralizado de 960px.
 */
export function MainContentWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminArea = pathname?.startsWith("/admin") && pathname !== "/admin/login";

  if (isAdminArea) {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto max-w-[960px] px-4 py-6">
      {children}
    </div>
  );
}
