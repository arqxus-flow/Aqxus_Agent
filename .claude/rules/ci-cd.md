---
paths:
  - ".github/**/*"
  - "packages/desktop/src-tauri/**/*"
  - "packages/desktop-electron/**/*"
  - "script/**/*"
---

# CI/CD — Build, Release e Distribuicao

## Conventions

- Release manual: GitHub Actions → publish → Run workflow → digitar versao
- Release por tag: `git tag v0.0.X && git push origin v0.0.X --no-verify`
- Electron desabilitado no CI pra economizar minutos (reativar quando necessario)
- Tauri e o desktop principal
- Sem certificado Apple/Windows por enquanto — apps mostram aviso no OS
- `xattr -cr /Applications/Orbi.app` pra abrir no macOS sem certificado

## Setup Completo (feito em 2026-03-22)

### 1. Signing keys do Tauri Updater

```bash
# Gerar par de chaves (pede password — anotar!)
cargo tauri signer generate -w ~/.tauri/orbi.key

# Chave privada: ~/.tauri/orbi.key (NUNCA compartilhar)
# Chave publica: ~/.tauri/orbi.key.pub (segura, vai no config)

# Ver chave publica
cat ~/.tauri/orbi.key.pub

# Ver chave privada (pra colar no GitHub secret)
cat ~/.tauri/orbi.key
```

### 2. Secrets no GitHub

Ir em: github.com/arqxus-flow/Aqxus_Agent → Settings → Secrets and variables → Actions

| Secret | Valor | Obrigatorio |
|--------|-------|-------------|
| `TAURI_SIGNING_PRIVATE_KEY` | Conteudo de `~/.tauri/orbi.key` (sem % do terminal) | Sim (pro updater) |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Password digitada ao gerar | Sim (pro updater) |
| `APPLE_CERTIFICATE` | p12 base64 | Nao (futuro, $99/ano) |
| `APPLE_CERTIFICATE_PASSWORD` | Password do p12 | Nao (futuro) |
| `APPLE_API_KEY` | Key ID da Apple | Nao (futuro) |
| `APPLE_API_KEY_PATH` | Conteudo do .p8 | Nao (futuro) |
| `APPLE_API_ISSUER` | Issuer ID | Nao (futuro) |
| `NPM_TOKEN` | Token do npm | Nao (futuro) |

### 3. Configs alterados

```
# Tauri updater — pubkey e endpoint
packages/desktop/src-tauri/tauri.prod.conf.json
  → pubkey: conteudo do ~/.tauri/orbi.key.pub
  → endpoints: ["https://github.com/arqxus-flow/Aqxus_Agent/releases/latest/download/latest.json"]
  → createUpdaterArtifacts: true

# Electron publish target
packages/desktop-electron/electron-builder.config.ts
  → publish.owner: "arqxus-flow"
  → publish.repo: "Aqxus_Agent"

# Workflow
.github/workflows/publish.yml
  → Triggers: workflow_dispatch + push tags v*
  → Runners: ubuntu-latest, macos-latest, windows-latest (free)
  → Auth: github.token (automatico)
  → Jobs: version → build-cli → build-tauri → finalize
  → Electron: desabilitado (economizar minutos)
```

### 4. Icones Electron Windows

```bash
# Electron precisa icon.ico com 256x256 minimo pra Windows
magick mark-512x512.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

## Gotchas

- **% no final da chave**: `cat ~/.tauri/orbi.key` mostra `%` no final — e o prompt do zsh, NAO faz parte da chave. Nao colar no secret
- **Secrets vazios**: Nunca passar secrets como env vars se podem ser vazios (ex: `APPLE_CERTIFICATE: ${{ secrets.X }}`). Electron-builder e Tauri tentam usar e falham. Comentar ou usar `CSC_IDENTITY_AUTO_DISCOVERY: "false"`
- **fetch-tags no checkout**: `actions/checkout@v4` com `fetch-tags: true` conflita quando o trigger e uma tag. Remover `fetch-tags`
- **Repo privado**: Updater nao funciona com repo privado (latest.json precisa ser publico). Opcoes: repo publico ou hospedar assets no Cloudflare R2
- **Updater so funciona entre versoes corretas**: App buildado com config antigo (pubkey/endpoint errado) nao detecta updates. Precisa instalar versao com config correto primeiro
- **createUpdaterArtifacts**: Precisa de TAURI_SIGNING_PRIVATE_KEY. Sem a key, build falha com "failed to decode secret key"
- **Minutos do Actions**: Plano free = 2.000 min/mes. Cada release com Tauri gasta ~100 min (sem Electron). Com Electron seria ~200 min

## Fluxo de Release

```
1. Fazer mudancas no codigo
2. Commit + push
3. git tag v0.0.X && git push origin v0.0.X --no-verify
4. CI dispara automaticamente (~30 min)
5. Release publicada em github.com/arqxus-flow/Aqxus_Agent/releases
6. Usuarios com app v0.0.3+ recebem update automatico via "Verificar agora"
```

## Fluxo de Release Manual

```
1. GitHub → Actions → publish → Run workflow
2. Digitar versao (ex: 0.0.5)
3. Run workflow
4. Esperar ~30 min
5. Release publicada
```

## Web UI (Cloudflare Pages)

`orbi web` faz proxy do frontend pra Cloudflare Pages. Dados 100% locais — Pages serve so arquivos estaticos.

```
# Projeto Pages: orbi-app
# URL: orbi-app.pages.dev

# Deploy manual (apos mudancas no frontend):
cd packages/app && bun run build
npx wrangler pages deploy dist --project-name orbi-app

# Proxy configurado em:
# packages/orbi/src/server/server.ts → proxy("https://orbi-app.pages.dev")
# Precisa rebuild do CLI apos mudar a URL:
# cd packages/orbi && bun run script/build.ts --single
```
