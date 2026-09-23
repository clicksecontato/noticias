"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Download,
  Rss,
  Newspaper,
  Video,
  Bookmark,
  Tag,
  Layers,
  Sparkles,
  BarChart3,
  Presentation,
  Clapperboard,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface AdminMenuItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

interface AdminMenuGroup {
  label: string;
  items: AdminMenuItem[];
}

const ADMIN_MENU_GROUPS: AdminMenuGroup[] = [
  {
    label: "Operação",
    items: [
      { path: "/admin", label: "Hub", icon: LayoutDashboard, exact: true },
      { path: "/admin/ingestao", label: "Ingestão", icon: Download },
      { path: "/admin/fontes", label: "Fontes", icon: Rss },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      { path: "/admin/noticias", label: "Notícias", icon: Newspaper },
      { path: "/admin/videos", label: "Vídeos", icon: Video },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { path: "/admin/assuntos", label: "Assuntos", icon: Bookmark },
      { path: "/admin/tags", label: "Tags", icon: Tag },
      { path: "/admin/tipos", label: "Tipos", icon: Layers },
      { path: "/admin/enriquecimento", label: "Enriquecimento", icon: Sparkles },
    ],
  },
  {
    label: "Relatórios e criação",
    items: [
      { path: "/admin/reports", label: "Relatórios", icon: BarChart3 },
      {
        path: "/admin/month-presentation",
        label: "Apresentação do Mês",
        icon: Presentation,
      },
      {
        path: "/admin/youtube-shorts",
        label: "YouTube Shorts",
        icon: Clapperboard,
      },
    ],
  },
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
        "fixed left-0 top-16 bottom-0 z-40 flex flex-col border-r border-border bg-background/90 text-card-foreground shadow-sm backdrop-blur-xl",
        collapsed ? "w-[56px]" : "w-56"
      )}
    >
      <div className="flex h-14 shrink-0 items-center border-b border-border px-4">
        {showLabel ? (
          <Link href="/admin" className="flex items-center gap-2 font-semibold">
            <LayoutDashboard className="h-5 w-5" />
            Admin
          </Link>
        ) : (
          <Link
            href="/admin"
            className="flex items-center justify-center"
            aria-label="Admin"
          >
            <LayoutDashboard className="h-5 w-5" />
          </Link>
        )}
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto p-3" aria-label="Menu admin">
        {ADMIN_MENU_GROUPS.map((group) => (
          <div key={group.label} className="space-y-0.5">
            {showLabel ? (
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                {group.label}
              </p>
            ) : null}
            {group.items.map((item) => {
              const isActive = item.exact
                ? pathname === item.path
                : pathname === item.path || pathname.startsWith(`${item.path}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary-soft text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {showLabel ? <span>{item.label}</span> : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      {onLogout ? (
        <div className="shrink-0 border-t border-border p-3">
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
