# ADR 0002: Boundaries and Dependencies

- Status: Accepted
- Date: 2026-03-10

## Contexto

Com múltiplos agentes e módulos, o risco principal é erosão arquitetural por imports cruzados não planejados.
Precisamos de uma política explícita de dependências permitidas para manter desacoplamento e evolução segura.

## Decisão

Definir fronteiras de dependência por camada:

- `apps/*` podem depender de `packages/*`.
- `packages/*` não podem depender de `apps/*`.
- `packages/*` não devem depender entre si sem necessidade explícita de domínio.
- `infra/*` não deve importar código de runtime de `apps/*` nem de `packages/*`.
- `docs/*` sem dependência de código.

## Matriz de dependências permitidas

Legenda:
- `OK`: permitido
- `NO`: proibido
- `LIMITADO`: somente via contratos utilitários estáveis

| From \ To          | apps/web | apps/api | packages/* | infra/aws | docs |
|--------------------|----------|----------|------------|-----------|------|
| apps/web           | OK (self)| NO       | OK         | NO        | OK   |
| apps/api           | NO       | OK (self)| OK         | NO        | OK   |
| packages/database  | NO       | NO       | LIMITADO   | NO        | OK   |
| packages/seo       | NO       | NO       | LIMITADO   | NO        | OK   |
| packages/ai        | NO       | NO       | LIMITADO   | NO        | OK   |
| packages/scraping  | NO       | NO       | LIMITADO   | NO        | OK   |
| infra/aws          | NO       | NO       | NO         | OK (self) | OK   |
| docs               | NO       | NO       | NO         | NO        | OK   |

## Regras operacionais

1. Antes de criar import, validar se está na matriz `OK` ou `LIMITADO`.
2. Se for `LIMITADO`, extrair contrato mínimo em módulo estável e sem dependência circular.
3. Nunca importar de `app/` para `packages/`.
4. Nunca importar lógica de runtime para `infra/aws`.
5. Em dúvida, priorizar duplicação pequena temporária em vez de acoplamento estrutural.

## Anti-exemplos (proibidos)

- `packages/seo` importando `apps/web/src/*`.
- `packages/database` importando handler HTTP de `apps/api`.
- `infra/aws` importando helpers de runtime de `apps/web`.

## Exemplos recomendados

- `apps/web` importando `packages/seo/src/*` para metadata e sitemap.
- `apps/api` importando `packages/database/src/*` para políticas de schema.
- `packages/*` compartilhando apenas tipos/contratos estáveis.

## Enforcements sugeridos

- Curto prazo:
  - Revisão de PR com checklist de fronteiras.
  - IA deve checar matriz antes de criar novos imports.
- Médio prazo:
  - Adicionar lint de boundaries com `eslint-plugin-boundaries` ou equivalente.
  - Falhar CI se houver import proibido.

## Consequências

Positivas:
- previsibilidade arquitetural,
- menor acoplamento acidental,
- refatorações mais seguras.

Negativas:
- mais disciplina na extração de contratos,
- possível aumento de arquivos de interface.
