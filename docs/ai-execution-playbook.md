# AI Execution Playbook

Este playbook define como a IA deve trabalhar neste repositório.

## 1) Ordem obrigatória de execução

1. Ler contratos/testes existentes da área afetada.
2. Escrever/ajustar testes para o comportamento desejado.
3. Rodar testes e confirmar falha.
4. Implementar o mínimo para passar.
5. Rodar suíte completa.
6. Refatorar mantendo tudo verde.
7. Verificar lint dos arquivos alterados.

## 2) Regras de desacoplamento

- Não hardcodar ambiente em domínio: usar `config` provider.
- Não espalhar regras de negócio por rotas/controllers: usar `strategy` registry.
- Não duplicar listas de políticas/contratos: usar `policy` registry.
- Evitar `if` cascata em múltiplos módulos para o mesmo domínio.

## 3) Padrões por pacote

- `apps/web`:
  - `src/config.ts`
  - `src/page-strategy.ts`
  - `src/params-provider.ts`
- `packages/seo`:
  - `src/config.ts`
  - `src/strategy.ts`
- `packages/database`:
  - `src/config.ts`
  - `src/schema-policy.ts`

## 4) Checklist antes de concluir

- [ ] Testes novos representam requisito real
- [ ] Falha inicial registrada
- [ ] Implementação mínima sem overengineering
- [ ] Sem hardcode de ambiente em serviços de domínio
- [ ] Sem duplicação de políticas entre arquivos
- [ ] `npm test` verde
- [ ] `ReadLints` sem erro novo
