"use client";

import { useEffect, useState } from "react";
import { Check, ClipboardCopy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AdminPageTitle } from "../components/AdminPageTitle";

export function CanaisYoutubeUrlsClient() {
  const [text, setText] = useState("");
  const [missing, setMissing] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/admin/youtube-channel-urls")
      .then((response) => response.json())
      .then((data: { text?: string; missing?: string[]; error?: string }) => {
        if (data.error) {
          setError(data.error);
          setText("");
          setMissing([]);
          return;
        }
        setText(typeof data.text === "string" ? data.text : "");
        setMissing(Array.isArray(data.missing) ? data.missing : []);
      })
      .catch(() => setError("Não foi possível carregar os canais."))
      .finally(() => setLoading(false));
  }, []);

  const count = text ? text.split("\n").filter(Boolean).length : 0;

  async function copyAll() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Não foi possível copiar. Selecione o texto e copie manualmente.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <AdminPageTitle icon={ClipboardCopy} hint="Uma URL @canal por linha, para a descrição do YouTube.">
          URLs dos canais
        </AdminPageTitle>
        <Button type="button" className="gap-2" onClick={() => void copyAll()} disabled={!text || loading}>
          {copied ? <Check className="size-4" aria-hidden /> : <ClipboardCopy className="size-4" aria-hidden />}
          {copied ? "Copiado" : "Copiar tudo"}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        {loading
          ? "Buscando o @ de cada canal ativo…"
          : error
            ? error
            : `${count} ${count === 1 ? "canal ativo" : "canais ativos"}. Cada linha é https://www.youtube.com/@canal, para colar na descrição.`}
      </p>
      <Textarea
        readOnly
        value={text}
        rows={Math.min(24, Math.max(8, count || 8))}
        className="min-h-64 font-mono text-sm"
        aria-label="URLs @ dos canais YouTube ativos"
        onFocus={(event) => event.currentTarget.select()}
      />
      {missing.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          Sem @ público: {missing.join(", ")}.
        </p>
      ) : null}
    </div>
  );
}
