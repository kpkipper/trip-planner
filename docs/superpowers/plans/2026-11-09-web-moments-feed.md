# Web: Moments, Feed, Block & Report Implementation Plan (แผน 7)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** หน้าเว็บ `trip-planner` แปะ/ดู/ลบรูปและวิดีโอในทริปได้ มีหน้า feed + แถว "ตอนนี้ใครเที่ยวอยู่" และ block / report ได้

**Architecture:** ต่อจากแผน 6 (static export + client shells) API ใหม่ของ backend แผน 4–5 เรียกผ่าน `apiClient` เดิม **ยกเว้น** การ PUT ไฟล์ไปที่ signed URL ของ Firebase Storage ต้องใช้ `XMLHttpRequest` ตรง ๆ (ห้ามแนบ Bearer token ไปที่ Google และต้องการ progress) หน้าใหม่ (`/feed`, `/blocks`, `/me/moments`) เป็น static route ปกติที่โหลดข้อมูลฝั่ง browser

**Tech Stack:** Next.js 16 static export, React 19, MUI 7, Tailwind 4, lucide-react, axios, Vitest

**Spec:** `journey-service/docs/business-requirements/2026-11-08-social-trip-sharing.md` ข้อ 6.2 (4, 6, 7), 7.6, 7.7; API ตาม `journey-service/docs/superpowers/plans/2026-11-09-moments.md` และ `2026-11-09-feed-and-safety.md`

**Base:** branch `feature/moments-feed` แตกจาก `feature/social`

## Global Constraints

- PUT ไฟล์ไป `upload.url` ด้วย `upload.method` และ header ตาม `upload.headers` ตรงตัวเท่านั้น ห้ามมี `Authorization`
- เช็คฝั่ง browser ก่อนเริ่ม (กันเสียเวลา backend ยังเช็คซ้ำ): รูป `image/jpeg|png|webp` ≤ 10 MB; วิดีโอ `video/mp4|quicktime` ≤ 100 MB; เลือกได้ครั้งละไม่เกิน **20** ไฟล์; `<input accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime" multiple>` (ทำให้ iPhone แปลง HEIC เป็น JPEG ให้)
- อัปโหลดพร้อมกันไม่เกิน **3** ไฟล์; แต่ละไฟล์: start → PUT → complete; ไฟล์หนึ่งพังไม่ทำให้ไฟล์อื่นหยุด
- ปุ่มแปะรูปโชว์เมื่อ role = owner หรือ (role เป็น editor/traveler และ `settings.members_can_post`)
- ปุ่มลบโชว์ตาม `can_delete` จาก API; แก้ caption ได้เมื่อเป็นคนอัปโหลด (`uploader.username` = ผู้ใช้ปัจจุบัน) และยังเป็น member
- Signed URL หมดอายุใน 1 ชม.: โหลด moments ใหม่เมื่อแท็บกลับมา visible และโหลดครั้งล่าสุดเกิน 50 นาที และเมื่อ `<img>`/`<video>` โหลดไม่ขึ้น (สูงสุด 1 ครั้งต่อ 5 นาที)
- ข้อความ error ภาษาไทยตาม status/message ของ API: `file too large` → "ไฟล์ใหญ่เกินไป", `unsupported file format` → "ไฟล์ชนิดนี้ใช้ไม่ได้", `video is longer than 60 seconds` → "วิดีโอยาวเกิน 60 วินาที", `trip has too many moments` → "ทริปนี้มีรูปครบ 500 แล้ว", 429 → "อัปโหลดบ่อยเกินไป ลองใหม่ภายหลัง", `video processing is unavailable` → "ตอนนี้ยังอัปวิดีโอไม่ได้", อื่น ๆ → "อัปโหลดไม่สำเร็จ"
- แก้ทริป (diff-sync): ลบวันแล้วได้ 409 `day has moments` → หยุด sync, แสดง "ลบวันที่มีรูปไม่ได้ ลบรูปในวันนั้นก่อน", โหลดทริปใหม่ (ใช้กลไก failure เดิมของ `runSync`)
- ทุกค่าจาก API ที่เอาไปใส่ `href`/`src` ผ่าน `safeHttpsUrl` (ยกเว้น `http://localhost` ใน dev ซึ่ง `safeHttpsUrl` ต้องยอมเฉพาะเมื่อ `process.env.NODE_ENV !== 'production'`)
- Feed text (ไทย): `trip_planned` → "**A** กำลังจะไป **{destination}** กับ B, C · {12–16 ธ.ค.}" (ไม่มี companions ตัด "กับ ..."; ช่วงวันที่ใช้ formatter เดิมของโปรเจกต์); `trip_started` → "**A** เริ่มทริป {destination} แล้ว 🟢"; `moments_added` → "**A** แปะ {count} รูปใน {day_title}" + thumbs; `trip_completed` → "**A** เที่ยว {destination} จบแล้ว ✅"
- ผู้ใช้ที่ login แล้วเข้า `/` → ไป `/feed`; ไม่ login ทำแบบเดิม
- Report reasons แสดงเป็นไทย: spam "สแปม", harassment "คุกคาม", inappropriate "ไม่เหมาะสม", privacy "ละเมิดความเป็นส่วนตัว", other "อื่น ๆ"
- Firebase Storage rules ใน repo: deny ทั้งหมด

