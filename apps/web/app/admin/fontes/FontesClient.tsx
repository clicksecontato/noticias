"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Rss } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddSourceForm } from "../components/AddSourceForm";
import { AdminPageTitle } from "../components/AdminPageTitle";
import { useSystemDialogs } from "../../components/useSystemDialogs";
import { buildDeleteConfirmCopy } from "@/src/ui/confirm-dialog";
import { formatIngestionDurationMs } from "@/src/ui/format-ingestion-duration";

interface SourceItem {
  id: string;
  name: string;
  rssUrl?: string;
  language: string;
  isActive: boolean;
  provider?: "rss" | "youtube";
  channelId?: string;
  imageUrl?: string;
  baseUrl?: string;
  trustScore?: number;
  lastIngestedAt?: string;
  lastIngestionDurationMs?: number;
}

export function FontesClient() {
  const { showAlert, showConfirm, dialogs } = useSystemDialogs();
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  function loadSources() {
    setLoading(true);
    fetch("/api/admin/sources?all=true")
      .then((res) => res.json())
      .then(async (data: { sources?: SourceItem[] }) => {
        const list = Array.isArray(data.sources) ? data.sources : [];
        setSources(list);
        const needsAvatar = list.some(
          (s) => s.provider === "youtube" && s.channelId && !s.imageUrl
        );
        if (needsAvatar) {
          try {
            const syncRes = await fetch("/api/admin/sources/sync-avatars", {
              method: "POST",
            });
            if (syncRes.ok) {
              const refreshed = await fetch("/api/admin/sources?all=true");
              const refreshedData = await refreshed.json();
              if (Array.isArray(refreshedData.sources)) {
                setSources(refreshedData.sources);
              }
            }
          } catch {
            /* sync opcional */
          }
        }
      })
      .catch(() => setSources([]))
      .finally(() => setLoading(false));
  }

  async function handleToggleActive(id: string, current: boolean) {
    if (togglingId) return;
    const next = !current;
    setSources((prev) => prev.map((s) => (s.id === id ? { ...s, isActive: next } : s)));
    setTogglingId(id);
    try {
      const res = await fetch(`/api/admin/sources/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: next }),
      });
      if (!res.ok) {
        setSources((prev) => prev.map((s) => (s.id === id ? { ...s, isActive: current } : s)));
        const data = await res.json().catch(() => ({}));
        showAlert(data.error || "Falha ao atualizar. Tente de novo.", "Erro");
      }
    } catch {
      setSources((prev) => prev.map((s) => (s.id === id ? { ...s, isActive: current } : s)));
      showAlert("Falha ao atualizar. Tente de novo.", "Erro");
    } finally {
      setTogglingId(null);
    }
  }

  useEffect(() => {
    loadSources();
  }, []);

  function handleDelete(id: string, name: string) {
    const copy = buildDeleteConfirmCopy({
      entity: "fonte",
      name,
      consequence: "Artigos e vídeos vinculados podem ser afetados.",
    });
    showConfirm({
      ...copy,
      confirmVariant: "destructive",
      onConfirm: async () => {
        setDeleting(true);
        try {
          const res = await fetch(`/api/admin/sources/${encodeURIComponent(id)}`, {
            method: "DELETE",
          });
          if (res.ok) loadSources();
          else {
            const data = await res.json().catch(() => ({}));
            showAlert(data.error || "Erro ao excluir.", "Erro");
          }
        } finally {
          setDeleting(false);
        }
      },
    });
  }

  const rssCount = sources.filter((s) => s.provider === "rss").length;
  const youtubeCount = sources.filter((s) => s.provider === "youtube").length;

  return (
    <div className="space-y-6">
      {dialogs}
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border/70 pb-4">
        <div className="space-y-1.5">
          <AdminPageTitle icon={Rss}>Fontes</AdminPageTitle>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Cadastre e gerencie feeds RSS e canais YouTube usados na atualização.
          </p>
          {!loading ? (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">{rssCount}</span> RSS ·{" "}
              <span className="font-medium text-foreground/80">{youtubeCount}</span> YouTube ·{" "}
              <span className="font-medium text-foreground/80">{sources.length}</span> no total
            </p>
          ) : null}
        </div>
        <Button
          size="sm"
          className="gap-1.5 shadow-sm shadow-primary/15"
          onClick={() => setShowCreate((v) => !v)}
        >
          <Plus className="h-4 w-4" />
          {showCreate ? "Fechar" : "Nova fonte"}
        </Button>
      </header>

      {showCreate || (!loading && sources.length === 0) ? (
        <AddSourceForm
          title="Cadastrar fonte"
          alwaysOpen
          onCreated={() => {
            loadSources();
            setShowCreate(true);
          }}
        />
      ) : null}

      {loading ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : sources.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/10 px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma fonte cadastrada. Use o formulário acima para criar a primeira.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Depois atualize as fontes em{" "}
            <Link href="/admin/ingestao" className="text-primary underline-offset-2 hover:underline">
              Atualizar Fontes
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border/60">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20 text-muted-foreground">
                <th className="p-3 text-left font-medium">Nome</th>
                <th className="p-3 text-left font-medium">Tipo</th>
                <th className="p-3 text-left font-medium">Idioma</th>
                <th className="p-3 text-left font-medium">Última atualização</th>
                <th className="p-3 text-left font-medium">Duração</th>
                <th className="p-3 text-left font-medium">Ativo</th>
                <th className="p-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-border/70 transition-colors hover:bg-muted/20"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {s.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s.imageUrl}
                          alt=""
                          width={28}
                          height={28}
                          className="size-7 shrink-0 rounded-full object-cover ring-1 ring-border/60"
                        />
                      ) : (
                        <span
                          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground"
                          aria-hidden
                        >
                          {s.provider === "youtube" ? "YT" : "RSS"}
                        </span>
                      )}
                      <span className="truncate font-medium">{s.name}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant={s.provider === "youtube" ? "info" : "soft"}>
                      {s.provider === "youtube" ? "YouTube" : "RSS"}
                    </Badge>
                  </td>
                  <td className="p-3">{s.language}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {s.lastIngestedAt
                      ? new Date(s.lastIngestedAt).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        })
                      : "—"}
                  </td>
                  <td className="p-3 font-mono text-xs tabular-nums">
                    {formatIngestionDurationMs(s.lastIngestionDurationMs)}
                  </td>
                  <td className="p-3">
                    <Button
                      type="button"
                      variant={s.isActive ? "default" : "secondary"}
                      size="sm"
                      className="h-7 cursor-pointer px-2.5 font-normal transition-opacity hover:opacity-90"
                      disabled={togglingId === s.id}
                      onClick={() => handleToggleActive(s.id, s.isActive)}
                      title="Clique para alternar entre Sim e Não"
                    >
                      {togglingId === s.id ? "…" : s.isActive ? "Sim" : "Não"}
                    </Button>
                  </td>
                  <td className="p-3 text-right">
                    <Link href={`/admin/fontes/${encodeURIComponent(s.id)}`}>
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 text-destructive hover:text-destructive"
                      disabled={deleting}
                      onClick={() => handleDelete(s.id, s.name)}
                    >
                      Excluir
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
