"use client";

import { useCallback, useEffect, useState } from "react";
import { Gauge, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageTitle } from "../components/AdminPageTitle";
import type { YoutubeQuotaSnapshot } from "@/src/admin/youtube-api-quota-repository";

function formatReset(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      timeZone: "America/Los_Angeles",
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function YoutubeApiQuotaClient() {
  const [data, setData] = useState<YoutubeQuotaSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/youtube-quota");
      const json = (await res.json()) as YoutubeQuotaSnapshot & { error?: string };
      if (!res.ok) {
        setError(json.error || "Falha ao carregar cota.");
        setData(null);
        return;
      }
      setData(json);
    } catch {
      setError("Erro de rede ao carregar cota.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const pct = data?.percentUsed ?? 0;
  const barColor =
    pct >= 90
      ? "bg-destructive"
      : pct >= 70
        ? "bg-[color-mix(in_srgb,var(--primary)_85%,#b45309)]"
        : "bg-primary";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <AdminPageTitle icon={Gauge}>API YouTube</AdminPageTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw className={`mr-1.5 size-3.5 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <p className="max-w-3xl text-sm text-muted-foreground">
        Métodos da YouTube Data API v3 usados neste projeto e consumo estimado da cota diária
        (padrão 10&nbsp;000 unidades; reinicia à meia-noite Pacific Time).
      </p>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Usado hoje
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums">{data.unitsUsed}</p>
                <p className="text-xs text-muted-foreground">unidades · dia {data.quotaDay}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Limite diário
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums">{data.dailyLimit}</p>
                <p className="text-xs text-muted-foreground">unidades por dia</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Restante
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums">{data.unitsRemaining}</p>
                <p className="text-xs text-muted-foreground">{data.percentUsed}% usado</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Próximo reset
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold leading-snug">{formatReset(data.resetAt)}</p>
                <p className="text-xs text-muted-foreground">horário Pacific (PT)</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Consumo do dia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${barColor}`}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={data.tracked ? "secondary" : "warning"}>
                  {data.tracked ? "Tracking ativo" : "Tracking indisponível"}
                </Badge>
                <span className="text-xs text-muted-foreground">{data.note}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Métodos que usamos</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-2.5 font-medium">Método</th>
                    <th className="px-4 py-2.5 font-medium">Custo</th>
                    <th className="px-4 py-2.5 font-medium">Auth</th>
                    <th className="px-4 py-2.5 font-medium text-right">Chamadas hoje</th>
                    <th className="px-4 py-2.5 font-medium text-right">Unidades hoje</th>
                    <th className="px-4 py-2.5 font-medium">Onde</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byMethod.map((row) => (
                    <tr key={row.method} className="border-b border-border/70 last:border-0">
                      <td className="px-4 py-2.5 font-mono text-xs">{row.method}</td>
                      <td className="px-4 py-2.5 tabular-nums">{row.unitsPerCall}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant="outline" className="font-normal">
                          {row.auth === "api_key" ? "API key" : "OAuth"}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{row.calls}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-medium">
                        {row.units}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{row.usedIn}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Eventos recentes (hoje)</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recent.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum evento registrado hoje. Após ingestão, sync de avatars ou resolve de canal,
                  o uso aparece aqui.
                </p>
              ) : (
                <ul className="divide-y divide-border/70 text-sm">
                  {data.recent.map((ev) => (
                    <li
                      key={ev.id}
                      className="flex flex-wrap items-baseline justify-between gap-2 py-2 first:pt-0 last:pb-0"
                    >
                      <span className="font-mono text-xs">{ev.method}</span>
                      <span className="text-muted-foreground">{ev.context || "—"}</span>
                      <span className="tabular-nums font-medium">{ev.units} u</span>
                      <time
                        className="text-xs text-muted-foreground"
                        dateTime={ev.createdAt}
                      >
                        {new Date(ev.createdAt).toLocaleTimeString("pt-BR")}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      ) : loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : null}
    </div>
  );
}
