# ADR-001: Hosting Platform

## Status

Accepted — June 2026

## Context

The startup operates a multi-site portfolio: marketing landings, MVPs, internal dashboards, and small SaaS products. Traffic is expected to be low and variable on most sites, with occasional viral spikes. The primary tech stack is Next.js. We need a hosting platform that:

1. Allows starting at $0 for non-commercial / pre-launch projects.
2. Scales cost with **usage**, not with **number of projects**.
3. Provides automatic Git-based deploys and preview environments.
4. Includes infrastructure primitives (cron, edge functions, CDN) without requiring additional vendors.
5. Has low operational overhead (no manual SSL, no manual CDN, no infra to patch).

Cost predictability and avoiding per-project flat fees are the dominant decision drivers.

## Decision Drivers

- **Per-project marginal cost** — must be near zero to support a multi-site portfolio.
- **Free tier viability** — must allow non-commercial projects at $0.
- **Next.js native support** — the primary framework of the stack.
- **Built-in cron jobs** — to avoid adding a separate scheduler service.
- **Bandwidth pricing predictability** — to prevent surprise bills on traffic spikes.
- **Lock-in risk** — preference for platforms that don't require proprietary APIs.

## Options Considered

### Option A — Vercel

Vercel was founded by the creator of Next.js and offers the deepest framework integration.

- **Hobby:** $0, non-commercial only, 100 GB bandwidth, 1M function invocations.
- **Pro:** $20/month per member, commercial use allowed, cron jobs enabled, Fluid Compute.
- Charges **per team member**, not per project.
- Native ISR, Image Optimization, Middleware, Server Actions.

In February 2026, Vercel shipped Fluid Compute with reported savings of up to 95% across function execution costs.

### Option B — Cloudflare Pages / Workers

Cloudflare's hosting platform runs on the same global edge network as their CDN.

- **Free tier:** unlimited bandwidth, 500 builds/month, Workers free tier (100K req/day).
- **Workers Paid:** $5/month base, includes 10M requests, $0.30 per additional million.
- Cold starts under 5 ms (V8 isolates instead of containers).
- 330+ edge locations vs. Vercel's ~40.
- Next.js SSR support exists but requires the OpenNext adapter and has rougher edges than Vercel for App Router features.

### Option C — Netlify

The platform that coined "Jamstack." Strong framework-agnostic ecosystem.

- **Free tier:** 100 GB bandwidth, 300 build minutes, 125K function invocations.
- **Pro:** $19/month per member, credit-based billing (since September 2025).
- Next.js support via the `@netlify/next` adapter — works but lags behind Vercel for cutting-edge features.
- Function overage at high traffic can exceed Vercel (~$119/month vs. ~$30/month in published 500K-visit benchmarks).

### Option D — Railway / Render (containerized)

Traditional container hosting with auto-deploy.

- **Railway:** $5/month base, then usage-based on compute/RAM.
- **Render:** $7/month per web service minimum.
- Both run continuously (no scale-to-zero on minimum plans), so you pay even with no traffic.
- Better for apps that need persistent processes (not the case here).

## Comparative Analysis

| Criterion | Vercel | Cloudflare Pages | Netlify | Railway/Render |
|---|---|---|---|---|
| **Entry cost** | $0 (Hobby) | $0 (very generous) | $0 | $5–7/mo minimum |
| **Commercial entry cost** | $20/mo/member | $5/mo (Workers Paid) | $19/mo/member | $5–7/mo per service |
| **Cost model** | Per member | Per usage | Per member + credits | Per service |
| **Scales with N projects?** | No (flat) | No (flat) | No (flat) | **Yes (each costs)** |
| **Next.js native support** | Excellent | Good (via adapter) | Good | N/A (runs anything) |
| **Cron jobs included** | Yes (Pro) | Yes (Workers) | No (add-on) | Manual |
| **Edge network** | ~40 PoPs | 330+ PoPs | 8 regions | Single region default |
| **Bandwidth in free tier** | 100 GB | Unlimited (static) | 100 GB | Limited |
| **Cold start** | ~50–200 ms | <5 ms | 200–500 ms | None (always on) |
| **Lock-in risk** | Medium | Medium | Low | Low |

## Decision

**Vercel** is selected as the hosting platform.

Rationale:

1. **Per-member pricing scales correctly with our model.** A single developer running 10 sites pays $20/month total, not $200. This is the strongest cost advantage in a multi-site portfolio.
2. **Next.js is the chosen framework.** Vercel's native integration eliminates configuration friction that Cloudflare Pages and Netlify still require for App Router features.
3. **Cron jobs are built in** at no additional cost on the Pro plan, eliminating the need for an external scheduler (see ADR-005).
4. **Free Hobby tier covers experimentation.** Non-commercial projects stay at $0 until they need to go live.

Cloudflare Pages was a close second and remains the right choice if a future project is bandwidth-heavy (e.g., large media files served directly).

## Consequences

### Positive

- Flat hosting cost regardless of how many sites we launch.
- Zero time spent on SSL, CDN setup, or deploy infrastructure.
- Preview deployments per Git branch are automatic.
- Cron jobs and edge functions available without additional services.

### Negative / Trade-offs

- **Bandwidth caps on Pro:** 1 TB/month included; overages at ~$40 per 100 GB. Mitigation: heavy assets stored in Cloudflare R2 (see ADR-003), served via Cloudflare CDN, never touching Vercel's bandwidth.
- **Per-member cost grows linearly with team size.** 5 developers = $100/month. Acceptable for the foreseeable horizon.
- **Some lock-in via Vercel-specific features** (Image Optimization, Fluid Compute, ISR). Mitigation: prefer Next.js-standard APIs and treat Vercel-specific features as performance optimizations, not architectural dependencies.

### Revisit Triggers

- Team size grows beyond 10 developers (Vercel cost may exceed self-host break-even).
- Any single project consistently exceeds 1 TB/month bandwidth after R2 offload.
- A project requires long-running compute (>5 min function timeout) — move that workload to Railway or a dedicated worker.

## References

- Vercel Pricing — https://vercel.com/pricing
- Vercel Cron Jobs documentation — https://vercel.com/docs/cron-jobs
- Cloudflare Pages Pricing — https://pages.cloudflare.com/
- Cloudflare Workers Pricing — https://developers.cloudflare.com/workers/platform/pricing/
- Netlify Pricing — https://www.netlify.com/pricing/
- "Vercel vs Netlify vs Cloudflare Pages 2026 — Deep Comparison with Real Numbers" — https://dev.to/lazydev_oh/vercel-vs-netlify-vs-cloudflare-pages-2026-deep-comparison-with-real-numbers-8pl
- "Vercel vs Netlify vs Cloudflare Pages: Pricing Comparison 2026" — https://www.devtoolreviews.com/reviews/vercel-vs-netlify-vs-cloudflare-pages-pricing-comparison-2026
- "Vercel vs Cloudflare Pages vs Netlify: Hosting Platforms" — https://pristren.com/blog/vercel-vs-cloudflare-pages-vs-netlify/
