## 1. Share component

- [x] 1.1 Create `src/components/match/share-match.tsx` as a client component (`'use client'`, named export) that receives the match `id` (or `/partido/{id}` path) as a prop.
- [x] 1.2 Resolve the absolute match URL from `NEXT_PUBLIC_SITE_URL` joined with `/partido/{id}`, falling back to `window.location.origin` when the var is unset, avoiding double slashes.
- [x] 1.3 Build the message `Miren este partido que armé: {LINK}` and the `https://wa.me/?text=<message>` href with the full message `encodeURIComponent`-encoded.
- [x] 1.4 Render the "Compartí esta elegida" control styled with the existing `ui/button.tsx` look (EA-FC dark style), as an anchor opening with `target="_blank"` and `rel="noopener noreferrer"`.

## 2. Wire into the match page

- [x] 2.1 Render `ShareMatch` from `src/app/partido/[id]/page.client.tsx`, passing `teams.match.id`, placed in the match header/team-board area.

## 3. Verify

- [x] 3.1 Confirm tapping the control opens WhatsApp with the prefilled, URL-encoded message and the absolute match link, and that no score/total leaks into the text.
- [x] 3.2 Run type-check / lint to confirm conventions (named export, `type` over `interface`, no comments).
