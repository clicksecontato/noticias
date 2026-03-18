"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [showAddSource, setShowAddSource] = useState(false);
  const [newSource, setNewSource] = useState({
    id: "",
    name: "",
    provider: "rss" as "rss" | "youtube",
    rss_url: "",
    channel_id: "",
    language: "pt-BR",
  });
  const [addSourceError, setAddSourceError] = useState<string | null>(null);
  const [addSourceSuccess, setAddSourceSuccess] = useState(false);

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
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function onAddSource(e: React.FormEvent) {
    e.preventDefault();
    setAddSourceError(null);
    setAddSourceSuccess(false);
    const body: Record<string, string | boolean> = {
      id: newSource.id.trim(),
      name: newSource.name.trim(),
      language: newSource.language,
      provider: newSource.provider,
    };
    if (newSource.provider === "youtube") {
      if (!newSource.channel_id.trim()) {
        setAddSourceError(
          "Informe a URL do canal (o ID da fonte é gerado automaticamente)."
        );
        return;
      }
      body.channel_id = newSource.channel_id.trim();
      if (!newSource.id.trim()) body.id = "";
    } else {
      if (!newSource.rss_url.trim()) {
        setAddSourceError("URL do feed RSS é obrigatória.");
        return;
      }
      body.rss_url = newSource.rss_url.trim();
    }
    try {
      const res = await fetch("/api/admin/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddSourceError(data.error || "Erro ao criar fonte.");
        return;
      }
      setAddSourceSuccess(true);
      setNewSource({
        id: "",
        name: "",
        provider: "rss",
        rss_url: "",
        channel_id: "",
        language: "pt-BR",
      });
      loadSources();
    } catch {
      setAddSourceError("Erro ao chamar API.");
    }
  }

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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Ingestão manual</h1>
      </div>
      <p className="text-muted-foreground">
        Dispare a busca e criação de notícias em Português Brasileiro. O token admin é validado automaticamente pela sua sessão.
      </p>

      <Card>
        <CardContent className="pt-4 space-y-4">
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
            <Card className="border-border bg-muted/30">
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
                        variant={s.provider === "youtube" ? "default" : "secondary"}
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
              placeholder="Ex: s1, s2, yt-canal-games"
            />
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddSource((v) => !v)}
            >
              {showAddSource ? "Ocultar formulário" : "Adicionar nova fonte"}
            </Button>
            {showAddSource ? (
              <Card className="border-border bg-card">
                <CardContent className="pt-4">
                  <form onSubmit={onAddSource} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select
                        value={newSource.provider}
                        onValueChange={(value) =>
                          setNewSource((s) => ({
                            ...s,
                            provider: (value ?? "rss") as "rss" | "youtube",
                          }))
                        }
                      >
                        <SelectTrigger className="h-9 w-full bg-background text-foreground">
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rss">RSS</SelectItem>
                          <SelectItem value="youtube">YouTube</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>
                        ID (único)
                        {newSource.provider === "youtube"
                          ? " — opcional, gerado da URL"
                          : ""}
                      </Label>
                      <Input
                        value={newSource.id}
                        onChange={(e) =>
                          setNewSource((s) => ({ ...s, id: e.target.value }))
                        }
                        placeholder={
                          newSource.provider === "youtube"
                            ? "Deixe em branco para gerar automaticamente"
                            : "Ex: meu-canal-yt"
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input
                        value={newSource.name}
                        onChange={(e) =>
                          setNewSource((s) => ({ ...s, name: e.target.value }))
                        }
                        placeholder="Ex: Canal Games"
                      />
                    </div>
                    {newSource.provider === "rss" ? (
                      <div className="space-y-2">
                        <Label>URL do feed RSS</Label>
                        <Input
                          value={newSource.rss_url}
                          onChange={(e) =>
                            setNewSource((s) => ({ ...s, rss_url: e.target.value }))
                          }
                          placeholder="https://exemplo.com/feed.xml"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>URL do canal ou Channel ID (YouTube)</Label>
                        <Input
                          value={newSource.channel_id}
                          onChange={(e) =>
                            setNewSource((s) => ({
                              ...s,
                              channel_id: e.target.value,
                            }))
                          }
                          placeholder="https://www.youtube.com/@Canal/videos ou UC..."
                        />
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button type="submit" size="sm">
                        Criar fonte
                      </Button>
                      {addSourceError ? (
                        <span className="text-sm text-destructive">
                          {addSourceError}
                        </span>
                      ) : null}
                      {addSourceSuccess ? (
                        <span className="text-sm text-primary">Fonte criada.</span>
                      ) : null}
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : null}
          </div>

          <Button
            onClick={onTriggerIngestion}
            disabled={isLoading}
          >
            {isLoading ? "Processando..." : "Buscar e criar notícias"}
          </Button>
        </CardContent>
      </Card>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}
      {result ? (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <p className="text-sm">
              <strong>Total criados:</strong>{" "}
              {result.createdArticles > 0 && `${result.createdArticles} artigos`}
              {result.createdArticles > 0 &&
                (result.createdVideos ?? 0) > 0 &&
                " · "}
              {(result.createdVideos ?? 0) > 0 &&
                `${result.createdVideos} vídeos (tabela youtube_videos)`}
              {result.createdArticles === 0 &&
                (result.createdVideos ?? 0) === 0 &&
                "0"}
              {" · Descartados (idioma): "}
              {result.discardedByLanguage}
              {" · Descartados (validação): "}
              {result.discardedByValidation ?? 0}
            </p>
            {(result.createdVideos ?? 0) > 0 ? (
              <p className="text-xs text-muted-foreground">
                Os vídeos YouTube ficam na tabela{" "}
                <strong>youtube_videos</strong> no Supabase e ainda não aparecem
                na listagem pública de notícias do site.
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
            {result.failedSources &&
            Object.keys(result.failedSources).length > 0 ? (
              <div className="space-y-1">
                <strong className="text-destructive">
                  Fontes com erro (RSS indisponível ou TLS):
                </strong>
                <ul className="list-inside space-y-0.5 text-sm text-destructive/90">
                  {Object.entries(result.failedSources).map(([id, msg]) => (
                    <li key={id}>
                      <strong>{id}</strong>:{" "}
                      {msg.slice(0, 120)}
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
