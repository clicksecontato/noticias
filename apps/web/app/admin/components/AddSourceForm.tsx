"use client";

import { useState } from "react";
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
import {
  buildAddSourceRequestBody,
  EMPTY_ADD_SOURCE_FORM,
  type AddSourceFormValues,
} from "@/src/admin/add-source";

interface AddSourceFormProps {
  /** Título do card (default: Nova fonte). */
  title?: string;
  /** Chamado após criar com sucesso (ex.: recarregar lista). */
  onCreated?: () => void;
  /** Se true, começa expandido. */
  defaultOpen?: boolean;
  /** Se true, sempre mostra o formulário (sem toggle). */
  alwaysOpen?: boolean;
}

export function AddSourceForm({
  title = "Nova fonte",
  onCreated,
  defaultOpen = false,
  alwaysOpen = false,
}: AddSourceFormProps) {
  const [open, setOpen] = useState(defaultOpen || alwaysOpen);
  const [form, setForm] = useState<AddSourceFormValues>(EMPTY_ADD_SOURCE_FORM);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const built = buildAddSourceRequestBody(form);
    if (!built.ok) {
      setError(built.error);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(built.body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error || "Erro ao criar fonte.");
        return;
      }
      setSuccess(true);
      setForm(EMPTY_ADD_SOURCE_FORM);
      onCreated?.();
    } catch {
      setError("Erro ao chamar a API.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      {!alwaysOpen ? (
        <Button
          type="button"
          variant={open ? "secondary" : "default"}
          size="sm"
          onClick={() => {
            setOpen((v) => !v);
            setError(null);
            setSuccess(false);
          }}
        >
          {open ? "Ocultar formulário" : "Adicionar fonte"}
        </Button>
      ) : null}

      {open ? (
        <Card className="border-border/80 bg-muted/20 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={form.provider}
                    onValueChange={(value) =>
                      setForm((s) => ({
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
                  <Label>Idioma</Label>
                  <Select
                    value={form.language}
                    onValueChange={(value) =>
                      setForm((s) => ({ ...s, language: value ?? "pt-BR" }))
                    }
                  >
                    <SelectTrigger className="h-9 w-full bg-background text-foreground">
                      <SelectValue placeholder="Idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">pt-BR</SelectItem>
                      <SelectItem value="pt">pt</SelectItem>
                      <SelectItem value="en-US">en-US</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    ID (único)
                    {form.provider === "youtube" ? " — opcional" : ""}
                  </Label>
                  <Input
                    value={form.id}
                    onChange={(e) => setForm((s) => ({ ...s, id: e.target.value }))}
                    placeholder={
                      form.provider === "youtube"
                        ? "Gerado da URL se vazio"
                        : "ex: tecnoblog"
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                    placeholder="Ex: Tecnoblog"
                    required
                  />
                </div>
              </div>

              {form.provider === "rss" ? (
                <div className="space-y-2">
                  <Label>URL do feed RSS</Label>
                  <Input
                    value={form.rss_url}
                    onChange={(e) => setForm((s) => ({ ...s, rss_url: e.target.value }))}
                    placeholder="https://exemplo.com/feed.xml"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>URL do canal ou Channel ID (YouTube)</Label>
                  <Input
                    value={form.channel_id}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, channel_id: e.target.value }))
                    }
                    placeholder="https://www.youtube.com/@Canal/videos ou UC..."
                  />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? "Criando…" : "Criar fonte"}
                </Button>
                {error ? <span className="text-sm text-destructive">{error}</span> : null}
                {success ? (
                  <span className="text-sm text-success">Fonte criada com sucesso.</span>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
