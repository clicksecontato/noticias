# Database Migrations (Supabase)

Ordem de execução:

1. `001_init_core_tables.sql`
2. `002_init_indexes_constraints.sql`
3. `003_seed_minimal_content.sql`
4. `004_enable_rls_policies.sql` (opcional, recomendado)
5. `005_fix_combo_infinito_feed.sql` — Combo Infinito: URL do feed é `https://www.comboinfinito.com.br/principal/feed/`

## Execução pelo Supabase SQL Editor

Cole e execute cada arquivo na ordem acima.

## Execução com Supabase CLI

```bash
supabase db push
```

Se você estiver aplicando manualmente via SQL Editor, mantenha os nomes dos arquivos para rastreabilidade.
