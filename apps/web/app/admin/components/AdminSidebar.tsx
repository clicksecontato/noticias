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
  LogOut,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface AdminMenuItem {
  path: string;
  label: string;
  icon: LucideIcon;
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
      { path: "/admin/ingestao", label: "Atualizar Fontes", icon: Download },
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
    ],
  },
];

/** Ícone preenchido + pedestal com sombra (profundidade estilo exemplo-layout-final). */
function SidebarNavIcon({
  icon: Icon,
  active = false,
  className,
}: {
  icon: LucideIcon;
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-xl transition-all",
        active
          ? [
              "bg-[linear-gradient(145deg,rgba(232,196,154,0.28),rgba(166,124,82,0.12))]",
              "shadow-[0_6px_14px_rgba(0,0,0,0.45),0_0_16px_rgba(212,165,116,0.22),inset_0_1px_0_rgba(255,236,210,0.35)]",
            ]
          : [
              "bg-[linear-gradient(145deg,rgba(255,255,255,0.07),rgba(0,0,0,0.2))]",
              "shadow-[0_4px_10px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]",
            ],
        className
      )}
    >
      <Icon
        className={cn(
          "size-[17px]",
          active ? "text-primary-dark" : "text-primary"
        )}
        fill="currentColor"
        strokeWidth={1.15}
        absoluteStrokeWidth
        style={{
          filter: active
            ? "drop-shadow(0 2px 3px rgba(0,0,0,0.55)) drop-shadow(0 0 6px rgba(232,196,154,0.55))"
            : "drop-shadow(0 2px 3px rgba(0,0,0,0.5)) drop-shadow(0 0 4px rgba(212,165,116,0.28))",
        }}
      />
    </span>
  );
}

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

  const collapseLabel = collapsed ? "Expandir menu" : "Recolher menu";

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 z-40 flex flex-col border-r border-border/80",
        "bg-[#161514]/95 text-card-foreground shadow-[8px_0_32px_rgba(0,0,0,0.35)] backdrop-blur-xl",
        "transition-[width] duration-200 ease-out",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <button
        type="button"
        onClick={() => onCollapsedChange(!collapsed)}
        aria-label={collapseLabel}
        title={collapseLabel}
        className={cn(
          "group/rail absolute top-1/2 z-50 flex h-14 w-3.5 -translate-y-1/2 items-center justify-center",
          "rounded-r-md border border-l-0 border-border/80",
          "bg-[#1c1b19]/95 text-primary shadow-[4px_0_12px_rgba(0,0,0,0.35)] backdrop-blur-sm",
          "transition-colors hover:bg-primary-soft hover:text-primary-dark",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          "right-0 translate-x-full"
        )}
      >
        {collapsed ? (
          <ChevronRight
            className="size-3.5 opacity-80 transition-opacity group-hover/rail:opacity-100"
            strokeWidth={2.25}
            aria-hidden
          />
        ) : (
          <ChevronLeft
            className="size-3.5 opacity-80 transition-opacity group-hover/rail:opacity-100"
            strokeWidth={2.25}
            aria-hidden
          />
        )}
      </button>

      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-border/60",
          collapsed ? "justify-center px-2" : "px-4"
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
      </div>

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
              return (
                <SidebarTooltip key={item.path} label={item.label} show={collapsed}>
                  <Link
                    href={item.path}
                    className={cn(
                      "flex items-center rounded-xl text-sm font-medium transition-colors",
                      collapsed ? "justify-center px-0 py-2" : "gap-3 px-2.5 py-1.5",
                      isActive
                        ? [
                            "bg-[linear-gradient(135deg,rgba(232,196,154,0.32)_0%,rgba(212,165,116,0.18)_55%,rgba(166,124,82,0.12)_100%)]",
                            "text-foreground",
                            "shadow-[inset_0_0_0_1px_rgba(232,196,154,0.45),0_4px_14px_rgba(212,165,116,0.18)]",
                          ]
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    )}
                    aria-label={item.label}
                  >
                    <SidebarNavIcon icon={item.icon} active={isActive} />
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
                "h-auto text-muted-foreground hover:text-foreground",
                collapsed
                  ? "w-full justify-center px-0 py-2"
                  : "w-full justify-start gap-3 px-2.5 py-1.5"
              )}
              onClick={onLogout}
              aria-label="Sair"
            >
              <SidebarNavIcon icon={LogOut} />
              {showLabel ? <span>Sair</span> : null}
            </Button>
          </SidebarTooltip>
        </div>
      ) : null}
    </aside>
  );
}
