# Config Layer

Application-wide configuration values.

## Rules

- **`as const` objects**: export configuration as `const` assertions for type narrowing.
- **No runtime logic**: only static values and environment variable reads.
- **One config per concern**: `app.config.ts`, `auth.config.ts`, `logger.config.ts`, `routes.config.ts`, `supabase.config.ts`.
- **Centralize magic values**: all limits, defaults, and thresholds go here.
