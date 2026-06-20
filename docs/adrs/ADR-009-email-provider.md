# ADR-009: Transactional Email Provider

## Status

Accepted — June 2026

## Context

Per ADR-004, Better Auth handles authentication and requires sending transactional emails: magic-link sign-in, email verification, password reset. Future features (notifications, digests) may also need outbound email. We need a provider that:

1. Has a viable free tier for early-stage projects.
2. Offers a TypeScript SDK with a clean API.
3. Integrates with React-based email templates (the rest of the stack is React).
4. Has predictable pricing past the free tier.
5. Does not require maintaining our own SMTP infrastructure.

## Decision Drivers

- **Free tier sufficient for development and early production.**
- **TypeScript SDK quality** — first-class types, modern API.
- **React email template support** — to share components and styles with the app.
- **Deliverability** — established sender reputation.
- **Pricing predictability** — no per-team-member fees, no surprise overages.

## Options Considered

### Option A — Resend

Email API built on AWS SES, designed for developers, launched 2023.

- **Free tier:** 3,000 emails/month, 100/day.
- **Paid:** $20/month for 50K emails; usage-based above that.
- **SDK:** first-class TypeScript SDK (`resend` npm package).
- **React Email:** native — Resend ships `react-email` and renders React components to HTML at send time.
- **Deliverability:** rides on SES; production-grade DKIM/SPF setup is built in.

### Option B — Postmark

Long-standing transactional email service focused on deliverability.

- **Free tier:** 100 emails/month (very small).
- **Paid:** $15/month for 10K emails.
- **SDK:** TypeScript SDK exists but is less ergonomic than Resend's.
- **React templates:** not native; community workarounds.
- **Deliverability:** widely considered best-in-class.

### Option C — SendGrid

Twilio-owned, the most widely deployed transactional email service.

- **Free tier:** 100 emails/day forever.
- **Paid:** $19.95/month for 50K emails.
- **SDK:** Node SDK exists; types are not first-class.
- **React templates:** not native.
- **Deliverability:** strong, with occasional shared-IP reputation issues at the free tier.

### Option D — AWS SES (direct)

Raw access to AWS Simple Email Service.

- **Free tier:** 3,000 emails/month if sent from a Lambda/EC2 (none from outside AWS).
- **Paid:** $0.10 per 1,000 emails — cheapest of the four.
- **SDK:** AWS SDK — verbose, low-level.
- **React templates:** not native.
- **Deliverability:** depends on per-account reputation; sandbox limits until graduated.
- **Operational overhead:** DKIM/SPF/DMARC configured manually.

## Comparative Analysis

| Criterion | Resend | Postmark | SendGrid | AWS SES |
|---|---|---|---|---|
| **Free tier (monthly)** | 3,000 | 100 | ~3,000 (100/day) | 3,000 |
| **First paid tier** | $20/mo (50K) | $15/mo (10K) | $19.95/mo (50K) | ~$5/mo (50K) |
| **TypeScript SDK quality** | **Excellent** | Good | Adequate | Verbose AWS SDK |
| **React Email native** | **Yes** | No | No | No |
| **Setup time** | **Minutes** | Minutes | Minutes | Hours (DKIM, sandbox graduation) |
| **Deliverability** | Strong (SES-backed) | **Best-in-class** | Strong | Depends on reputation work |
| **Operational overhead** | Low | Low | Low | **High** |

## Decision

**Resend** is selected.

Rationale:

1. **React Email integration is native.** Templates live in `src/emails/*.tsx` as React components — same JSX, same component primitives, same Tailwind classes (via inline styles) as the rest of the app. Postmark and SendGrid require a separate templating runtime.
2. **TypeScript SDK is the cleanest of the four.** Sending an email is a single typed call with a typed response; errors surface as discriminated unions. Aligns with the rest of the stack.
3. **Free tier covers all pre-launch projects.** 3,000 emails/month per Resend account is enough for development and small live projects. AWS SES matches the number but requires manual graduation from the sandbox.
4. **First paid tier is competitive.** $20/month for 50K emails is the same ballpark as SendGrid and cheaper per email than Postmark.
5. **Operational overhead is low.** Resend handles DKIM/SPF setup via a guided flow; SES would require manual DNS and reputation work for the same outcome.

Postmark was the runner-up on deliverability alone. If a specific project depends on critical mass-mail deliverability (account recovery for a high-value SaaS), Postmark is the right escalation.

## Consequences

### Positive

- Email templates colocate with the app code as React components.
- One TypeScript dependency, one API key, one dashboard.
- Pricing scales linearly with volume; no per-member or per-project fee.
- Better Auth integrates via a single `sendEmail` callback that calls `resend.emails.send(...)`.

### Negative / Trade-offs

- **Free tier shared across the account.** A single noisy project can consume the 3,000/month quota for all others. Mitigation: monitor usage; upgrade when cumulative traffic justifies it.
- **Deliverability is good, not best-in-class.** For transactional auth flows (magic links, password resets), this is acceptable. For mass-marketing volume, it would not be.
- **Vendor SDK in the dependency tree.** Mitigation: the wrapper in `src/lib/auth/email.ts` keeps the API surface narrow, so swapping providers is a one-file change.

### Revisit Triggers

- A specific project requires guaranteed deliverability for account recovery → adopt Postmark for that project only.
- Monthly email volume across the portfolio consistently exceeds 50K → re-evaluate against SES Direct (lower per-email cost) or higher Resend tiers.
- Resend's free tier is reduced or removed → re-evaluate options.

## References

- Resend — https://resend.com/
- Resend Pricing — https://resend.com/pricing
- React Email — https://react.email/
- Better Auth Email Configuration — https://www.better-auth.com/docs/concepts/email
- Postmark — https://postmarkapp.com/
- SendGrid — https://sendgrid.com/
- AWS SES Pricing — https://aws.amazon.com/ses/pricing/
