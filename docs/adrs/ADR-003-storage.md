# ADR-003: Object Storage

## Status

Accepted — June 2026

## Context

Projects in the portfolio handle user-uploaded files (profile pictures, attachments, documents) and serve public assets that exceed what Git-based hosting can practically store. The dominant cost factor in cloud storage is rarely the storage itself — it is **egress** (data transferred out of the provider).

Traditional providers (AWS S3, GCS, Azure) charge $0.09–$0.12 per GB of egress. A single site that goes viral can generate hundreds of dollars in unexpected bandwidth fees. We need an object storage service that:

1. Provides a free tier sufficient for early projects.
2. Has **predictable** pricing — no surprise bills when traffic spikes.
3. Is S3-compatible to preserve portability.
4. Shares its free tier across projects (single account, multiple buckets).
5. Integrates with our CDN strategy without additional egress costs.

## Decision Drivers

- **Egress cost predictability** — single most important factor.
- **Free tier size** — must cover early-stage portfolio.
- **S3-compatible API** — to avoid SDK lock-in.
- **Account-level pooling** — free tier shared across projects, not per project.
- **No minimum retention penalties** — for short-lived uploads (drafts, temp files).

## Options Considered

### Option A — Cloudflare R2

R2 is Cloudflare's object storage, designed to eliminate egress fees.

- **Storage:** $0.015/GB/month.
- **Egress:** $0 (unlimited, no fair-use cap, no tier-based throttling).
- **Operations:** Class A (writes) $4.50/M, Class B (reads) $0.36/M.
- **Free tier:** 10 GB storage, 1M Class A operations, 10M Class B operations, $0 egress — no time limit, renews monthly.
- **S3-compatible API.**
- Native integration with Cloudflare CDN (Workers, Pages).

### Option B — AWS S3

The industry-standard object storage; the most mature ecosystem.

- **Storage:** $0.023/GB/month (Standard).
- **Egress:** $0.09/GB after the first 100 GB/month (free tier only for first 12 months).
- **Operations:** PUT $5.00/M, GET $0.40/M.
- **Free tier:** 5 GB, 20K GET, 2K PUT — **expires after 12 months**, then full pricing applies.
- Deepest integration with the AWS ecosystem (Lambda, CloudFront, EventBridge).

### Option C — Backblaze B2

Independent storage provider focused on low cost.

- **Storage:** $0.006/GB/month (the cheapest of the three).
- **Egress:** $0.01/GB after free allowance of 3× monthly average storage.
- **Free egress** via Cloudflare Bandwidth Alliance (when served through Cloudflare CDN).
- **Free tier:** 10 GB storage, free egress up to 3× stored volume.
- **S3-compatible API.**
- Requires pairing with Cloudflare CDN for the best egress economics.

### Option D — Wasabi

Hot storage with no egress fees but with caveats.

- **Storage:** $6.99/month (1 TB minimum, ~$0.007/GB).
- **Egress:** $0 (subject to a fair-use policy: monthly egress cannot exceed stored volume).
- **Minimum 90-day retention** — deleting data before then still bills for 90 days.
- **No free tier** — minimum $6.99/month even if you store 1 GB.
- **S3-compatible API.**

## Comparative Analysis

| Criterion | Cloudflare R2 | AWS S3 | Backblaze B2 | Wasabi |
|---|---|---|---|---|
| **Storage cost** | $0.015/GB/mo | $0.023/GB/mo | **$0.006/GB/mo** | $0.007/GB/mo (1 TB min) |
| **Egress cost** | **$0** (unlimited) | $0.09/GB after 100 GB free | $0.01/GB (or $0 via Cloudflare) | $0 (fair-use capped) |
| **Free tier** | 10 GB forever | 5 GB for 12 months only | 10 GB | None ($6.99 min) |
| **Min. retention** | None | None | None | 90 days |
| **S3-compatible** | Yes | Native | Yes | Yes |
| **Operations cost (1M reads)** | $0.36 | $0.40 | Free (no per-op fees) | Free (no per-op fees) |
| **CDN integration** | Native (Cloudflare) | CloudFront (paid) | Cloudflare (free egress) | Cloudflare (paid) |
| **Egress surprise risk** | **None** | High | Low (via Cloudflare) | Medium (fair-use) |

