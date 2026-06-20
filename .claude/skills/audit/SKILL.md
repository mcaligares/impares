---
name: audit
description: Audit the codebase against the conventions defined in the per-layer CLAUDE.md files. Detect architecture, naming, pattern, and rule violations.
argument-hint: [layer-or-file]
allowed-tools: Read, Grep, Glob, Agent
---

# Convention Audit

Audit the codebase against project conventions.

## Instructions

1. **Read every CLAUDE.md** in the project (root + each subfolder of `src/` + `tests/`). These define the per-layer rules.

2. **Audit each layer** for violations. Use parallel subagents for independent layers.

3. **Per-layer checklist:**

### Entities (`src/entities/`)
- [ ] Uses `type`, never `interface`
- [ ] One file per entity, named `{name}.entity.ts`
- [ ] Re-uses Drizzle schema with `InferSelectModel<typeof table>` where applicable
- [ ] Field names match DB columns (snake_case)

### Config (`src/config/`)
- [ ] Only `as const` objects, no functions
- [ ] No runtime logic
- [ ] One config per concern

### Repositories (`src/repositories/`)
- [ ] Standalone exported functions (no factory pattern)
- [ ] Try-catch in every function
- [ ] Verbose logging with `performance.now()` timing
- [ ] Zero-or-one queries use `.limit(1)` + `[0] ?? null`
- [ ] No business logic
- [ ] No authorization checks

### Services (`src/services/`)
- [ ] Standalone exported functions
- [ ] Uses transformers, not inline `.map()` for response objects
- [ ] Scoped logger with `logger.service('name')`
- [ ] No direct DB access (always through repositories)
- [ ] No FormData or HTTP concerns
- [ ] No try-catch (errors propagate to actions)
- [ ] Authorization checks live here — verify ownership/role before mutations or sensitive reads; throw `UnauthorizedError`

### Actions (`src/actions/`)
- [ ] `'use server'` directive
- [ ] Critical-field validation only
- [ ] Try-catch mandatory
- [ ] No authentication checks (middleware does it)
- [ ] Reads actor identity via `getCurrentUser()` and passes it to the service
- [ ] Maps `UnauthorizedError` from the service to a typed response
- [ ] Scoped logger with `logger.action('name')`

### Components (`src/components/`)
- [ ] Named exports (no default exports)
- [ ] `'use client'` when using hooks or events
- [ ] Atomic (`ui/`): only primitive props
- [ ] Feature components: receive actions as props, don't import them directly

### Pages (`src/app/`)
- [ ] Orchestrator pattern: `page.tsx` (server) + `page.client.tsx` (client)
- [ ] `page.tsx` only fetches; `page.client.tsx` handles interaction

### Lib (`src/lib/`)
- [ ] Pure functions in `utils/`
- [ ] Validators reference `appConfig` for limits

### Global
- [ ] `type` never `interface` anywhere in the project

4. **Report** violations as a table:

| File | Line | Rule violated | Detail |
|------|------|---------------|--------|

5. **If an argument is provided** (`$ARGUMENTS`), audit only that layer or file.

6. **At the end**, ask whether to apply fixes automatically.

Target: $ARGUMENTS
