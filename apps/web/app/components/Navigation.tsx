"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Início" },
  { href: "/news", label: "Notícias" },
  { href: "/videos", label: "Vídeos" },
];

function MenuIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const linkClass = (href: string) =>
    cn(
      "text-sm font-medium transition-colors hover:text-foreground",
      isActive(href) ? "text-foreground" : "text-muted-foreground"
    );

  return (
    <>
      <nav
        className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        role="navigation"
        aria-label="Menu principal"
      >
        <div className="mx-auto flex h-14 max-w-[960px] items-center justify-between px-4">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-foreground no-underline hover:no-underline"
            onClick={() => setMobileOpen(false)}
          >
            Notícias <span className="text-primary">Games</span>
          </Link>

          <ul className="hidden gap-6 md:flex">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClass(item.href)}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
          >
            <MenuIcon open={mobileOpen} />
          </Button>
        </div>

        {mobileOpen && (
          <div className="absolute left-0 right-0 top-14 border-b border-border bg-card md:hidden">
            <ul className="flex flex-col gap-0 px-4 py-3">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive(item.href) ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>
      <div className="h-14 shrink-0" aria-hidden />
    </>
  );
}
