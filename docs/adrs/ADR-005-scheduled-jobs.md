# ADR-005: Scheduled Jobs

## Status

Accepted — June 2026

## Context

Several projects need to execute recurring tasks: data synchronization with external sources, periodic email digests, cleanup jobs, report generation, and analytics rollups. In a serverless environment (per ADR-001), there is no persistent worker process — we need an external trigger that invokes our HTTP endpoints on a schedule.

Requirements:

1. Reliable execution on a defined schedule (cron expression).
2. Cost that does not scale linearly with the number of projects.
3. Secure invocation — only the scheduler should be able to trigger production endpoints.
4. Visibility — logs and failure alerts.
5. Reasonable timeout for typical job execution (a few minutes).

This is a scheduling decision, not a workflow orchestration decision. Multi-step workflows with retries and dependencies are out of scope for this ADR.

## Decision Drivers

- **Marginal cost per project** — must be near zero.
- **Operational simplicity** — fewer external services to manage.
- **Integration with the hosting platform** — to keep logs and deploys unified.
- **Reliability** — guaranteed invocation at scheduled times.
- **Secret-based authentication** — to prevent public access to scheduled endpoints.

## Options Considered

### Option A — Vercel Cron Jobs

Built-in scheduled job feature on the Vercel platform.

- **Pricing:** Included in Vercel Pro ($20/month per member — already paid per ADR-001).
- **Limits on Pro:** Up to 100 cron jobs per project, minimum frequency 1 minute, maximum function timeout 5 minutes.
- **Trigger:** Vercel makes an HTTP GET request to the configured path with a `vercel-cron/1.0` user agent and an `x-vercel-cron-schedule` header.
- **Configuration:** Declarative via `vercel.json` (versioned in Git).
- **Logging:** Native in the Vercel dashboard.

### Option B — Upstash QStash

HTTP-based serverless message queue with scheduling capability.

- **Pricing:** Free tier of 500 messages/day (~15K/month). Pay-as-you-go at $1 per 100K messages. Fixed plans from $180/month for high volume.
- **Features:** Cron scheduling, delayed delivery, automatic retries on failure, dead letter queue, deduplication.
- **Schedules included in free tier:** Up to 1,000 active schedules.
- **Endpoint timeout:** 60 seconds maximum.
- **Independence:** Works with any HTTP endpoint — not tied to a specific hosting platform.

### Option C — GitHub Actions (scheduled workflows)

GitHub-native CI/CD with cron-triggered workflows.

- **Pricing:** Free for public repos. For private repos: 2,000 minutes/month free, then $0.008/minute (Linux).
- **Trigger:** `on: schedule` block in workflow YAML.
- **Reliability caveat:** GitHub explicitly states that scheduled workflows may be delayed during high load periods and are not guaranteed to run at the exact scheduled time.
- **Pattern:** Workflow runs `curl` against the production endpoint with a secret header.
- **Logging:** GitHub Actions UI.

### Option D — Dedicated cron services (cron-job.org, EasyCron, Cronhub)

Standalone scheduling services that call HTTP endpoints.

- **cron-job.org:** Free tier covers most personal use cases.
- **EasyCron:** $9.95/month for paid plans.
- **Cronhub:** Free for up to 5 monitors, paid plans from $15/month.
- Generally focused on small teams that need scheduled HTTP calls without coupling to a hosting platform.

## Comparative Analysis

| Criterion | Vercel Cron | Upstash QStash | GitHub Actions | cron-job.org |
|---|---|---|---|---|
| **Marginal cost per project** | $0 | $0 (within 500/day) | $0 (public) or per-minute (private) | $0 (free tier) |
| **Already paid via another ADR** | **Yes** (Vercel Pro) | No | Yes (if on GitHub) | No |
| **Frequency minimum** | 1 minute | 1 second | Variable (delays possible) | 1 minute |
| **Maximum job duration** | 5 min (Pro) | 60 sec endpoint timeout | 6 hours (workflow) | Depends on endpoint |
| **Reliability guarantee** | Best-effort | Strong (retries + DLQ) | **Weak (documented delays)** | Best-effort |
| **Automatic retries on failure** | No | **Yes (configurable)** | Manual | No |
| **Deploys with code** | **Yes (vercel.json)** | Console/API only | Yes (YAML in repo) | Console only |
| **Logs co-located with app** | **Yes** | No (Upstash console) | No (GitHub UI) | No |
| **Lock-in** | Vercel | None (independent) | GitHub | None |

