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
  PanelLeftClose,
  PanelLeftOpen,
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

function SidebarTooltip({
  label,
  show,
  children,
}: {
  label: string;
  show: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="group/tip relative">
      {children}
      {show ? (
        <span
          role="tooltip"
          className={cn(
            "pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2",
            "whitespace-nowrap rounded-xl border border-[color-mix(in_srgb,var(--primary)_28%,transparent)]",
            "bg-[#2a2826]/95 px-3 py-1.5 text-xs font-medium text-[#f3f0eb] shadow-[0_8px_24px_rgba(0,0,0,0.55)] backdrop-blur-md",
            "opacity-0 translate-x-1 transition-all duration-150",
            "group-hover/tip:translate-x-0 group-hover/tip:opacity-100",
            "after:absolute after:right-full after:top-1/2 after:-mt-1 after:border-4 after:border-transparent",
            "after:border-r-[#2a2826]/95"
          )}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}

export function AdminSidebar({
  collapsed,
  onCollapsedChange,
  onLogout,
}: {
  collapsed: boolean;
  onCollapsedChange: (next: boolean) => void;
  onLogout?: () => void;
}) {
  const pathname = usePathname();
  const showLabel = !collapsed;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 z-40 flex flex-col border-r border-border/80",
        "bg-[#161514]/95 text-card-foreground shadow-[8px_0_32px_rgba(0,0,0,0.35)] backdrop-blur-xl",
        "transition-[width] duration-200 ease-out",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-border/60",
          collapsed ? "justify-center px-2" : "justify-between gap-2 px-4"
        )}
      >
        <SidebarTooltip label="Notícias IA" show={collapsed}>
          <Link
            href="/admin"
            className={cn(
              "min-w-0 font-semibold tracking-tight no-underline hover:no-underline",
              collapsed ? "px-1 text-center text-sm" : "text-base"
            )}
            aria-label="Notícias IA"
          >
            {collapsed ? (
              <span className="gradient-text">IA</span>
            ) : (
              <span className="text-foreground">
                Notícias <span className="gradient-text">IA</span>
              </span>
            )}
          </Link>
        </SidebarTooltip>
        {showLabel ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-primary hover:text-primary-dark"
            onClick={() => onCollapsedChange(true)}
            aria-label="Recolher menu"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      {collapsed ? (
        <div className="flex justify-center border-b border-border/40 py-2">
          <SidebarTooltip label="Expandir menu" show>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-primary hover:text-primary-dark"
              onClick={() => onCollapsedChange(false)}
              aria-label="Expandir menu"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          </SidebarTooltip>
        </div>
      ) : null}

      <nav
        className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-2.5"
        aria-label="Menu admin"
      >
        {ADMIN_MENU_GROUPS.map((group) => (
          <div key={group.label} className="space-y-0.5">
            {showLabel ? (
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                {group.label}
              </p>
            ) : null}
            {group.items.map((item) => {
              const isActive = item.exact
                ? pathname === item.path
                : pathname === item.path || pathname.startsWith(`${item.path}/`);
              const Icon = item.icon;
              return (
                <SidebarTooltip key={item.path} label={item.label} show={collapsed}>
                  <Link
                    href={item.path}
                    className={cn(
                      "flex items-center rounded-xl text-sm font-medium transition-colors",
                      collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2",
                      isActive
                        ? "bg-primary-soft text-primary shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--primary)_25%,transparent)]"
                        : "text-muted-foreground hover:bg-white/5 hover:text-primary"
                    )}
                    aria-label={item.label}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isActive ? "text-primary" : "text-primary/70"
                      )}
                    />
                    {showLabel ? <span>{item.label}</span> : null}
                  </Link>
                </SidebarTooltip>
              );
            })}
          </div>
        ))}
      </nav>

      {onLogout ? (
        <div className="shrink-0 border-t border-border/60 p-2.5">
          <SidebarTooltip label="Sair" show={collapsed}>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "text-muted-foreground hover:text-foreground",
                collapsed ? "w-full justify-center px-0" : "w-full justify-start gap-3"
              )}
              onClick={onLogout}
              aria-label="Sair"
            >
              <LogOut className="h-4 w-4 shrink-0 text-primary/70" />
              {showLabel ? <span>Sair</span> : null}
            </Button>
          </SidebarTooltip>
        </div>
      ) : null}
    </aside>
  );
}
