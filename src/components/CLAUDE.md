# Components Layer

React functional components organized by scope.

## Rules

- **Named exports only**: no default exports.
- **Client directive**: add `'use client'` when using hooks, event handlers, or browser APIs.
- **Atomic components (`ui/`)**: only accept primitive type params (string, number, boolean, etc.). No entity types.
- **Feature components**: organized by domain (`expenses/`, `payments/`, `groups/`, etc.). Can use entity types as props.
- **No direct action calls**: components do not call server actions directly. They receive callbacks or data as props. The `page.client.tsx` orchestrator handles action calls.
- **Styling**: Tailwind CSS classes inline.
