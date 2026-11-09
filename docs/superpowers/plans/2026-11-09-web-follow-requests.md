# Web Follow Requests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The web app supports follow requests (journey-service `feature/follow-requests`). It also fixes the dialog accessibility and copy minors left over from plan 7.

**Architecture:** There is a new API client `src/api/follows`. The profile Follow button gets three states. A `/follow-requests` page lists incoming requests and current followers. A sidebar link shows a badge with the pending count. The edit-profile dialog gets an "Approve followers" switch. A shared `useModalA11y` hook (Escape, focus trap, scroll lock, focus restore) is used by the lightbox and the report dialog.

**Tech Stack:** Next.js 16 static export, React, TypeScript, Tailwind, axios `apiClient`, vitest.

**Spec:** journey-service `docs/superpowers/plans/2026-11-09-follow-requests.md` (API contract) plus BRD §7.7.

## Global Constraints

- Follow the existing patterns: `src/api/<area>/{index.ts,type.ts,index.test.ts}` with `fakeAdapter`, sections under `src/sections/<area>/`, and thin pages in `src/app/<route>/page.tsx` with `robots: { index: false, follow: false }`.
- Profile and follow UI copy is English, matching the current profile page.
- Lists may arrive as `null` from older servers; treat `null` as `[]`.
- Before each commit, `pnpm test`, `pnpm lint`, `pnpm exec tsc --noEmit` and `pnpm build` must all pass.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## API contract (from the backend plan)

- `POST /api/v1/users/:u/follow` and `DELETE /api/v1/users/:u/follow` → `{is_following, requested, followers}`
- `GET /api/v1/me/follow-requests` → `{items: [{user: PublicProfile, created_at}], count}`
- `POST /api/v1/me/follow-requests/:u/accept` and `DELETE /api/v1/me/follow-requests/:u`
- `GET /api/v1/me/followers` → `{items: [...]}`; `DELETE /api/v1/me/followers/:u`
- The profile view adds `follow_requested: boolean` and `follow_approval: boolean`. `User` (from `/me`) adds `follow_approval: boolean`. `PATCH /me` accepts `follow_approval`.

## Review Focus

1. Double-clicking Follow must not send two requests. Disable the button while a request is in flight.
2. If accepting fails (the requester blocked you meanwhile and the server returns 404), drop that row and show a toast. Don't crash.
3. If the pending-count fetch fails (401, offline), the sidebar must render without a badge and never redirect to login.
4. Focus trap: Tab and Shift+Tab cycle inside the dialog. Escape closes it, except while the report is submitting. Focus returns to the opener on close.
5. Turning approval off must warn that pending requests will all be accepted.

---

### Task 1: API client, Follow button states, approval switch

**Files:**
- Create: `src/api/follows/{index.ts,type.ts,index.test.ts}`
- Modify: `src/api/profile/type.ts` (`FollowState.requested`, `ProfileView.follow_requested`, `ProfileView.follow_approval`), `src/api/me/type.ts` (`User.follow_approval`, `ProfilePatch.follow_approval?`)
- Modify: `src/sections/profile/profile-content.tsx`, `src/sections/profile/edit-profile-dialog.tsx`
- Create: `src/lib/follow-button.ts` + test

**Interfaces — Produces:**
- `src/api/follows`:
  - `listFollowRequests(): Promise<{items: FollowEntry[], count: number}>`
  - `acceptFollowRequest(username)`
  - `declineFollowRequest(username)`
  - `listFollowers(): Promise<FollowEntry[]>`
  - `removeFollower(username)`
  - `FollowEntry = {user: PublicProfileType, created_at: string}`
- `followButton(p: {is_following, follow_requested, follow_approval}): {label: 'Unfollow'|'Requested'|'Request to follow'|'Follow', action: 'unfollow'|'cancel'|'follow'}`

- [ ] **Step 1: Write failing tests:**
  - Each API function hits the right method and URL, and username is URL-encoded.
  - A `null` items list becomes `[]`.
  - `followButton` covers all four states.
- [ ] **Step 2: Implement.**
  - The profile toggle uses `followButton`. After the call it sets `is_following`, `follow_requested` (from `requested`) and `followers` from the response.
  - "Requested" cancels on click with no confirm.
  - The button is disabled while busy.
- [ ] **Step 3: Add the edit-profile switch** "Approve followers" with the hint "People must ask before following you." It is on when `follow_approval !== false`. When the user turns it off and saves, show an inline note before saving: "Pending requests will all be accepted."
- [ ] **Step 4: Run** the checks and **commit** `feat(follow): request-aware follow button and approval switch`.

### Task 2: `/follow-requests` page and sidebar badge

**Files:**
- Create: `src/app/follow-requests/page.tsx`, `src/sections/follows/follow-requests-content.tsx`
- Modify: `src/components/sidebar.tsx`

- [ ] **Step 1: Build the page** (authed only; anonymous users redirect to `loginPath('/follow-requests')`, like `blocks-content.tsx`).
  - **"Follow requests" section:** avatar, name and @username linking to `/u/<username>`, with Accept and Decline buttons. The row is removed on success, and on a 404.
  - **"Followers" section:** each row has a Remove button with a `ConfirmDialog` ("Remove @x as a follower? They won't be told.").
  - Empty states for both sections. Loading and retry like `blocks-content`.
- [ ] **Step 2: Add the sidebar link** under Feed: "Follow requests", using the `UserPlus` icon. It shows a count badge when the count is > 0.
  - Fetch the count once when `status === 'authed'` and the path changes. Call it with `skipAuthRedirect`, and swallow errors.
  - Extend `listFollowRequests` with an options arg `{skipAuthRedirect?: boolean}`, the same as `getMe` does.
- [ ] **Step 3: Run** the checks and **commit** `feat(follow): follow requests page and sidebar badge`.

### Task 3: Dialog accessibility and copy minors (from plan 7)

**Files:**
- Create: `src/lib/use-modal-a11y.ts` + test (vitest + jsdom or `@testing-library/react` if already installed; otherwise test the pure helper `nextFocusIndex(current, count, shift)`)
- Modify: `src/sections/moments/moment-lightbox.tsx`, `src/sections/safety/report-dialog.tsx`, `src/sections/view-content/trip-view-content.tsx`

- [ ] **Step 1: Write `useModalA11y(ref, {open, onClose, canClose})`.**
  - Escape calls `onClose` when `canClose` is not false.
  - Tab and Shift+Tab wrap focus inside `ref`.
  - Body scroll is locked while open.
  - On open, focus moves to the first focusable element. On close, focus goes back to the element that had it before.
  - Add `role="dialog" aria-modal="true"` where missing.
- [ ] **Step 2: Use it in the lightbox and the report dialog.** The report dialog can't close (Escape, backdrop or Cancel) while submitting.
- [ ] **Step 3: Make the delete-trip dialog all English.** Replace the Thai sentence with "All photos and videos from every member of this trip will be deleted too."
- [ ] **Step 4: Fix the parked `useMoments` loading flag** from plan 7 Task 2 (`.superpowers/sdd/2026-11-09-web-moments-feed/progress.md`). `loading` must be true only while a fetch is in flight.
- [ ] **Step 5: Run** the checks and **commit** `fix(a11y): modal focus trap, escape and scroll lock; delete-trip copy`.
