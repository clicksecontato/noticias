# ADR 0001: AI Engineering Governance (TDD + SOLID)

- Status: Accepted
- Date: 2026-03-10

## Contexto

O projeto evolui com forte participação de agentes de IA. Sem governança explícita, há risco de:
- acoplamento acidental entre camadas (App Router, SEO, DB),
- regressões arquiteturais por hardcode,
- implementação antes de testes.

## Decisão

Adotar governança técnica obrigatória para qualquer mudança:

1. TDD estrito: teste falhando -> implementação mínima -> refatoração.
2. Arquitetura orientada a registries/providers:
   - Web: `config`, `page-strategy`, `params-provider`.
   - SEO: `config`, `strategy`.
   - Database: `config`, `schema-policy`.
3. Proibir hardcode de configuração de ambiente em módulos de domínio.
4. Separar contrato de política de implementação para facilitar extensão (OCP).
5. Preservar APIs públicas atuais e evoluir via adaptação interna.

## Consequências

Positivas:
- maior previsibilidade para agentes de IA,
- menor acoplamento e maior reuso,
- mudança de estratégia sem editar múltiplos pontos.

Custos:
- mais arquivos de abstração,
- disciplina adicional para manter contratos e testes sincronizados.

## Guardrails obrigatórios

- Nova feature sem testes: bloqueada.
- Nova regra de negócio em rota/página: extrair para strategy/provider.
- Novo valor de ambiente: centralizar em `*config.ts`.
- Duplicação de políticas de schema: centralizar em `schema-policy`.