## Decision

**Vercel Cron Jobs** is selected as the primary scheduling mechanism.

Rationale:

1. **Marginal cost is $0.** Vercel Pro is already paid (per ADR-001), and cron jobs are included up to 100 per project. No additional service to provision.
2. **Configuration lives in `vercel.json`**, versioned in Git, deployed with the rest of the code. There is no second console to keep in sync.
3. **Logs appear alongside other Vercel logs** — one place to debug. Adding QStash means logs split across two dashboards.
4. **Same runtime environment as the rest of the app** — same environment variables, same TypeScript types, same deploy pipeline. Cron handlers are just API routes.
5. **GitHub Actions was rejected** primarily because of its documented unreliability for scheduled workflows. Cron jobs that may be delayed are unsuitable for production use.

QStash remains a fallback for two specific cases: (a) jobs that need guaranteed retries on failure (Vercel Cron is fire-and-forget), and (b) jobs that need delivery >5 minutes after the trigger (Vercel Pro's function timeout). These are covered in the revisit triggers below.

## Consequences

### Positive

- Zero additional cost in the standard case.
- Single dashboard for hosting, deploys, and scheduled job logs.
- Declarative configuration in version control.
- Cron handlers benefit from the same security and authentication patterns as regular API routes.

### Negative / Trade-offs

- **No built-in retry on failure.** If a cron-triggered endpoint returns 500, Vercel does not retry. Mitigation: handler-level retry logic for transient operations (e.g., re-queue to QStash on failure), or accept the next run will retry.
- **5-minute function timeout on Pro.** Long jobs (large data syncs, batch processing) must be chunked. Mitigation: design jobs to process in batches with a pointer/cursor.
- **Lock-in to Vercel.** If we migrate hosting, all cron handlers need a new invoker. Mitigation: business logic lives in `src/services/` per the layered architecture, so only `app/api/cron/*.ts` files (thin invokers) need to be rewritten.
- **Cron secret rotation requires redeploy.** The `CRON_SECRET_KEY` env var is read at runtime, so rotating it means redeploying. Mitigation: standard practice; rotate during planned deploys.

### Revisit Triggers

- A job consistently exceeds 5-minute timeout → move that specific job to QStash (60-second endpoint, but with chunking pattern) or to a dedicated worker.
- A job requires guaranteed retries with backoff → migrate that specific job to QStash with its built-in retry logic.
- We migrate away from Vercel hosting → rewrite cron invokers (business logic in services is untouched).
- A project needs sub-minute frequency → adopt QStash (supports 1-second granularity) or design around it.

## References

- Vercel Cron Jobs Documentation — https://vercel.com/docs/cron-jobs
- Vercel Cron Setup Guide — https://vercel.com/kb/guide/how-to-setup-cron-jobs-on-vercel
- Upstash QStash Pricing — https://upstash.com/pricing/qstash
- Upstash QStash Documentation — https://upstash.com/docs/qstash
- GitHub Actions Scheduled Workflows — https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule
- cron-job.org — https://cron-job.org/
- "QStash vs Inngest vs AWS SQS 2026" — https://apiscout.dev/guides/upstash-qstash-vs-inngest-vs-aws-sqs-2026
- "Best QStash Alternatives (2026): Serverless Message Queue" — https://www.buildmvpfast.com/alternatives/qstash
- "Upstash QStash: Serverless Background Jobs Without the Infrastructure Pain" — https://dev.to/whoffagents/upstash-qstash-serverless-background-jobs-without-the-infrastructure-pain-ic8
- "Cron Alternatives for Reliable Scheduling" — https://posthook.io/compare/cron-vs-durable-scheduling
