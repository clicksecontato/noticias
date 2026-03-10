"use client";

import { useState } from "react";

interface ApiResult {
  processedSourceIds: string[];
  createdArticles: number;
  discardedByLanguage: number;
}

export function AdminIngestionClient() {
  const [token, setToken] = useState("");
  const [sourceIds, setSourceIds] = useState("s1,s2");
  const [result, setResult] = useState<ApiResult | null>(null);
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

      {error ? <p style={{ color: "red" }}>{error}</p> : null}
      {result ? (
        <pre style={{ background: "#f3f3f3", padding: "1rem", marginTop: "1rem" }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
