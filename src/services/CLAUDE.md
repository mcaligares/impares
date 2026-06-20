# Service Layer

The service layer contains all **business logic**, calculations, and orchestration.

## Rules

- **Standalone functions**: export individual async functions. Do not use factory functions or objects with methods.
- **Use transformers**: never use inline `.map()` to build response objects or lists. Use transformer functions to convert entities into the desired shape.
- **Debug logging**: create a scoped logger at file level with `const log = logger.service('name')`. Log at key steps using `log('method', message, data)`. Use `log.error()` for errors.
- **No direct DB access**: always go through repository functions.
- **No HTTP/form concerns**: receive typed inputs, return typed outputs. No FormData, no response formatting.
- **No try-catch**: do not use try-catch blocks. Let errors propagate naturally to the actions layer.
- **Authorization**: verify ownership/role before any mutation or sensitive read. Throw `UnauthorizedError` if not allowed.