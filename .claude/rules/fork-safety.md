---
paths:
  - "**/*"
---

# Fork Safety — Regras globais do Orbi

## Conventions

- Ir devagar, mudancas incrementais — entender antes de mudar
- Manter maximo do original ate ter confianca
- Buildar de dentro do package: `cd packages/orbi && bun run script/build.ts --single`
- Typecheck: `bun typecheck` (de dentro do package, nunca do root)
- Testes: rodar de dentro dos packages, nao do root
- Commitar frequente, mudancas pequenas
- Prefix de commits: `chore:`, `fix:`, `feat:`, `docs:`
- Push com `--no-verify` se husky bloquear por typecheck de packages removidos
- Atualizar FORK_LOG.md com o que foi feito

## Gotchas

- **Pacotes externos no rebrand**: Nunca renomear pacotes externos (ex: `@gitlab/opencode-gitlab-auth` e externo, nao nosso). So renomear referencias ao namespace `@orbi/` (interno)
- **bun.lock apos rebrand**: Sempre regenerar com `rm bun.lock && bun install` apos find & replace em massa
- **Patches**: Verificar `patches/` se algum patch referencia nomes antigos apos rebrand
- **Console removido**: `packages/console` foi deletado (SaaS deles). Se typecheck falhar referenciando console, verificar se algum import sobrou
- **Packages nao mexer por enquanto**: `packages/enterprise`, `packages/function` — serao removidos quando Arthur sentir confianca
