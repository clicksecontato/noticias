"use client";

import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { AdminSidebar } from "./AdminSidebar";

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";

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
    <div className="flex min-h-0 flex-1 w-full">
      <AdminSidebar onLogout={handleLogout} />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-auto bg-background pl-56">
        <div className="px-6 py-8 lg:px-8 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
