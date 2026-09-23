"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Download,
  Filter,
  Newspaper,
  Radar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  isSourceStale,
  selectStaleSourceIds,
} from "@/src/admin/source-selection";
import {
  buildSourceFreshnessBars,
  buildSourceHealthSlices,
} from "@/src/admin/source-status-chart";
import { formatIngestionDurationMs } from "@/src/ui/format-ingestion-duration";
import {
  SourceFreshnessBars,
  SourceHealthDonut,
} from "./components/SourceStatusCharts";

interface SourceItem {
  id: string;
  name: string;
  provider?: "rss" | "youtube";
  lastIngestedAt?: string;
  lastIngestionDurationMs?: number;
}

function formatWhen(iso?: string) {
  if (!iso) return "nunca";
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function AdminHubClient() {
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/sources")
      .then((r) => r.json())
      .then((data: { sources?: SourceItem[] }) => {
        setSources(Array.isArray(data.sources) ? data.sources : []);
      })
      .catch(() => setSources([]))
      .finally(() => setLoading(false));
  }, []);

  const staleIds = useMemo(() => selectStaleSourceIds(sources), [sources]);
  const healthSlices = useMemo(
    () => buildSourceHealthSlices(sources),
    [sources]
  );
  const freshnessBars = useMemo(
    () => buildSourceFreshnessBars(sources),
    [sources]
  );
  const lastIngested = useMemo(() => {
    const times = sources
      .map((s) => s.lastIngestedAt)
      .filter((t): t is string => Boolean(t))
      .map((t) => Date.parse(t))
      .filter(Number.isFinite);
    if (times.length === 0) return null;
    return new Date(Math.max(...times)).toISOString();
  }, [sources]);

  const shortcuts = [
    {
      href: "/admin/ingestao",
      title: "Ingerir",
      description:
        staleIds.length > 0
          ? `${staleIds.length} fonte(s) atrasada(s) (>24h)`
          : "Todas as fontes recentes",
      icon: Download,
    },
    {
      href: "/admin/noticias?semAssunto=1",
      title: "Triagem",
      description: "Notícias sem assunto vinculado",
      icon: Filter,
    },
    {
      href: "/admin/reports?type=radar_pauta",
      title: "Radar 7d",
      description: "Gerar radar de pauta da semana",
      icon: Radar,
    },
    {
      href: "/admin/reports?type=executive_summary",
      title: "Relatório da semana",
      description: "Resumo executivo do período",
      icon: BarChart3,
    },
  ];

  return (
    <div className="space-y-8">
      <header className="space-y-1.5 border-b border-border/70 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Hub operacional
        </h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {shortcuts.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              className="surface-neo block rounded-[var(--radius)] border border-border/80 p-4 transition-colors hover:border-primary/40"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <p className="font-semibold text-foreground">{s.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
            </Link>
          );
        })}
      </div>

      <Card className="border-border/80">
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-lg">Status das fontes</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Última ingestão no sistema:{" "}
              <span className="text-foreground">{formatWhen(lastIngested ?? undefined)}</span>
            </p>
          </div>
          <Link
            href="/admin/ingestao"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Abrir ingestão
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : sources.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma fonte ativa. Cadastre em{" "}
              <Link href="/admin/fontes" className="text-primary hover:underline">
                Fontes
              </Link>
              .
            </p>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[240px_1fr] lg:items-start">
              <div className="space-y-3">
                <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Saúde da ingestão
                </p>
                <SourceHealthDonut slices={healthSlices} total={sources.length} />
                <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[#d4a574]" />
                    Em dia ({sources.length - staleIds.length})
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[#c4784a]" />
                    Atrasada ({staleIds.length})
                  </span>
                </div>
              </div>
              <div className="min-w-0 space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Horas desde a última ingestão
                </p>
                <SourceFreshnessBars bars={freshnessBars} />
                <ul className="mt-2 divide-y divide-border/70 border-t border-border/60 pt-2">
                  {sources.map((s) => {
                    const stale = isSourceStale(s.lastIngestedAt);
                    return (
                      <li
                        key={s.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{s.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatWhen(s.lastIngestedAt)}
                            {typeof s.lastIngestionDurationMs === "number"
                              ? ` · ${formatIngestionDurationMs(s.lastIngestionDurationMs)}`
                              : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={s.provider === "youtube" ? "info" : "soft"}
                            className="text-xs"
                          >
                            {s.provider === "youtube" ? "YouTube" : "RSS"}
                          </Badge>
                          <Badge
                            variant={stale ? "warning" : "secondary"}
                            className="text-xs"
                          >
                            {stale ? "Atrasada" : "Ok"}
                          </Badge>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/noticias"
          className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "gap-1.5")}
        >
          <Newspaper className="h-3.5 w-3.5" />
          Notícias
        </Link>
        <Link
          href="/admin/videos"
          className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
        >
          Vídeos
        </Link>
        <Link
          href="/admin/month-presentation"
          className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
        >
          Apresentação do mês
        </Link>
      </div>
    </div>
  );
}
