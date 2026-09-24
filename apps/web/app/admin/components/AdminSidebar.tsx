"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
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
  Gauge,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createPortal } from "react-dom";

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
      { path: "/admin/youtube-api", label: "API YouTube", icon: Gauge },
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
  children: ReactNode;
}) {
  const tipId = useId();
  const triggerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateCoords = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({
      top: rect.top + rect.height / 2,
      left: rect.right + 12,
    });
  }, []);

  function handleEnter() {
    if (!show) return;
    updateCoords();
    setOpen(true);
  }

  function handleLeave() {
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function onScrollOrResize() {
      updateCoords();
    }
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, updateCoords]);

  const tooltip =
    mounted && show && open && coords
      ? createPortal(
          <span
            id={tipId}
            role="tooltip"
            className={cn(
              "pointer-events-none fixed z-[100] -translate-y-1/2",
              "whitespace-nowrap rounded-xl border border-[color-mix(in_srgb,var(--primary)_28%,transparent)]",
              "bg-[#2a2826]/95 px-3 py-1.5 text-xs font-medium text-[#f3f0eb] shadow-[0_8px_24px_rgba(0,0,0,0.55)] backdrop-blur-md",
              "after:absolute after:right-full after:top-1/2 after:-mt-1 after:border-4 after:border-transparent",
              "after:border-r-[#2a2826]/95"
            )}
            style={{ top: coords.top, left: coords.left }}
          >
            {label}
          </span>,
          document.body
        )
      : null;

  return (
    <div
      ref={triggerRef}
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
    >
      {children}
      {tooltip}
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
        "admin-sidebar-surface fixed left-0 top-0 bottom-0 z-40 flex flex-col",
        "border-r border-border/80 text-card-foreground",
        "shadow-[8px_0_32px_rgba(0,0,0,0.4)]",
        "transition-[width] duration-200 ease-out",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Brilho gold na base — referência exemplo-layout-final */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        <div
          className={cn(
            "sidebar-glow absolute inset-x-0 bottom-0 h-40",
            "bg-[radial-gradient(ellipse_90%_80%_at_50%_120%,rgba(212,165,116,0.28)_0%,rgba(166,124,82,0.08)_42%,transparent_70%)]"
          )}
        />
      </div>

      <button
        type="button"
        onClick={() => onCollapsedChange(!collapsed)}
        aria-label={collapseLabel}
        title={collapseLabel}
        className={cn(
          "group/rail absolute top-1/2 z-50 flex h-14 w-3.5 -translate-y-1/2 items-center justify-center",
          "rounded-r-md border border-l-0 border-border/80",
          "bg-[#1c1b19] text-primary shadow-[4px_0_12px_rgba(0,0,0,0.45)]",
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
          "relative z-10 flex h-16 shrink-0 items-center border-b border-border/60",
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
        className="relative z-10 flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-2.5"
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
        <div className="relative z-10 shrink-0 border-t border-border/60 p-2.5">
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
