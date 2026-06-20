# Tests Layer

Unit tests for services and actions layers using Vitest.

## Rules

- **Vitest with globals**: `describe`, `it`, `expect`, `vi` available globally.
- **Mock repositories**: use `vi.mock('@/repositories/...')` — never access a real database.
- **Mock Next.js**: actions tests mock `@/lib/auth`, `next/cache`, `next/navigation`.
- **Use factories**: create entities via factory functions, not inline objects. Factories live in `tests/factories/`.
- **Descriptive factory names**: `createUserWithName('Alice')`, `createExpensePaidBy(alice, 100)`, not `createUser({ name: 'Alice' })`.
- **One describe per function**: group tests by the service/action function being tested.
- **Types not interfaces**: follows global project rule.
- **Reset mocks**: use `beforeEach(() => vi.clearAllMocks())` in every test file.