## Decision

**Cloudflare R2** is selected as the object storage provider.

Rationale:

1. **Zero egress, with no caveats.** R2 is the only major provider with genuinely unlimited free egress — no fair-use policy (Wasabi), no partner requirement (Backblaze + Cloudflare), no time limit (AWS S3 free tier expires). This is the single most important factor in keeping bills predictable.
2. **10 GB free tier renews monthly forever**, shared across the entire account. The whole portfolio gets storage at $0 until cumulative usage exceeds 10 GB.
3. **S3-compatible API** means the AWS SDK works out of the box. If we ever need to migrate (to S3 or B2), the application code does not change — only credentials.
4. **Higher storage cost than B2 or Wasabi is justified by zero egress.** For media-heavy workloads where files are read many times, the math favors R2 dramatically. For purely cold archival (rarely read), B2 would be cheaper — but that is not our use case.

Backblaze B2 was the runner-up. It would be the better choice for write-once-read-rarely archival workloads, but our typical workload is user-uploaded files served back repeatedly.

## Consequences

### Positive

- Bandwidth bills are completely predictable. A viral spike does not generate a surprise.
- Free tier accommodates all early-stage projects in a single shared pool.
- AWS SDK compatibility means no special SDK to learn or maintain.
- Cloudflare CDN integration is native if we add Cloudflare in front of any site.

### Negative / Trade-offs

- **Operation costs can be the dominant line item** for write-heavy or read-heavy applications at scale: $4.50 per million Class A operations, $0.36 per million Class B. Mitigation: batch small writes, cache reads at the edge.
- **No built-in image transformations.** Services like Supabase Storage offer on-the-fly resize/crop. R2 does not. Mitigation: use `next/image` from Vercel for simple transforms, or pay for Cloudflare Images ($5/month per 100K transforms) if needed.
- **R2 lifecycle policies (auto-tiering, expiration) are less mature than S3's.** Mitigation: most projects don't need complex lifecycle policies.
- **Operational learning curve** — we need a wrapper in `src/lib/r2/` to encapsulate the S3 SDK configuration. One-time cost.

### Revisit Triggers

- Cumulative storage exceeds 1 TB → evaluate Backblaze B2 + Cloudflare CDN combination for the same egress economics at lower storage cost.
- Operation costs become a dominant line item → optimize batching or move that workload to a provider with no per-operation pricing (Wasabi, B2).
- A specific project needs advanced lifecycle (Glacier-tier archival) → use AWS S3 for that workload only.

## References

- Cloudflare R2 Pricing — https://developers.cloudflare.com/r2/pricing/
- Cloudflare R2 Product Page — https://www.cloudflare.com/products/r2/
- AWS S3 Pricing — https://aws.amazon.com/s3/pricing/
- Backblaze B2 Pricing — https://www.backblaze.com/cloud-storage/pricing
- Wasabi Pricing — https://wasabi.com/pricing
- "Cloudflare R2 vs AWS S3 vs Backblaze B2 for Indie Hackers in 2026" — https://devtoolpicks.com/blog/cloudflare-r2-vs-aws-s3-vs-backblaze-b2-indie-hackers-2026
- "Object Storage Comparison 2026: 21 S3 Providers Compared" — https://mixpeek.com/blog/object-storage-comparison-2026
- "Cheapest Cloud Storage 1TB-2TB 2026: 8 Compared" — https://leanopstech.com/blog/cheapest-cloud-object-storage-1tb-2tb-comparison-2026/
- "R2 Pricing: The 3 Costs Cloudflare Buries" — https://leanopstech.com/blog/cloudflare-r2-pricing-2026/
- "Cloudflare R2 Free Tier: What You Get and How to Use It" — https://r2drop.com/blog/cloudflare-r2-free-tier-guide
