"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PublishResponse {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  message: string;
  targetVideoId?: string;
  targetVideoUrl?: string;
  errorMessage?: string;
}

interface JobStatusResponse {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  source_url: string;
  source_video_id: string;
  target_video_url?: string;
  error_message?: string;
}

export function YoutubeShortsClient({
  useSessionAuth = false,
}: {
  useSessionAuth?: boolean;
}) {
  const [token, setToken] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [targetTitle, setTargetTitle] = useState("");
  const [targetDescription, setTargetDescription] = useState("");
  const [targetTags, setTargetTags] = useState("");
  const [response, setResponse] = useState<PublishResponse | null>(null);
  const [job, setJob] = useState<JobStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingJob, setIsCheckingJob] = useState(false);

  async function onPublish() {
    setError(null);
    setResponse(null);
    setJob(null);
    setIsLoading(true);
    try {
      const payload: Record<string, unknown> = {
        sourceUrl: sourceUrl.trim(),
        targetTitle: targetTitle.trim() || undefined,
        targetDescription: targetDescription.trim() || undefined,
        targetTags: targetTags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };
      if (!useSessionAuth) {
        payload.token = token.trim();
      }

      const res = await fetch("/api/admin/youtube-shorts/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as PublishResponse | { error?: string };
      if (!res.ok) {
        setError(
          "error" in data && data.error ? data.error : "Falha ao iniciar publicação."
        );
        return;
      }
      setResponse(data as PublishResponse);
    } catch {
      setError("Erro ao chamar API de publicação.");
    } finally {
      setIsLoading(false);
    }
  }

  async function onCheckJob() {
    if (!response?.jobId) return;
    setIsCheckingJob(true);
    try {
      const headers: Record<string, string> = {};
      if (!useSessionAuth && token.trim()) {
        headers["X-Admin-Token"] = token.trim();
      }
      const res = await fetch(`/api/admin/youtube-shorts/jobs/${response.jobId}`, {
        headers,
      });
      const data = (await res.json()) as JobStatusResponse | { error?: string };
      if (!res.ok) {
        setError(
          "error" in data && data.error ? data.error : "Falha ao consultar job."
        );
        return;
      }
      setJob(data as JobStatusResponse);
    } catch {
      setError("Erro ao consultar status do job.");
    } finally {
      setIsCheckingJob(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">YouTube Shorts (repost)</h1>
        <p className="text-sm text-muted-foreground">
          Módulo novo e isolado para criar jobs de republicação de shorts no canal.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo job</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!useSessionAuth ? (
            <div className="space-y-2">
              <Label htmlFor="token">Token admin</Label>
              <Input
                id="token"
                type="password"
                value={token}
                onChange={(event) => setToken(event.target.value)}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="sourceUrl">URL do short no YouTube</Label>
            <Input
              id="sourceUrl"
              placeholder="https://www.youtube.com/shorts/..."
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetTitle">Título de destino (opcional)</Label>
            <Input
              id="targetTitle"
              value={targetTitle}
              onChange={(event) => setTargetTitle(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetDescription">Descrição (opcional)</Label>
            <Input
              id="targetDescription"
              value={targetDescription}
              onChange={(event) => setTargetDescription(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetTags">Tags (opcional, separadas por vírgula)</Label>
            <Input
              id="targetTags"
              value={targetTags}
              onChange={(event) => setTargetTags(event.target.value)}
            />
          </div>

          <Button onClick={onPublish} disabled={isLoading}>
            {isLoading ? "Criando job..." : "Criar job de republicação"}
          </Button>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {response ? (
        <Card>
          <CardHeader>
            <CardTitle>Resposta da publicação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              <strong>Job:</strong> {response.jobId || "—"}
            </p>
            <p className="text-sm">
              <strong>Status:</strong> {response.status}
            </p>
            <p className="text-sm">{response.message}</p>
            {response.targetVideoUrl ? (
              <p className="text-sm">
                Vídeo publicado:{" "}
                <a
                  className="text-primary hover:underline"
                  href={response.targetVideoUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {response.targetVideoUrl}
                </a>
              </p>
            ) : null}
            <Button onClick={onCheckJob} variant="outline" disabled={isCheckingJob}>
              {isCheckingJob ? "Consultando..." : "Atualizar status do job"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {job ? (
        <Card>
          <CardHeader>
            <CardTitle>Status persistido no banco</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-auto rounded-lg bg-muted p-3 text-xs">
              {JSON.stringify(job, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
