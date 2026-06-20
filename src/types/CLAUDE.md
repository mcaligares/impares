# Types Layer

Global types shared across multiple layers.

## Rules

- **Types only, no interfaces**: always use `type`, never `interface`.
- **No layer-specific types**: layer-specific types belong in the layer's own `types.ts`.
- **Enums and shared types**: keep enums and cross-cutting types here.