## Review Focus

1. **Token หลุดไป Google** ถ้า upload ใช้ `apiClient` → test ใน Task 1 ยืนยันว่า XHR ไม่มี Authorization
2. **คนที่ไม่มีสิทธิ์เห็นปุ่มแปะรูป / ลบ** → test ของ `momentControls` ใน Task 2
3. **อัปโหลดหลายไฟล์แล้วไฟล์เดียวพังทำให้ทั้งชุดค้าง** → test ของ queue ใน Task 1
4. **Feed ว่าง / ไม่ login / โหลดเพิ่มซ้ำ** → test ใน Task 3
5. **ลบวันที่มีรูปตอนแก้ทริป** ต้องไม่ทำให้ข้อมูลหายเงียบ ๆ → test ใน Task 2

---

### Task 1: API clients + upload queue

**Files:**
- Create: `src/api/moments/{index.ts,type.ts,index.test.ts}`, `src/api/feed/{index.ts,type.ts,index.test.ts}`, `src/api/safety/{index.ts,type.ts,index.test.ts}` (block + report), `src/lib/moment-upload.ts`, `src/lib/moment-upload.test.ts`, `src/lib/moment-errors.ts`, `src/lib/moment-errors.test.ts`

**Interfaces:**
- Produces:
  - `type MomentView` ตรงกับ JSON ของ backend (`id, day_id, plan_id, kind, status, caption, width, height, duration_ms, url, thumb_url, uploader, created_at, can_delete, journey?`)
  - `startUpload(slug, {kind, content_type, size_bytes, day_id, plan_id?, caption?}) → {moment, upload}`; `completeUpload(slug, id) → MomentView`; `listMoments(slug) → MomentView[]`; `updateCaption(id, caption)`; `deleteMoment(id)`; `listMyMoments()`
  - `getFeed(before?: string, limit?: number) → {items, next_before}`; `getNowTravelers() → NowTraveler[]`
  - `blockUser(username)`, `unblockUser(username)`, `listBlocks() → PublicProfile[]`, `createReport({target_type, target, reason, note?}) → {report, created}` (`created` = status 201)
  - `validateFile(file: File): {kind: 'photo'|'video'} | {error: string}` (error เป็นข้อความไทยตาม Global Constraints)
  - `putFile(target: UploadTarget, file: File, onProgress: (fraction: number) => void, xhrFactory = () => new XMLHttpRequest()): Promise<void>` — ส่งเฉพาะ header ใน `target.headers`
  - `uploadAll(files: File[], ctx: {slug, dayId, planId?}, deps = {startUpload, putFile, completeUpload}, onUpdate: (items: UploadItem[]) => void): Promise<UploadItem[]>` — `UploadItem = {name, kind?, progress, state: 'queued'|'uploading'|'processing'|'done'|'error', error?, moment?}`; concurrency 3; >20 ไฟล์ → ไฟล์ที่ 21+ เป็น error "เลือกได้ครั้งละไม่เกิน 20 ไฟล์"
  - `momentErrorMessage(err: unknown): string`
