---
name: rules
description: Padroniza a criacao e edicao de rules do Claude Code (.claude/rules/*.md). Use quando for criar uma nova rule, adicionar um pattern/gotcha/convention, revisar rules existentes, ou decidir se algo deve ser rule vs graph.
---

# Gerenciar Rules do Claude Code

## O Que Esta Skill Faz

Cria e edita rules em `.claude/rules/` seguindo o padrao do projeto. Cada rule organiza conhecimento em 3 categorias:
- **Conventions** — padroes e convencoes a seguir sempre
- **Patterns** — solucoes reutilizaveis com exemplo de codigo
- **Gotchas** — armadilhas conhecidas e como evitar

## Quando Usar

- Criar uma nova rule
- Adicionar convention, pattern ou gotcha a uma rule existente
- Revisar/editar rules existentes
- Decidir se algo deve ser rule ou ir pro graph

---

## Estrutura Obrigatoria

Toda rule segue este formato:

```markdown
---
paths:
  - "caminho/para/arquivos/**/*.ts"
---

# Titulo da Rule

## Conventions

- Instrucao acionavel direta

## Patterns

- **Nome do pattern**: Descricao curta
  ```typescript
  // exemplo de codigo
  ```

## Gotchas

- **Nome curto**: Explicacao concisa do problema e como evitar
```

### Regras de cada secao

| Secao | Obrigatoria | Formato | O que contem |
|-------|-------------|---------|-------------|
| `## Conventions` | Sim | `- Instrucao direta` | Como escrever codigo nessa area. Imperativo, 1 linha |
| `## Patterns` | Se houver | `- **Nome**: Descricao` + codigo | Solucao reutilizavel com snippet. So adicionar se repete em 2+ lugares |
| `## Gotchas` | Se houver | `- **Nome**: Explicacao` | Armadilha que ja causou problema. Inclui o que fazer E o que nao fazer |

Secoes especificas de dominio sao permitidas quando necessario (ex: `## Migrations`), mas as 3 categorias acima sao o padrao base.

---

## Frontmatter `paths:`

Define quando a rule carrega — somente ao tocar em arquivos que batem com os globs.

```yaml
# BOM — especifico
paths:
  - "worker/routes/**/*.ts"
  - "worker/lib/shared/errors.ts"

# RUIM — generico demais
paths:
  - "**/*"
```

**Regras:**
- `paths:` e obrigatorio, exceto para rules globais (seguranca, deploy)
- Rules sem `paths:` carregam em toda conversa — usar apenas quando realmente global
- Usar `**/*.ts` para subpastas inteiras
- Listar arquivos especificos quando a rule se aplica a poucos

---

## Rule vs Graph

| Tipo de informacao | Onde | Exemplo |
|---|---|---|
| Convention (como fazer) | **Rule** | "Sempre usar safeParse()" |
| Pattern (solucao reutilizavel) | **Rule** | Template de cache, error handling |
| Gotcha (armadilha) | **Rule** | "isolatedStorage: true causa falha" |
| Procedimento (passos) | **Rule** | Deploy, migrations |
| Estrutura de arquivos | **Graph** | Quais arquivos existem |
| Dependencias/imports | **Graph** | Quem importa quem |
| Impacto de mudanca | **Graph** | O que quebra se mudar X |

**Regra:** instrucao (como fazer) → rule. Informacao estrutural (o que existe, como conecta) → graph.

---

## Principios de Escrita

1. **Conciso** — 1 linha por ponto. Se precisa de paragrafo, esta detalhado demais
2. **Acionavel** — "Usar X" em vez de "X e uma boa pratica". Imperativo
3. **Sem duplicacao** — verificar CLAUDE.md e outras rules antes de adicionar. Referenciar em vez de repetir
4. **Portugues sem acento** — consistencia com o resto das rules
5. **Gotchas com nome** — `**Nome**: Explicacao`
6. **Patterns com codigo** — snippet curto mostrando o uso correto

---

## Fluxo: Criar Nova Rule

1. Identificar o escopo (dominio/area do codigo)
2. Definir `paths:` especificos no frontmatter
3. Criar arquivo em `.claude/rules/{nome}.md`
4. Adicionar secoes `## Conventions`, `## Patterns`, `## Gotchas` conforme necessario
5. Validar checklist abaixo
6. Atualizar tabela de rules existentes nesta skill

## Fluxo: Adicionar Item a Rule Existente

1. Classificar: e convention, pattern ou gotcha?
2. Abrir a rule do dominio correto
3. Adicionar na secao correspondente, seguindo o formato
4. Verificar se nao duplica algo ja existente

---

## Checklist

### Nova Rule
1. [ ] Tem frontmatter com `paths:` especificos?
2. [ ] Titulo com `#` descreve o escopo?
3. [ ] Secoes seguem o formato (Conventions/Patterns/Gotchas)?
4. [ ] Nenhum conteudo duplicado com outra rule ou CLAUDE.md?
5. [ ] Nenhuma info estrutural que deveria estar no graph?
6. [ ] Conteudo conciso (< 60 linhas idealmente)?
7. [ ] Tabela de rules existentes atualizada?

### Adicionar Item
1. [ ] Classificado corretamente (convention/pattern/gotcha)?
2. [ ] Na rule do dominio certo?
3. [ ] Formato correto da secao?
4. [ ] Nao duplica item existente?

---

## Rules Existentes

| Rule | Escopo | paths | Global? |
|------|--------|-------|---------|
| `fork-safety.md` | Regras globais do fork: build, git, rebrand, packages | `**/*` | Sim |
| `style.md` | Style guide TypeScript: nomes, const, early return, Bun APIs | `packages/**/*.ts`, `packages/**/*.tsx` | Nao |
| `ci-cd.md` | CI/CD: release, signing keys, secrets, updater, workflows | `.github/**/*`, `packages/desktop*/**/*`, `script/**/*` | Nao |
