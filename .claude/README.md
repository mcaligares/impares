# Claude Code — Skills, Subagents, and Hooks

## Structure

```
.claude/
├── settings.json                # Hooks and configuration
├── skills/                      # Invocable /slash commands
│   ├── audit/SKILL.md           # /audit — convention audit
│   ├── new-feature/SKILL.md     # /new-feature — entity scaffolding
│   └── test-coverage/SKILL.md   # /test-coverage — coverage analysis
├── agents/                      # Specialized subagents
│   ├── convention-checker.md    # Convention verifier
│   └── test-runner.md           # Test runner
└── hooks/                       # Hook scripts
```

## Skills

| Command | Description | Example |
|---------|-------------|---------|
| `/audit` | Audits code against the layer CLAUDE.md files | `/audit services` |
| `/new-feature` | Full scaffolding for a new entity | `/new-feature category` |
| `/test-coverage` | Detects and generates missing tests | `/test-coverage` |

## Subagents

| Agent | When to use | What it does |
|-------|-------------|--------------|
| `convention-checker` | Before/after editing code | Validates CLAUDE.md rules |
| `test-runner` | After writing code | Runs `vitest` + `tsc`, analyzes errors |

## Hooks

| Event | Action |
|-------|--------|
| `Stop` | macOS notification on task completion |

## How they fit together

```
/new-feature → SKILL expands instructions
  │
  ├─→ Claude generates schema → entity → repo → service → action → tests
  ├─→ convention-checker (validates each layer)
  └─→ test-runner (vitest + tsc)
```

- **Skills** = interface (what you want to do)
- **Subagents** = internal machinery (how it gets done)
- **Hooks** = deterministic automation (always runs)
