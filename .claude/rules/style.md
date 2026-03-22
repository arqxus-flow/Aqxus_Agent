---
paths:
  - "packages/**/*.ts"
  - "packages/**/*.tsx"
---

# Style Guide — Codigo TypeScript do Orbi

## Conventions

- Usar parallel tools quando aplicavel
- Preferir automacao: executar acoes sem pedir confirmacao, exceto quando bloqueado por info faltando ou seguranca
- Manter coisas em uma funcao so, a nao ser que seja reutilizavel
- Sem `try/catch` desnecessario
- Sem `any` — usar tipos concretos
- Bun APIs quando possivel (`Bun.file()`, `bun:sqlite`, `Bun.serve()`)
- `const` sobre `let` — usar ternarios ou early returns em vez de reassignment
- Sem `else` — preferir early return
- Functional array methods (`map`, `filter`, `flatMap`) sobre `for` loops — usar type guards no filter
- Confiar em type inference — evitar anotacoes explicitas exceto pra exports
- Snake_case em schemas Drizzle pra nomes de coluna
- Sem mocks em testes — testar implementacao real
- SDK: regenerar com `./packages/sdk/js/script/build.ts`

## Patterns

- **Naming enforcement (OBRIGATORIO)**: Nomes curtos por default. Multi-word so quando single-word seria ambiguo. Revisar linhas tocadas e encurtar nomes antes de finalizar
  ```typescript
  // Bom: pid, cfg, err, opts, dir, root, child, state, timeout
  const foo = 1
  function journal(dir: string) {}

  // Ruim: inputPID, existingClient, connectTimeout, workerPath
  const fooBar = 1
  function prepareJournal(dir: string) {}
  ```

- **Destructuring**: Evitar destructuring desnecessario, usar dot notation
  ```typescript
  // Bom
  obj.a
  obj.b
  // Ruim
  const { a, b } = obj
  ```

- **Inline values**: Reduzir variaveis intermediarias quando usadas uma vez
  ```typescript
  // Bom
  const journal = await Bun.file(path.join(dir, "journal.json")).json()
  // Ruim
  const journalPath = path.join(dir, "journal.json")
  const journal = await Bun.file(journalPath).json()
  ```

- **Drizzle schemas**: Snake_case sem redefinir nomes
  ```typescript
  // Bom
  const table = sqliteTable("session", {
    id: text().primaryKey(),
    project_id: text().notNull(),
    created_at: integer().notNull(),
  })
  // Ruim
  const table = sqliteTable("session", {
    id: text("id").primaryKey(),
    projectID: text("project_id").notNull(),
    createdAt: integer("created_at").notNull(),
  })
  ```

## Gotchas

- **Testes do root**: Nunca rodar testes do root do repo — rodar de dentro do package (`cd packages/orbi && bun test`)
- **tsc direto**: Nunca rodar `tsc` direto — usar `bun typecheck` que configura corretamente
- **Branch**: Branch principal e `main` (nao `dev`)
