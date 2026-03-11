"use client";

import { createClient } from "@/src/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "4rem auto", fontFamily: "sans-serif" }}>
      <h1 style={{ marginBottom: 8 }}>Acesso Admin</h1>
      <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
        Faça login com sua conta cadastrada para acessar o painel.
      </p>
      <form onSubmit={onSubmit}>
        <label htmlFor="email" style={{ display: "block", marginBottom: 4 }}>
          E-mail
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          style={{
            display: "block",
            width: "100%",
            marginBottom: "1rem",
            padding: "0.5rem 0.75rem",
            border: "1px solid #334155",
            borderRadius: 6,
          }}
        />
        <label htmlFor="password" style={{ display: "block", marginBottom: 4 }}>
          Senha
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          style={{
            display: "block",
            width: "100%",
            marginBottom: "1rem",
            padding: "0.5rem 0.75rem",
            border: "1px solid #334155",
            borderRadius: 6,
          }}
        />
        {error ? (
          <p style={{ color: "#f87171", marginBottom: "1rem", fontSize: 14 }}>
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.5rem 1rem",
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
