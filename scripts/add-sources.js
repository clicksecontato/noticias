#!/usr/bin/env node
/**
 * Adiciona as fontes de notícias de games na base via API admin.
 *
 * Uso:
 *   BASE_URL=http://localhost:3000 ADMIN_INGEST_TOKEN=seu_token node scripts/add-sources.js
 *
 * Ou crie um .env na raiz com BASE_URL e ADMIN_INGEST_TOKEN e rode:
 *   node scripts/add-sources.js
 *
 * Requer a aplicação rodando (npm run dev) ou a API acessível em BASE_URL.
 */

import { SOURCES_TO_ADD } from "./sources-list.js";

const BASE_URL = process.env.BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const ADMIN_TOKEN = process.env.ADMIN_INGEST_TOKEN;

if (!ADMIN_TOKEN) {
  console.error("Defina ADMIN_INGEST_TOKEN no ambiente (ou no .env).");
  process.exit(1);
}

const apiUrl = `${BASE_URL.replace(/\/$/, "")}/api/admin/sources`;
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${ADMIN_TOKEN}`,
};

async function addSource(source) {
  const res = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      id: source.id,
      name: source.name,
      rss_url: source.rss_url,
      language: "pt-BR",
      base_url: source.base_url,
      is_active: true,
      trust_score: 70,
    }),
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text };
  }
  return { ok: res.ok, status: res.status, data };
}

async function main() {
  console.log(`Adicionando ${SOURCES_TO_ADD.length} fontes em ${apiUrl}...\n`);
  let ok = 0;
  let fail = 0;
  for (const source of SOURCES_TO_ADD) {
    const result = await addSource(source);
    if (result.ok) {
      ok++;
      console.log(`  [OK] ${source.id} - ${source.name}`);
    } else {
      fail++;
      const msg = result.data?.error || result.data?.message || result.status;
      console.log(`  [ERRO] ${source.id} - ${source.name}: ${msg}`);
    }
  }
  console.log(`\nConcluído: ${ok} adicionados/atualizados, ${fail} falhas.`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