- [ ] **Step 1: Write the failing tests** — client ใช้ path/method ถูก (ผ่าน `test-adapter.ts` เดิม); `putFile` ใช้ fake XHR: method/URL/headers ตรง, **ไม่มี** `Authorization`, progress ถูกเรียก, status ≠ 2xx → reject; `uploadAll`: 5 ไฟล์ concurrency ไม่เกิน 3 พร้อมกัน, ไฟล์ที่ 2 complete พังแต่ที่เหลือ done, 21 ไฟล์ → อันที่ 21 error; `validateFile` table (heic, 10 MB+1, video 100 MB+1, gif); `momentErrorMessage` table ครบทุกข้อความใน Global Constraints
- [ ] **Step 2: Run** `pnpm test` → FAIL
- [ ] **Step 3: Implement**
- [ ] **Step 4: Run** `pnpm test && pnpm lint && pnpm exec tsc --noEmit` → PASS
- [ ] **Step 5: Commit** `feat: API clients and upload queue for moments, feed and safety`

### Task 2: Moments ในหน้าทริป + การตั้งค่า + รูปของฉัน

**Files:**
- Create: `src/sections/moments/{moments-gallery.tsx,moment-uploader.tsx,moment-lightbox.tsx,use-moments.ts}`, `src/lib/moment-controls.ts`, `src/lib/moment-controls.test.ts`, `src/lib/moments-by-day.ts`, `src/lib/moments-by-day.test.ts`, `src/app/me/moments/page.tsx`, `src/sections/moments/my-moments-content.tsx`
- Modify: `src/sections/view-content/trip-day-detail.tsx` (แสดงรูปของ day และของแต่ละ plan), `trip-view-content.tsx`, `src/sections/settings/trip-settings-panel.tsx` + `src/lib/trip-settings.ts` (สวิตช์ "ให้สมาชิกแปะรูปได้" = `members_can_post`, owner เท่านั้น), `src/api/journey/type.ts` (settings), `src/sections/create-edit-content/sync.ts` (409 `day has moments`), `src/components/account-menu.tsx` (ลิงก์ "รูปของฉัน")
- **Interfaces:** `momentControls(role, settings, currentUsername, moment?) → {canPost, canDelete, canEditCaption}`; `groupMoments(moments) → {byDay: Map<dayId, MomentView[]>, byPlan: Map<planId, MomentView[]>}` (moment ที่มี plan_id ไปอยู่ byPlan เท่านั้น); `useMoments(slug)` คืน `{moments, reload, loading}` พร้อมกฎ refresh ของ signed URL
- UI: grid thumb สี่เหลี่ยม (วิดีโอมีไอคอน ▶ + ความยาว), กดแล้วเปิด lightbox (รูปเต็ม/`<video controls playsInline preload="metadata" poster>`), เลื่อนซ้าย/ขวา, caption, ปุ่มลบ (confirm "ลบรูปนี้?"), แก้ caption inline, ปุ่ม Report (Task 4 ใส่ handler); ปุ่ม "แปะรูป/วิดีโอ" ใน day และใน plan → เลือกไฟล์ → แสดงรายการ progress ต่อไฟล์ → เสร็จแล้ว reload
- `/me/moments`: list รูปของฉันทุกทริป (มีชื่อทริป) ลบได้; ไม่ login → ไป login
- [ ] **Step 1: Write the failing tests** — `momentControls` table (owner, editor+members_can_post false, traveler+true, stranger, คนอัปโหลดที่เป็น member, legacy role ""); `groupMoments`; sync: เมื่อ `deleteDay` ได้ 409 ข้อความ `day has moments` → `runSync` คืน failure ข้อความไทยที่กำหนดและไม่ทำ op ถัดไป
- [ ] **Step 2–4:** FAIL → Implement → `pnpm test && pnpm lint && pnpm exec tsc --noEmit && pnpm build` PASS
- [ ] **Step 5: Commit** `feat: moments gallery, uploader and settings on trip page`

