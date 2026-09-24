"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
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
    <div className="relative flex min-h-screen w-full bg-transparent">
      <AdminSidebar
        collapsed={ready ? collapsed : true}
        onCollapsedChange={handleCollapsedChange}
        onLogout={handleLogout}
      />
      <main
        className={cn(
          "relative z-0 min-h-screen min-w-0 flex-1 overflow-y-auto overflow-x-auto bg-transparent transition-[padding] duration-200 ease-out",
          collapsed ? "pl-16" : "pl-56"
        )}
      >
        <div className="mx-auto max-w-6xl px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
          {children}
        </div>
      </main>
    </div>
  );
}
