---
name: test-coverage
description: Analyze test coverage of the project, find untested functions in services and actions, and generate the missing tests using existing factories.
argument-hint: [layer-or-file]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent
---

# Test Coverage Analysis

Analyze test coverage and generate the missing tests.

## Instructions

### Step 1: Inventory exported functions
Find all exported functions in:
- `src/services/*.ts` — every `export async function`
- `src/actions/*.ts` — every `export async function`

If an argument was provided (`$ARGUMENTS`), narrow the analysis to that layer or file.

### Step 2: Inventory existing tests
Find every `describe` and `it` in:
- `tests/services/*.test.ts`
- `tests/actions/*.test.ts`

### Step 3: Cross-reference
Generate a coverage table:

| Function | File | Tests | Status |
|----------|------|-------|--------|
| `createExpense` | `expense.service.ts` | 2 | Covered |
| `newFunction` | `expense.service.ts` | 0 | Missing |

### Step 4: Generate missing tests
For each untested function:

1. Read the function implementation.
2. Read the factories under `tests/factories/`.
3. Read `tests/CLAUDE.md` for conventions.
4. Generate tests that:
   - Use factories with descriptive names (no inline objects).
   - Mock repositories with `vi.mock()`.
   - Cover: happy path, errors, edge cases, authorization (when applicable).
   - Follow the patterns of existing tests in the same area.

### Step 5: Verify
```bash
pnpm test
pnpm tsc --noEmit
```

### Step 6: Final report
Show:
- Total functions vs. tested (before and after).
- New tests generated.
- Functions still untested (with justification if applicable).
