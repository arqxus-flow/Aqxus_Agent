---
description: Regras de segurança para trabalhar no fork do Orbi
globs: ["**"]
---

# Regras do Fork Orbi

## Filosofia
- Ir devagar, mudanças incrementais
- Engenharia reversa: entender antes de mudar
- Manter máximo do original até ter confiança
- Só eliminar o que entende completamente

## Build
- Sempre buildar de dentro do package: `cd packages/orbi && bun run script/build.ts --single`
- Typecheck: `bun typecheck` (de dentro do package, nunca do root)
- Testes: rodar de dentro dos packages

## Git
- Commitar frequente, mudanças pequenas
- Prefix de commits: `chore:`, `fix:`, `feat:`, `docs:`
- Push com `--no-verify` se husky bloquear por typecheck do console (SaaS deles)
- Sempre atualizar FORK_LOG.md com o que foi feito

## Cuidados no rebrand
- Nunca renomear pacotes EXTERNOS (ex: @gitlab/opencode-gitlab-auth é externo)
- Só renomear referências ao namespace @orbi (interno)
- Após rebrand, regenerar bun.lock: `rm bun.lock && bun install`
- Verificar patches/ se algum patch referencia nomes antigos

## Pacotes que NÃO mexer por enquanto
- packages/console (SaaS deles)
- packages/enterprise (enterprise deles)
- packages/function (Workers deles)
- Vão ser removidos quando Arthur sentir confiança