### Task 3: Feed

**Files:**
- Create: `src/app/feed/page.tsx`, `src/sections/feed/{feed-content.tsx,now-row.tsx,feed-item.tsx,use-feed.ts}`, `src/lib/feed-text.ts`, `src/lib/feed-text.test.ts`, `src/lib/feed-pager.ts`, `src/lib/feed-pager.test.ts`
- Modify: `src/app/page.tsx` (authed → `/feed`), `src/components/sidebar.tsx` (ลิงก์ Feed เมื่อ login)
- **Interfaces:** `feedText(item) → {parts: Array<{text: string, strong?: boolean, href?: string}>}` (ชื่อคนลิงก์ไป `/u/<username>`, ชื่อเมืองลิงก์ไป `/plans/<slug>`); `createFeedPager(fetchPage)` → `{items, loadMore(), hasMore, loading}` กัน loadMore ซ้อน และ dedupe ด้วย `id`
- UI: แถวบน = avatar วงกลมขอบเขียว + ชื่อ + "วันที่ X/Y · เมือง" เลื่อนแนวนอน กดแล้วไปหน้าทริป; ซ่อนทั้งแถวเมื่อว่าง; list item มี avatar, ข้อความ, เวลาแบบ relative ไทย ("3 ชม.ที่แล้ว"), thumbs ≤ 4 ของ moments_added, cover ของทริป; ปุ่ม "โหลดเพิ่ม"; ว่าง → "ยังไม่มีอะไรใน feed ลอง follow เพื่อนดูสิ"; ไม่ login → ไปหน้า login พร้อม next=/feed
- [ ] **Step 1: Write the failing tests** — `feedText` ทั้ง 4 type (มี/ไม่มี companions, companions 5 คน), `createFeedPager` (เรียกซ้อนแล้วยิงครั้งเดียว, next_before null → hasMore false, dedupe)
- [ ] **Step 2–4:** FAIL → Implement → test/lint/tsc/build PASS
- [ ] **Step 5: Commit** `feat: feed page with now-travelling row`

### Task 4: Block & Report UI + storage rules + docs

**Files:**
- Create: `src/sections/safety/{report-dialog.tsx,block-menu.tsx}`, `src/app/blocks/page.tsx`, `src/sections/safety/blocks-content.tsx`, `src/lib/report-form.ts`, `src/lib/report-form.test.ts`, `storage.rules`
- Modify: `src/sections/profile/profile-content.tsx` (เมนู ⋯: Block/Unblock, Report; `is_blocked` → แสดง "คุณ block คนนี้อยู่" + ปุ่ม Unblock แทนเนื้อหา), `src/sections/view-content/trip-action-menu.tsx` (Report trip เมื่อไม่ใช่ owner และ login), `src/sections/moments/moment-lightbox.tsx` (Report moment เมื่อไม่ใช่คนอัปโหลด), `src/components/account-menu.tsx` (ลิงก์ "คนที่ block"), `src/api/profile/type.ts` (`is_blocked`), `firebase.json` (`"storage": {"rules": "storage.rules"}`), `README.md` (Moments/Feed + CORS ของ bucket อ้างถึง README ของ backend)
- **Interfaces:** `validateReport({reason, note}) → string | null` (note ≤ 500 ตัว, reason ต้องอยู่ใน 5 ค่า)
- Block: confirm "Block @x? เขาจะไม่เห็นทริปและโปรไฟล์ของคุณ และเลิก follow กันทั้งสองฝั่ง" → สำเร็จ reload profile; Report: dialog radio 5 เหตุผล + note → toast "ส่งรายงานแล้ว ขอบคุณ" (ทั้ง 201 และ 200)
- `storage.rules`: `rules_version = '2'; service firebase.storage { match /b/{bucket}/o { match /{allPaths=**} { allow read, write: if false; } } }`
- [ ] **Step 1: Write the failing tests** — `validateReport` table
- [ ] **Step 2–4:** FAIL → Implement → test/lint/tsc/build PASS
- [ ] **Step 5: Commit** `feat: block and report UI, storage rules and docs`
