"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PanelLeft } from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";
import { AdminStageModeProvider, useAdminStageMode } from "@/src/admin/admin-stage-mode";
import { AdminSidebar } from "./AdminSidebar";
import { cn } from "@/lib/utils";

const COLLAPSED_KEY = "admin-sidebar-collapsed";

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";
  const [collapsed, setCollapsed] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COLLAPSED_KEY);
      if (raw === "0") setCollapsed(false);
      else if (raw === "1") setCollapsed(true);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  function handleCollapsedChange(next: boolean) {
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <AdminStageModeProvider>
      <AdminShell
        collapsed={ready ? collapsed : true}
        onCollapsedChange={handleCollapsedChange}
        onLogout={handleLogout}
      >
        {children}
      </AdminShell>
    </AdminStageModeProvider>
  );
}

function AdminShell({
  collapsed,
  onCollapsedChange,
  onLogout,
  children,
}: {
  collapsed: boolean;
  onCollapsedChange: (next: boolean) => void;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const { active: stageMode } = useAdminStageMode();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!stageMode) setMenuOpen(false);
  }, [stageMode]);

  const showSidebar = !stageMode || menuOpen;

  return (
    <div className="relative flex min-h-screen w-full bg-transparent">
      {showSidebar ? (
        <AdminSidebar
          collapsed={stageMode ? false : collapsed}
          onCollapsedChange={stageMode ? () => setMenuOpen(false) : onCollapsedChange}
          onLogout={onLogout}
        />
      ) : null}
      {stageMode ? (
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Ocultar menu" : "Abrir menu"}
          title={menuOpen ? "Ocultar menu" : "Abrir menu"}
          className="fixed right-4 top-4 z-50 inline-flex size-10 items-center justify-center rounded-full border border-border/80 bg-background/90 text-foreground shadow-md backdrop-blur-sm"
        >
          <PanelLeft className="size-5" aria-hidden />
        </button>
      ) : null}
      {stageMode && menuOpen ? (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-black/40"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      <main
        className={cn(
          "relative z-0 min-h-screen min-w-0 flex-1 overflow-y-auto overflow-x-auto bg-transparent transition-[padding] duration-200 ease-out",
          stageMode ? "pl-0" : collapsed ? "pl-16" : "pl-56"
        )}
      >
        <div className={cn(stageMode ? "" : "mx-auto max-w-6xl px-5 py-7 sm:px-8 lg:px-10 lg:py-9")}>
          {children}
        </div>
      </main>
    </div>
  );
}
