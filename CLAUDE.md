@AGENTS.md

# Global Rules

- **Types, not interfaces**: never use `interface`, always use `type`. Use intersection (`&`) for inheritance.
- **Standalone functions**: use exported async functions, not factory functions returning objects.
- **Layer conventions**: each layer under `src/` has its own CLAUDE.md with coding conventions. Read the relevant CLAUDE.md before writing code in that layer.
- **No `index.ts` with definitions**: `index.ts` is only allowed as a barrel re-exporting from other files in the same folder. It must contain only `export` statements — no functions, classes, types, or constants defined inside.
