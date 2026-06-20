# Repository Layer

The repository layer is strictly a **SQL resolver**. It receives parameters, executes a query through the Drizzle client, and returns the result. No business logic, no data transformation, no validation.

## Rules

- **Standalone functions**: export individual async functions (e.g., `export async function findUserById(db: DbClient, id: string)`). Do not use factory functions or objects with methods.
- **Try-catch mandatory**: every function must wrap all operations in a try-catch block and re-throw exceptions.
- **Verbose logging**: create a scoped logger at file level with `const log = logger.repo('name')`. Every function must log entry and completion (with `performance.now()` timing) using `log('method', message, data)`.
- **Zero-or-one results**: for queries that may return zero or one row, use `.limit(1)` and return `result[0] ?? null`. Never branch on error codes.
- **No business logic**: do not compute, filter, transform, or validate data. That belongs in the service layer.
