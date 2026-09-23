"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { IngestionFetchStats } from "../../../../packages/scraping/src/content-sources/types";
import { AddSourceForm } from "./components/AddSourceForm";
import { formatIngestionDurationMs } from "@/src/ui/format-ingestion-duration";

interface SourceItem {
  id: string;
  name: string;
  rssUrl?: string;
  language: string;
  isActive: boolean;
  provider?: "rss" | "youtube";
  channelId?: string;
}

interface ApiResult {
  processedSourceIds: string[];
  createdArticles: number;
  createdVideos?: number;
  discardedByLanguage: number;
  discardedByValidation?: number;
  createdBySource?: Record<string, number>;
  skippedBySource?: Record<string, number>;
  skippedArticles?: Array<{ sourceId: string; title: string; sourceUrl?: string }>;
  failedSources?: Record<string, string>;
  fetchStatsBySource?: Record<string, IngestionFetchStats>;
}

export function AdminIngestionClient({
  useSessionAuth = false,
}: {
  /** Quando true, não exibe campo de token e envia apenas sourceIds (auth por sessão). */
  useSessionAuth?: boolean;
}) {
  const [token, setToken] = useState("");
  const [sourceIds, setSourceIds] = useState("");
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function loadSources() {
    fetch("/api/admin/sources")
      .then((res) => res.json())
      .then((data: { sourceIds?: string[]; sources?: SourceItem[] }) => {
        if (Array.isArray(data.sources)) {
          setSources(data.sources);
        }
        if (Array.isArray(data.sourceIds) && data.sourceIds.length > 0) {
          setSourceIds(data.sourceIds.join(", "));
        }
      })
      .catch(() => {});
  }

  useEffect(() => {
    loadSources();
  }, []);

  async function onTriggerIngestion() {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const ids = sourceIds
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const body: { sourceIds: string[]; token?: string } = { sourceIds: ids };
      if (!useSessionAuth) body.token = token;

      const response = await fetch("/api/admin/ingest-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await response.json()) as ApiResult;
      if (!response.ok) {
        setError("Falha de autenticação ou requisição inválida.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Erro ao chamar API de ingestão.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1.5 border-b border-border/70 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Ingestão manual
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Dispare a busca e criação de notícias em Português Brasileiro. Para cadastrar
          fontes, use{" "}
          <Link
            href="/admin/fontes"
            className="text-primary underline-offset-2 hover:underline"
          >
            Fontes
          </Link>
          .
        </p>
      </header>

      <Card className="border-border/80 shadow-sm">
        <CardContent className="space-y-4 pt-4">
          {!useSessionAuth ? (
            <div className="space-y-2">
              <Label htmlFor="token">Token Admin</Label>
              <Input
                id="token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full"
              />
            </div>
          ) : null}

          {sources.length > 0 ? (
            <Card className="border-border bg-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Fontes disponíveis</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="list-inside space-y-1 text-sm text-muted-foreground">
                  {sources.map((s) => (
                    <li key={s.id} className="flex flex-wrap items-center gap-1">
                      <span className="font-semibold text-foreground">{s.name}</span>
                      <span className="text-muted-foreground/80">({s.id})</span>
                      <Badge
                        variant={s.provider === "youtube" ? "info" : "soft"}
                        className="text-xs font-normal"
                      >
                        {s.provider === "youtube" ? "YouTube" : "RSS"}
                      </Badge>
                      {s.provider === "youtube" && s.channelId ? (
                        <span className="text-xs">Canal: {s.channelId}</span>
                      ) : null}
                      {s.provider === "rss" && s.rssUrl ? (
                        <span className="truncate text-xs opacity-90">{s.rssUrl}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="sourceIds">IDs das fontes (separados por vírgula)</Label>
            <Input
              id="sourceIds"
              value={sourceIds}
              onChange={(e) => setSourceIds(e.target.value)}
              placeholder="Ex: s1, s2, yt-canal-ia"
            />
          </div>

          <AddSourceForm title="Atalho: criar fonte" onCreated={loadSources} />

          <Button onClick={onTriggerIngestion} disabled={isLoading}>
            {isLoading ? "Processando..." : "Buscar e criar notícias"}
          </Button>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {result ? (
        <Card>
          <CardContent className="space-y-3 pt-4">
            <p className="text-sm">
              <strong>Total criados:</strong>{" "}
              {result.createdArticles > 0 && `${result.createdArticles} artigos`}
              {result.createdArticles > 0 && (result.createdVideos ?? 0) > 0 && " · "}
              {(result.createdVideos ?? 0) > 0 &&
                `${result.createdVideos} vídeos (tabela youtube_videos)`}
              {result.createdArticles === 0 && (result.createdVideos ?? 0) === 0 && "0"}
              {" · Descartados (idioma): "}
              {result.discardedByLanguage}
              {" · Descartados (validação): "}
              {result.discardedByValidation ?? 0}
            </p>
            {(result.createdVideos ?? 0) > 0 ? (
              <p className="text-xs text-muted-foreground">
                Os vídeos YouTube ficam na tabela <strong>youtube_videos</strong> no
                Supabase e ainda não aparecem na listagem pública de notícias do site.
              </p>
            ) : null}
            {result.createdBySource &&
            Object.keys(result.createdBySource).length > 0 ? (
              <p className="text-sm">
                <strong>Criados por fonte:</strong>{" "}
                {Object.entries(result.createdBySource)
                  .map(([id, n]) => `${id}: ${n}`)
                  .join(" · ")}
              </p>
            ) : null}
            {result.fetchStatsBySource &&
            Object.keys(result.fetchStatsBySource).length > 0 ? (
              <div className="space-y-2">
                <strong className="text-sm">Observabilidade do fetch (por fonte)</strong>
                <ul className="list-inside space-y-2 text-xs text-muted-foreground">
                  {Object.entries(result.fetchStatsBySource).map(([id, st]) => (
                    <li key={id}>
                      <span className="font-medium text-foreground">{id}</span>
                      <span className="text-foreground/80">
                        {" "}
                        · duração {formatIngestionDurationMs(st.durationMs)}
                      </span>
                      {st.provider === "rss" ? (
                        <span>
                          {" "}
                          · RSS: com título {st.rssItemsWithTitle ?? "—"} · filtrados
                          (data) {st.rssItemsFilteredByDate ?? 0} · sem link{" "}
                          {st.rssItemsDroppedNoLink ?? 0} · cortados (teto){" "}
                          {st.rssItemsCappedByMaxItems ?? 0} · entregues{" "}
                          {st.rssItemsDelivered ?? 0}
                        </span>
                      ) : (
                        <span>
                          {" "}
                          · YouTube: API {st.youtubePlaylistItemsRaw ?? 0} · inválidos{" "}
                          {st.youtubeItemsDroppedInvalid ?? 0} · entregues{" "}
                          {st.youtubeItemsDelivered ?? 0}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground">
                  Logs JSON também são emitidos no servidor (
                  <code className="rounded bg-muted px-1">ingestion.rss.fetch</code>,{" "}
                  <code className="rounded bg-muted px-1">ingestion.source.complete</code>
                  , <code className="rounded bg-muted px-1">ingestion.source.failed</code>
                  ).
                </p>
              </div>
            ) : null}
            {result.failedSources && Object.keys(result.failedSources).length > 0 ? (
              <div className="space-y-1">
                <strong className="text-destructive">
                  Fontes com erro (RSS indisponível ou TLS):
                </strong>
                <ul className="list-inside space-y-0.5 text-sm text-destructive/90">
                  {Object.entries(result.failedSources).map(([id, msg]) => (
                    <li key={id}>
                      <strong>{id}</strong>: {msg.slice(0, 120)}
                      {msg.length > 120 ? "…" : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {result.skippedArticles && result.skippedArticles.length > 0 ? (
              <div className="space-y-1">
                <strong>Já existentes (não duplicados):</strong>
                <ul className="list-inside space-y-0.5 text-sm">
                  {result.skippedArticles.map((a, i) => (
                    <li key={`${a.sourceId}-${i}-${a.title.slice(0, 30)}`}>
                      {a.title}
                      {a.sourceUrl ? (
                        <span className="text-xs opacity-85">
                          {" "}
                          ·{" "}
                          <a
                            href={a.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            link
                          </a>
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <pre className="overflow-auto rounded-lg bg-muted p-3 text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
