"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Download,
  Rss,
  Gamepad2,
  Tag,
  Layers,
  Monitor,
  Sparkles,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface AdminMenuItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  showLabel?: boolean;
}

const ADMIN_MENU_ITEMS: AdminMenuItem[] = [
  { path: "/admin/ingestao", label: "Ingestão", icon: Download, showLabel: true },
  { path: "/admin/fontes", label: "Fontes", icon: Rss, showLabel: true },
  { path: "/admin/jogos", label: "Jogos", icon: Gamepad2, showLabel: true },
  { path: "/admin/tags", label: "Tags", icon: Tag, showLabel: true },
  { path: "/admin/generos", label: "Gêneros", icon: Layers, showLabel: true },
  { path: "/admin/plataformas", label: "Plataformas", icon: Monitor, showLabel: true },
  { path: "/admin/enriquecimento", label: "Enriquecimento", icon: Sparkles, showLabel: true },
];

export function AdminSidebar({
  collapsed = false,
  onLogout,
}: {
  collapsed?: boolean;
  onLogout?: () => void;
}) {
  const pathname = usePathname();
  const showLabel = !collapsed;

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-card text-card-foreground",
        collapsed ? "w-[56px]" : "w-56"
      )}
    >
      <div className="flex h-14 shrink-0 items-center border-b border-border px-3">
        {showLabel ? (
          <Link href="/admin" className="flex items-center gap-2 font-semibold">
            <LayoutDashboard className="h-5 w-5" />
            Admin
          </Link>
        ) : (
          <Link href="/admin" className="flex items-center justify-center" aria-label="Admin">
            <LayoutDashboard className="h-5 w-5" />
          </Link>
        )}
      </div>
      <nav className="flex-1 space-y-0.5 p-2" aria-label="Menu admin">
        {ADMIN_MENU_ITEMS.map((item) => {
          const isActive =
            pathname === item.path || (item.path !== "/admin" && pathname.startsWith(item.path));
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {showLabel ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>
      {onLogout ? (
        <div className="border-t border-border p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {showLabel ? <span>Sair</span> : null}
          </Button>
        </div>
      ) : null}
    </aside>
  );
}
