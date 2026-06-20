# Actions Layer

Actions are the **boundary between client and server**. Every exported function must use the `'use server'` directive.

## Rules

- **Critical-field validation only**: full Zod validation happens on the client side. Actions only validate fields that are critical and would cause a server error (e.g., missing IDs).
- **Try-catch mandatory**: wrap service calls in try-catch.
- **Error response pattern**: return a response object containing the error and a user-facing message.
- **No auth checks**: actions must never verify authentication — that responsibility belongs to the middleware. Assume the request is already authenticated by the time it reaches the action.
- **Info logging**: create a scoped logger at file level with `const log = logger.action('name')`. Log start, success using `log('method', message, data)` and failure using `log.error('method', message, data)`.
