"use client";

import { useEffect, useState } from "react";

interface ApiResult {
  processedSourceIds: string[];
  createdArticles: number;
  discardedByLanguage: number;
  discardedByValidation?: number;
  createdBySource?: Record<string, number>;
  skippedBySource?: Record<string, number>;
  skippedArticles?: Array<{ sourceId: string; title: string; sourceUrl?: string }>;
}

export function AdminIngestionClient() {
  const [token, setToken] = useState("");
  const [sourceIds, setSourceIds] = useState("");
  const [result, setResult] = useState<ApiResult | null>(null);

  useEffect(() => {
    fetch("/api/admin/sources")
      .then((res) => res.json())
      .then((data: { sourceIds?: string[] }) => {
        if (Array.isArray(data.sourceIds) && data.sourceIds.length > 0) {
          setSourceIds(data.sourceIds.join(", "));
        }
      })
      .catch(() => {});
  }, []);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      <h1>Admin de Ingestão Manual</h1>
      <p>Dispare a busca e criação de notícias em Português Brasileiro.</p>

      <label htmlFor="token">Token Admin</label>
      <input
        id="token"
        type="password"
        value={token}
        onChange={(event) => setToken(event.target.value)}
        style={{ display: "block", width: "100%", marginBottom: "1rem" }}
      />

      <label htmlFor="sourceIds">IDs das fontes (separados por vírgula)</label>
      <input
        id="sourceIds"
        value={sourceIds}
        onChange={(event) => setSourceIds(event.target.value)}
        style={{ display: "block", width: "100%", marginBottom: "1rem" }}
      />

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
            <strong>Total criados:</strong> {result.createdArticles} · Descartados (idioma):{" "}
            {result.discardedByLanguage} · Descartados (validação):{" "}
            {result.discardedByValidation ?? 0}
          </p>
          {result.createdBySource && Object.keys(result.createdBySource).length > 0 ? (
            <p style={{ margin: "0 0 0.25rem" }}>
              <strong>Criados por fonte:</strong>{" "}
              {Object.entries(result.createdBySource)
                .map(([id, n]) => `${id}: ${n}`)
                .join(" · ")}
            </p>
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
