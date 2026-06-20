---
name: new-feature
description: Scaffold a new entity/feature following project conventions. Creates schema, entity, repository, service, action, validator, pages, components, factory, and tests.
argument-hint: <entity-name>
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent
---

# New Feature Scaffolding

Generate all files required for the entity `$ARGUMENTS` following project conventions.

## Instructions

### Step 0: Validate argument
If no entity name was provided, ask before continuing.

### Step 1: Read conventions
Before generating code, read:
- Root `CLAUDE.md` — global rules
- `src/entities/CLAUDE.md`
- `src/repositories/CLAUDE.md`
- `src/services/CLAUDE.md`
- `src/actions/CLAUDE.md`
- `src/lib/CLAUDE.md`
- `src/components/CLAUDE.md`
- `src/app/CLAUDE.md`
- `tests/CLAUDE.md`

Also read an existing storage feature as a reference for the pattern:
- `src/entities/storage/storage.schema.ts`
- `src/entities/storage/storage.entity.ts`
- `src/repositories/storage.repository.ts`
- `src/services/storage.service.ts`
- `src/actions/storage.actions.ts`
- `tests/factories/storage.factory.ts`
- `tests/services/storage.service.test.ts`

### Step 2: Ask the user
Before generating, ask:
1. Fields of the entity (name, type, nullable).
2. Whether it needs its own page or only fits inside an existing one.
3. Relations to existing entities.
4. Whether the route needs dynamic helpers in `src/lib/utils/routes.ts`.

### Step 3: Generate files
Create in order:

1. **Entity folder**: `src/entities/$0/`
   - `$0.schema.ts`: Drizzle `pgTable`, snake_case columns, `timestamps` helper. Foreign keys to other entities import from `@/entities/{other}/{other}.schema`.
   - `$0.entity.ts`: `export type {Name} = InferSelectModel<typeof $0>;` importing the table from `./$0.schema`.
3. **Repository**: `src/repositories/$0.repository.ts`
   - Standalone functions: `insert`, `findById`, `findAll`, `update`, `delete`.
   - Try-catch, verbose logging with `performance.now()`. Zero-or-one queries use `.limit(1)` + `[0] ?? null`.
4. **Validator**: `src/lib/validators/$0.schema.ts`
   - Zod schema referencing `appConfig` for limits. Export schema + inferred type.
5. **Service**: `src/services/$0.service.ts`
   - Standalone async functions. Uses repository functions. Uses transformers if mapping data.
   - **Add the ownership check only when the feature requires it.** Do not add it by default.
6. **Action**: `src/actions/$0.actions.ts`
   - `'use server'`. Reads actor identity via `getCurrentUser()` from `@/lib/auth/get-current-user`.
   - Try-catch around the service call. Map `UnauthorizedError` to a typed response.
7. **Routes** (when applicable):
   - Add a constant in `src/config/routes.config.ts`.
   - Add a dynamic helper in `src/lib/utils/routes.ts`.
8. **Pages** (when applicable):
   - `src/app/(main)/.../$0/page.tsx` — server component
   - `src/app/(main)/.../$0/page.client.tsx` — client orchestrator
9. **Components** (when applicable):
   - `src/components/$0s/` — feature components. Receive actions as props.
10. **Factory**: `tests/factories/$0.factory.ts`
    - Descriptive factory names (`create$EntityForOwner(...)`, `create$EntityWith(...)`) — no inline overrides.
11. **Tests**:
    - `tests/services/$0.service.test.ts`
    - `tests/actions/$0.actions.test.ts`

### Step 4: Generate the migration
Run:
```bash
pnpm db:generate
```

### Step 5: Verify
```bash
pnpm tsc --noEmit
pnpm test
```

### Step 6: Summary
Show the list of files created with their paths and the path of the generated SQL migration.
