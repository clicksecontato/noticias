"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { useRouter } from "next/navigation";

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

export function AdminIngestionClient() {
  const router = useRouter();
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
    language: "pt-BR"
  });
  const [addSourceError, setAddSourceError] = useState<string | null>(null);
  const [addSourceSuccess, setAddSourceSuccess] = useState(false);

  async function onLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

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
      provider: newSource.provider
    };
    if (newSource.provider === "youtube") {
      if (!newSource.channel_id.trim()) {
        setAddSourceError("Informe a URL do canal (o ID da fonte é gerado automaticamente).");
        return;
      }
      body.channel_id = newSource.channel_id.trim();
      if (!newSource.id.trim()) body.id = ""; // backend gera a partir do handle
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
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) {
        setAddSourceError(data.error || "Erro ao criar fonte.");
        return;
      }
      setAddSourceSuccess(true);
      setNewSource({ id: "", name: "", provider: "rss", rss_url: "", channel_id: "", language: "pt-BR" });
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

      const response = await fetch("/api/admin/ingest-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, sourceIds: ids })
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
    <div style={{ maxWidth: 720, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: "1rem" }}>
        <h1 style={{ margin: 0 }}>Admin de Ingestão Manual</h1>
        <button
          type="button"
          onClick={onLogout}
          style={{
            padding: "0.35rem 0.75rem",
            fontSize: 14,
            background: "transparent",
            color: "#64748b",
            border: "1px solid #334155",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Sair
        </button>
      </div>
      <p>Dispare a busca e criação de notícias em Português Brasileiro.</p>

      <label htmlFor="token">Token Admin</label>
      <input
        id="token"
        type="password"
        value={token}
        onChange={(event) => setToken(event.target.value)}
        style={{ display: "block", width: "100%", marginBottom: "1rem" }}
      />

      {sources.length > 0 ? (
        <div style={{ marginBottom: "1rem", padding: "0.75rem", background: "#0f172a", borderRadius: 8, border: "1px solid #334155" }}>
          <strong style={{ color: "#e2e8f0" }}>Fontes disponíveis</strong>
          <ul style={{ margin: "0.5rem 0 0 1.25rem", padding: 0, fontSize: 14, color: "#94a3b8" }}>
            {sources.map((s) => (
              <li key={s.id} style={{ marginBottom: "0.25rem" }}>
                <span style={{ fontWeight: 600 }}>{s.name}</span>{" "}
                <span style={{ color: "#64748b" }}>({s.id})</span>{" "}
                —{" "}
                <span
                  style={{
                    padding: "0.1rem 0.4rem",
                    borderRadius: 4,
                    fontSize: 12,
                    background: s.provider === "youtube" ? "#7c3aed" : "#0ea5e9",
                    color: "#fff"
                  }}
                >
                  {s.provider === "youtube" ? "YouTube" : "RSS"}
                </span>
                {s.provider === "youtube" && s.channelId ? (
                  <span style={{ marginLeft: 6, fontSize: 12 }}>Canal: {s.channelId}</span>
                ) : null}
                {s.provider === "rss" && s.rssUrl ? (
                  <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.9 }}>{s.rssUrl}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <label htmlFor="sourceIds">IDs das fontes (separados por vírgula)</label>
      <input
        id="sourceIds"
        value={sourceIds}
        onChange={(event) => setSourceIds(event.target.value)}
        style={{ display: "block", width: "100%", marginBottom: "1rem" }}
        placeholder="Ex: s1, s2, yt-canal-games"
      />

      <div style={{ marginBottom: "1rem" }}>
        <button
          type="button"
          onClick={() => setShowAddSource((v) => !v)}
          style={{
            padding: "0.35rem 0.75rem",
            fontSize: 14,
            background: "transparent",
            color: "#94a3b8",
            border: "1px solid #475569",
            borderRadius: 6,
            cursor: "pointer"
          }}
        >
          {showAddSource ? "Ocultar formulário" : "Adicionar nova fonte"}
        </button>
        {showAddSource ? (
          <form onSubmit={onAddSource} style={{ marginTop: 12, padding: 12, background: "#1e293b", borderRadius: 8, border: "1px solid #334155" }}>
            <label style={{ display: "block", marginBottom: 4, color: "#e2e8f0" }}>Tipo</label>
            <select
              value={newSource.provider}
              onChange={(e) => setNewSource((s) => ({ ...s, provider: e.target.value as "rss" | "youtube" }))}
              style={{ display: "block", width: "100%", marginBottom: 8, padding: 6 }}
            >
              <option value="rss">RSS</option>
              <option value="youtube">YouTube</option>
            </select>
            <label style={{ display: "block", marginBottom: 4, color: "#e2e8f0" }}>
              ID (único){newSource.provider === "youtube" ? " — opcional, gerado da URL" : ""}
            </label>
            <input
              value={newSource.id}
              onChange={(e) => setNewSource((s) => ({ ...s, id: e.target.value }))}
              placeholder={newSource.provider === "youtube" ? "Deixe em branco para gerar automaticamente" : "Ex: meu-canal-yt"}
              style={{ display: "block", width: "100%", marginBottom: 8, padding: 6 }}
            />
            <label style={{ display: "block", marginBottom: 4, color: "#e2e8f0" }}>Nome</label>
            <input
              value={newSource.name}
              onChange={(e) => setNewSource((s) => ({ ...s, name: e.target.value }))}
              placeholder="Ex: Canal Games"
              style={{ display: "block", width: "100%", marginBottom: 8, padding: 6 }}
            />
            {newSource.provider === "rss" ? (
              <>
                <label style={{ display: "block", marginBottom: 4, color: "#e2e8f0" }}>URL do feed RSS</label>
                <input
                  value={newSource.rss_url}
                  onChange={(e) => setNewSource((s) => ({ ...s, rss_url: e.target.value }))}
                  placeholder="https://exemplo.com/feed.xml"
                  style={{ display: "block", width: "100%", marginBottom: 8, padding: 6 }}
                />
              </>
            ) : (
              <>
                <label style={{ display: "block", marginBottom: 4, color: "#e2e8f0" }}>URL do canal ou Channel ID (YouTube)</label>
                <input
                  value={newSource.channel_id}
                  onChange={(e) => setNewSource((s) => ({ ...s, channel_id: e.target.value }))}
                  placeholder="https://www.youtube.com/@Canal/videos ou UC..."
                  style={{ display: "block", width: "100%", marginBottom: 8, padding: 6 }}
                />
              </>
            )}
            <button type="submit" style={{ padding: "0.35rem 0.75rem", marginRight: 8 }}>Criar fonte</button>
            {addSourceError ? <span style={{ color: "#f87171", marginLeft: 8 }}>{addSourceError}</span> : null}
            {addSourceSuccess ? <span style={{ color: "#4ade80", marginLeft: 8 }}>Fonte criada.</span> : null}
          </form>
        ) : null}
      </div>

      <button onClick={onTriggerIngestion} disabled={isLoading}>
        {isLoading ? "Processando..." : "Buscar e criar notícias"}
      </button>

      {error ? <p style={{ color: "#f87171" }}>{error}</p> : null}
      {result ? (
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            background: "#1e293b",
            color: "#e2e8f0",
            borderRadius: "8px",
            border: "1px solid #334155"
          }}
        >
          <p style={{ margin: "0 0 0.5rem" }}>
            <strong>Total criados:</strong>{" "}
            {result.createdArticles > 0 && `${result.createdArticles} artigos`}
            {result.createdArticles > 0 && (result.createdVideos ?? 0) > 0 && " · "}
            {(result.createdVideos ?? 0) > 0 && `${result.createdVideos} vídeos (tabela youtube_videos)`}
            {result.createdArticles === 0 && (result.createdVideos ?? 0) === 0 && "0"}
            {" · Descartados (idioma): "}{result.discardedByLanguage}
            {" · Descartados (validação): "}{result.discardedByValidation ?? 0}
          </p>
          {(result.createdVideos ?? 0) > 0 ? (
            <p style={{ margin: "0 0 0.25rem", fontSize: 13, color: "#94a3b8" }}>
              Os vídeos YouTube ficam na tabela <strong>youtube_videos</strong> no Supabase e ainda não aparecem na listagem pública de notícias do site.
            </p>
          ) : null}
          {result.createdBySource && Object.keys(result.createdBySource).length > 0 ? (
            <p style={{ margin: "0 0 0.25rem" }}>
              <strong>Criados por fonte:</strong>{" "}
              {Object.entries(result.createdBySource)
                .map(([id, n]) => `${id}: ${n}`)
                .join(" · ")}
            </p>
          ) : null}
          {result.failedSources && Object.keys(result.failedSources).length > 0 ? (
            <div style={{ marginTop: "0.75rem" }}>
              <strong style={{ color: "#fbbf24" }}>Fontes com erro (RSS indisponível ou TLS):</strong>
              <ul style={{ margin: "0.25rem 0 0 1.25rem", padding: 0, fontSize: 13, color: "#fcd34d" }}>
                {Object.entries(result.failedSources).map(([id, msg]) => (
                  <li key={id}>
                    <strong>{id}</strong>: {msg.slice(0, 120)}{msg.length > 120 ? "…" : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {result.skippedArticles && result.skippedArticles.length > 0 ? (
            <div style={{ marginTop: "0.75rem" }}>
              <strong>Já existentes (não duplicados):</strong>
              <ul style={{ margin: "0.25rem 0 0 1.25rem", padding: 0, fontSize: 14 }}>
                {result.skippedArticles.map((a, i) => (
                  <li key={`${a.sourceId}-${i}-${a.title.slice(0, 30)}`}>
                    {a.title}
                    {a.sourceUrl ? (
                      <span style={{ opacity: 0.85, fontSize: 12 }}>
                        {" "}
                        · <a href={a.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#7dd3fc" }}>link</a>
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <pre
            style={{
              marginTop: "0.75rem",
              padding: "0.75rem",
              background: "#0f172a",
              color: "#94a3b8",
              borderRadius: "6px",
              fontSize: 11,
              overflow: "auto"
            }}
          >
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
