"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function EnriquecimentoClient() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    ok?: boolean;
    articlesProcessed?: number;
    videosProcessed?: number;
    error?: string;
  } | null>(null);

  async function onRunBackfill() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/enrichment-backfill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ error: data.error || "Erro ao rodar backfill." });
        return;
      }
      setResult({
        ok: data.ok,
        articlesProcessed: data.articlesProcessed,
        videosProcessed: data.videosProcessed,
      });
    } catch {
      setResult({ error: "Erro ao chamar a API." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Enriquecimento</h1>
      <p className="text-muted-foreground">
        Reaplica o vínculo de artigos e vídeos com jogos, tags, gêneros e plataformas (catálogo atual).
        Use após adicionar novos itens ao catálogo.
      </p>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Backfill</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={onRunBackfill} disabled={loading}>
            {loading ? "Processando…" : "Rodar backfill"}
          </Button>
          {result?.error ? (
            <p className="text-sm text-destructive">{result.error}</p>
          ) : result?.ok ? (
            <p className="text-sm text-muted-foreground">
              Concluído: {result.articlesProcessed ?? 0} artigos e {result.videosProcessed ?? 0}{" "}
              vídeos processados.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
