# Pages Layer

Each page follows the **orchestrator pattern** with a `page.client.tsx` companion.

## Rules

- **`page.tsx`**: server component. Fetches initial data and renders `page.client.tsx`.
- **`page.client.tsx`**: client component (`'use client'`). Acts as the orchestrator — imports and composes feature components, calls server actions, and manages page-level state.
- **Separation**: data fetching lives in `page.tsx`, interaction logic lives in `page.client.tsx`.
