"use client";

import { Children, isValidElement, useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRegisterAdminStage } from "@/src/admin/admin-stage-mode";

export function Slide({ children }: { title: string; children: ReactNode }) {
  return <div className="flex h-full min-h-0 flex-col overflow-hidden">{children}</div>;
}

export function PresentationStage({
  kicker,
  children,
}: {
  kicker: string;
  children: ReactNode;
}) {
  useRegisterAdminStage();
  const slides = Children.toArray(children).filter(isValidElement);
  const [index, setIndex] = useState(0);
  const current = Math.min(index, Math.max(slides.length - 1, 0));
  const title = isValidElement<{ title?: string }>(slides[current])
    ? slides[current].props.title ?? kicker
    : kicker;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (document.querySelector("[data-slot=alert-dialog-content][data-open]")) return;
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        setIndex((value) => Math.min(value + 1, slides.length - 1));
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        setIndex((value) => Math.max(value - 1, 0));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slides.length]);

  return (
    <section className="fixed inset-0 z-40 flex flex-col bg-background py-8 pl-10 pr-20 text-foreground">
      <header className="flex items-end justify-between gap-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">{kicker}</p>
          <h2 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h2>
        </div>
        <p className="text-lg tabular-nums text-muted-foreground">
          {slides.length ? current + 1 : 0} / {slides.length}
        </p>
      </header>
      <div className="theme-scrollbar mt-6 flex min-h-0 flex-1 flex-col overflow-hidden [&_[data-slot=card]]:h-full [&_[data-slot=card]]:min-h-0 [&_[data-slot=card]]:border-0 [&_[data-slot=card]]:bg-transparent [&_[data-slot=card]]:shadow-none [&_[data-slot=card-content]]:flex [&_[data-slot=card-content]]:min-h-0 [&_[data-slot=card-content]]:flex-1 [&_[data-slot=card-content]]:flex-col">
        {slides[current]}
      </div>
      <footer className="mt-6 flex items-center justify-between">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm disabled:opacity-30"
          onClick={() => setIndex((value) => Math.max(value - 1, 0))}
          disabled={current === 0}
        >
          <ChevronLeft className="size-4" aria-hidden />
          Anterior
        </button>
        <p className="text-sm text-muted-foreground">Setas do teclado trocam a tela</p>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm disabled:opacity-30"
          onClick={() => setIndex((value) => Math.min(value + 1, slides.length - 1))}
          disabled={current >= slides.length - 1}
        >
          Próxima
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </footer>
    </section>
  );
}
