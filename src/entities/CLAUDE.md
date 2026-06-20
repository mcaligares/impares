# Entities Layer

Entities define the shape of data. Each entity owns its DB schema (Drizzle `pgTable`) and its inferred TypeScript type.

## Rules

- **One folder per entity**: `src/entities/{name}/`.
- **Two files per entity**:
  - `{name}.schema.ts`: the Drizzle `pgTable` definition. Uses the shared `timestamps` helper from `@/lib/db/timestamps`.
  - `{name}.entity.ts`: `export type {Name} = InferSelectModel<typeof {name}>;` — imports the table from `./{name}.schema`.
- **Type, never `interface`** — follows the global rule.
- **Mirror DB schema**: column names are `snake_case`.
- **Foreign keys across entities**: import the target schema from the sibling entity folder (`@/entities/{other}/{other}.schema`).
- **Schemas of infra modules** (e.g., Better Auth session/account/verification) do **not** live here — they live with the owning module (`src/lib/auth/auth.schema.ts`).
- **Related types** (enums, aliases): co-locate next to the entity file in the same folder.
