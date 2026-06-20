# Lib Layer

Shared utilities, infrastructure, and validation schemas.

## Rules

- **Subfolders by concern**: `auth/`, `db/`, `errors/`, `logger/`, `storage/`, `validators/`.
- **Pure functions in `utils/`**: no side effects, well-typed, single responsibility.
- **Validators (Zod schemas)**: used on the client side for form validation. Export both the schema and the inferred type.
- **Config references**: validators should reference `appConfig` for limits and thresholds.
