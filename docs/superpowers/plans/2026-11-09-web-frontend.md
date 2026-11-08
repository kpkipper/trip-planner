# Web Frontend (trip-planner) Implementation Plan (MVP แผน 6 จาก 6)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ให้ `trip-planner` ใช้ API ใหม่ของแผน 1–3 ได้ครบ: login (Google + email link), แสดง/แก้ทริปตามสิทธิ์, เชิญคน/ลิงก์เชิญ, ตั้ง privacy, หน้า profile + follow — โดยยังเป็น static export บน Firebase Hosting

**Architecture:** เก็บ session token ใน `localStorage` แล้วแนบ `Authorization: Bearer` ที่ axios interceptor ตัวเดียว (กันฝั่ง build ด้วย `typeof window`) หน้าแบบ dynamic ที่ build ล่วงหน้าไม่ได้ (ทริปส่วนตัว, ทริปใหม่, profile, ลิงก์เชิญ) ใช้ "shell page" ที่ prerender ไว้หนึ่งหน้า + Firebase rewrite แล้วอ่าน slug/token จาก URL ฝั่ง browser หน้าแก้ทริปบันทึกด้วย endpoint ทีละส่วน (diff กับข้อมูลจาก server) แทน PUT ทั้งทริป เพื่อให้ editor ใช้ได้และ ID ไม่เปลี่ยน

**Tech Stack:** Next.js 16 App Router (`output: 'export'`), React 19, Tailwind 4 + MUI 7, axios, pnpm, Vitest (เพิ่มใหม่ สำหรับ logic ที่ไม่ใช่ UI)

**Spec:** `journey-service/docs/business-requirements/2026-11-08-social-trip-sharing.md` ข้อ 6, 7.2, 7.4, 7.5, 7.7 (follow), 7.8, 8, 11 · API: `journey-service/README.md` (แผน 1–3)

**Repo / branch:** `~/Documents/repository/trip-planner`, branch `feature/social` แตกจาก branch หลักปัจจุบัน

## Global Constraints

- ห้ามเปลี่ยนเป็น server rendering: ต้องเป็น static export บน Firebase Hosting ต่อไป
- Login ใช้ระบบของ backend (ผู้ใช้เลือก 2026-11-09): ปุ่ม Google ผ่าน Google Identity Services (`accounts.google.com/gsi/client`, env `NEXT_PUBLIC_GOOGLE_CLIENT_ID`) → `POST /api/v1/auth/google {id_token}`; email → `POST /auth/email/start` แล้วผู้ใช้กดลิงก์ในเมล `{APP_WEB_URL}/auth/verify?token=…` → `POST /auth/email/verify`
- Token เก็บที่ `localStorage["jp.session"]`; ห้ามใส่ token ใน URL หรือ log; หลัง verify ต้องลบ `token` ออกจาก address bar (`history.replaceState`)
- ลิงก์เชิญจาก backend เป็น `{APP_WEB_URL}/join/{token}` → หน้า `/join` อ่าน token จาก path แล้ว `POST /invites/join {token}`
- 401 จาก API → ลบ session แล้วพาไปหน้า login พร้อม `next=` กลับหน้าเดิม
- Build ต้องผ่านแม้ API ตอบ error: `generateStaticParams` ห้าม throw — fallback เป็นแค่ shell
- ห้าม prerender ข้อมูลทริปที่ไม่ public ลง HTML/OG/sitemap (API แผน 3 กรองให้แล้วเมื่อเรียกแบบไม่มี token — ห้ามส่ง token ตอน build)
- ภาษา UI เหมือนเดิมของโปรเจค (คำถามเรื่องภาษายังเปิดอยู่)
- Response ของ `GET /journeys/:slug` (แผน 3) เป็น JourneyView: `id, slug, title, destination, country, cover_url, visibility, owner?, status{state,days_until,day_number,total_days}, month_start?, month_end?, departure_date?, return_date?, itinerary_days?, members?, redacted, role, live?, updated_at?` — field ที่มี `?` อาจไม่มีมาเลย ต้องเช็ค `redacted` ก่อนเสมอ
- คนที่ยังไม่ได้รับคำเชิญเปิดทริป private/followers จะได้ 404 → หน้าคำเชิญแสดงได้แค่ชื่อทริปจาก `/me/invites`
- ฟอร์มสร้าง/แก้ plan ต้องส่ง `category` (เพิ่ม dropdown: ที่พัก/อาหาร/สถานที่/เดินทาง/อื่น ๆ) เพื่อให้ backend ซ่อนที่พักให้อัตโนมัติ
- PUT `/update` เป็น owner-only และไม่แตะ cover/visibility; หน้าแก้ทริปใช้ PATCH + endpoint ทีละส่วนเท่านั้น

## Review Focus

1. **Token หลุดตอน build** ถ้า interceptor แนบ token ตอน build (มี localStorage ใน Node? ไม่มี แต่ต้องกันไว้) ทริปส่วนตัวจะถูก prerender → test ของ interceptor กับ `window` undefined
2. **Token ค้างใน URL** หน้า `/auth/verify` ต้องลบ query ก่อน render อย่างอื่น และไม่ส่ง Referer ไปที่อื่น (`<meta name="referrer" content="no-referrer">` บนหน้านี้)
3. **Diff-sync ผิดแล้วข้อมูลหาย** การบันทึกแบบ diff ต้องไม่ลบ day/plan ที่คนอื่นเพิ่งเพิ่มตอนเรากำลังแก้ → test ของ diff function: ลบเฉพาะ ID ที่เคยโหลดมาและผู้ใช้ลบเอง
4. **Shell route กับ slug ที่ prerender แล้ว** `/plans/<public-slug>` ต้องยังได้หน้า prerender (SEO/OG) ส่วน slug อื่น → shell; shell ต้องอ่าน slug จาก `location.pathname` ไม่ใช่ param `_shell`
5. **UI ซ่อนปุ่มตาม role แต่ API ยังเป็นด่านจริง** ปุ่มแก้/ลบ/เชิญ ต้องดูจาก role ใน response และจัดการ 403/404 ให้ดี (toast + กลับหน้าก่อน)

---

## File Structure (ใหม่/แก้ใน trip-planner)

| ไฟล์ | หน้าที่ |
|---|---|
| `src/lib/session.ts` | อ่าน/เขียน/ลบ token ใน localStorage อย่างปลอดภัย (try/catch, SSR-safe) |
| `src/api/httpClient/apiClient.ts` | interceptor แนบ Bearer + จัดการ 401 |
| `src/api/auth/*`, `src/api/me/*`, `src/api/members/*`, `src/api/itinerary/*`, `src/api/users/*` | wrapper ของ endpoint ใหม่ + types |
| `src/contexts/auth-context.tsx` | `AuthProvider`: user, login/logout, hydrate หลัง mount, refetch `/me` |
| `src/app/login/page.tsx`, `src/sections/login/*` | ปุ่ม Google + ฟอร์ม email |
| `src/app/auth/verify/page.tsx` | รับ token จากเมล |
| `src/app/join/[token]/page.tsx` (+ shell `_shell`) | รับลิงก์เชิญ |
| `src/app/plans/[slug]/*` | เพิ่ม `_shell` ใน generateStaticParams; อ่าน slug จาก pathname เมื่อเป็น shell |
| `src/app/u/[username]/page.tsx` (+ `_shell`) | หน้า profile |
| `src/app/invites/page.tsx` | คำเชิญที่รอตอบ |
| `src/sections/members/*` | รายชื่อสมาชิก, เชิญ, ลิงก์เชิญ, ออกจากทริป |
| `src/sections/privacy/*` | ตั้ง visibility / hide live / timezone / cover |
| `src/sections/create-edit-content/sync.ts` | diff ระหว่างทริปที่โหลดมากับที่แก้ → รายการ API call |
| `firebase.json` | rewrites สำหรับ shell |
| `vitest.config.ts`, `src/**/*.test.ts` | test ของ logic |

---

### Task 1: Vitest + session + apiClient interceptor
- เพิ่ม Vitest (`pnpm add -D vitest`), script `test`
- `session.ts`: `getToken(): string|null`, `setToken(t)`, `clearToken()` — ปลอดภัยเมื่อ `window` ไม่มี
- interceptor: แนบ `Authorization` เมื่อมี token และ `typeof window !== 'undefined'`; response 401 → `clearToken()` + dispatch event `jp:unauthorized`
- Tests: ไม่มี window → ไม่แนบ header (Review Focus 1); มี token → แนบ; 401 → token ถูกลบ + event ถูกยิง
- Commit `feat: add session storage and auth interceptor`

### Task 2: AuthProvider + login + verify + logout
- API wrappers: `loginWithGoogle(idToken)`, `startEmailLogin(email)`, `verifyEmailLogin(token)`, `logout()`, `getMe()`, `updateMe(patch)`
- `AuthProvider` ใน `layout.tsx` (ครอบ `TripsProvider`): state `{user, status: 'loading'|'anon'|'authed'}`, hydrate หลัง mount ด้วย `getMe()` ถ้ามี token, ฟัง `jp:unauthorized`
- `/login`: ปุ่ม Google (โหลด GIS script เฉพาะหน้านี้, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` ว่าง → ซ่อนปุ่ม), ฟอร์ม email → แสดง "เช็คอีเมล", จัดการ 429; รองรับ `?next=`
- `/auth/verify`: อ่าน token → `replaceState` ลบ query ทันที → verify → setToken → ไป `next` หรือ `/`; error → ข้อความ + ลิงก์กลับ login; `<meta name="referrer" content="no-referrer">` (Review Focus 2)
- Sidebar/header: avatar + เมนู (profile, invites, logout) หรือปุ่ม Login; เปิดปุ่ม "Create Plan" เมื่อ login
- Tests (Vitest): reducer/ฟังก์ชันของ auth state; verify page logic แยกเป็น function `consumeVerifyToken(url)` ที่คืน token และ URL ใหม่
- Commit `feat: add login and session handling`

### Task 3: Shell routes + Firebase rewrites
- `/plans/[slug]` และ `/plans/[slug]/edit` และ `opengraph-image`: `generateStaticParams` = public slugs + `"_shell"`; ห้าม throw (catch → แค่ `_shell`); เมื่อ slug เป็น `_shell` หน้า view/edit อ่าน slug จริงจาก `location.pathname`; metadata ของ `_shell` เป็นค่า default + `noindex`
- `/u/[username]` และ `/join/[token]` แบบเดียวกัน (`_shell` เท่านั้น)
- `firebase.json` rewrites (Firebase เสิร์ฟไฟล์จริงก่อน rewrite เสมอ): `/plans/*/edit` → `/plans/_shell/edit.html`, `/plans/*` → `/plans/_shell.html`, `/u/*` → `/u/_shell.html`, `/join/*` → `/join/_shell.html` (ตรวจชื่อไฟล์จริงใน `out/` หลัง build แล้วปรับให้ตรง)
- `sitemap.ts` ไม่รวม `_shell`
- Tests: ฟังก์ชัน `slugFromPath(pathname)` (Review Focus 4); `pnpm build` ผ่านเมื่อ API ไม่ตอบ (ตั้ง `NEXT_PUBLIC_API_ENDPOINT` เป็น URL ที่ไม่มีอยู่) และ `out/plans/_shell.html` มีอยู่
- Commit `feat: serve unknown trips through client shells`

### Task 4: แสดงทริปตาม privacy + role
- types/mapper รองรับ response ใหม่: `role`, `members`, `visibility`, `status` (state/day_number/total_days/days_until), `redacted`, `month_start/month_end`, `live`, `owner`, `cover_url`, plan `id/position/category/hidden_from_public`
- view: แสดงป้ายสถานะ (📝/✈️ อีก N วัน/🟢 วันที่ X จาก Y/✅), avatar สมาชิก, ทริป redacted แสดงแค่ประเทศ/เมือง/เดือน + ข้อความ "รายละเอียดจะเปิดเมื่อจบทริป", แผนที่ hidden ไม่แสดง (API ตัดให้แล้ว)
- action menu: Edit เมื่อ role owner/editor, Delete เมื่อ owner, Leave เมื่อ editor/traveler; Export ยังได้ทุกคน
- 403/404 → toast + not-found (แก้ hook ให้ catch error HTTP จริง ไม่พึ่ง body code อย่างเดียว)
- Sidebar: login แล้วใช้ `/me/journeys` (แยก "ของฉัน" / "ร่วมทริป"); ไม่ login ใช้ list สาธารณะเดิม
- Tests: mapper `toTrip` กับ response redacted และเต็ม
- Commit `feat: show trips by privacy and role`

### Task 5: แก้ทริปแบบ diff-sync
- `sync.ts`: `planSync(original: Trip, edited: Trip): SyncOp[]` คืนลำดับ ops: patch trip fields, add/update/delete day, add/update/delete/move plan, reorder per day; ลบเฉพาะ ID ที่อยู่ใน `original` และไม่อยู่ใน `edited` (Review Focus 3); ของใหม่ (ไม่มี server ID) → add
- `runSync(slug, ops)`: เรียงลำดับ: patch trip → add days → update days → add/update/move plans → reorder → delete plans → delete days; หยุดที่ error แรกแล้วแจ้ง, reload ทริป
- Create ยังใช้ `POST /journeys/create` (ส่ง visibility ด้วย)
- form: date range เปลี่ยนแล้ว `generateDays` ต้องคง server ID ของวันเดิม
- Tests: planSync ครบทุกชนิด op, ไม่ลบของที่ไม่เคยโหลด, reorder เฉพาะวันที่ลำดับเปลี่ยน
- Commit `feat: save trip edits with granular endpoints`

### Task 6: สมาชิก, คำเชิญ, ลิงก์เชิญ
- Members panel ในหน้าทริป (สมาชิกเห็น): รายชื่อ + role + status, owner เปลี่ยน role/เอาออก, เชิญด้วย username + role, สร้าง/คัดลอก/ยกเลิกลิงก์เชิญ (editor ที่เชิญได้ → traveler เท่านั้น), ปุ่ม Leave
- `/invites`: รายการคำเชิญ + รับ/ปฏิเสธ; badge จำนวนในเมนู
- `/join/<token>`: ต้อง login (ไม่ login → ไป login พร้อม `next`), `POST /invites/join` → ไปหน้าทริป; error → ข้อความ "ลิงก์หมดอายุหรือถูกยกเลิก"
- Tests: helper ที่สร้างข้อความ error จาก code (409 trip full / already member)
- Commit `feat: add members and invites`

### Task 7: Privacy settings + profile + follow
- Settings panel (owner): visibility 4 ระดับพร้อมคำอธิบายสั้น, hide live status, timezone (ค่าเริ่มต้นเดาจาก country ด้วย map เล็ก ๆ; แก้ได้), cover URL (https เท่านั้น), draft
- `/u/<username>`: header (avatar, ชื่อ, bio, followers/following, ปุ่ม Follow/Unfollow), section ตอนนี้ / กำลังจะไป / ปฏิทิน (list แบบ timeline) / เคยไป + สถิติ
- หน้าแก้ profile ของตัวเอง (username, display name, bio, avatar https)
- Tests: timezone guess map, ฟังก์ชันจัดกลุ่ม calendar
- Commit `feat: add privacy settings and profiles`

### Task 8: ตรวจจริงกับ API ในเครื่อง
- รัน journey-service (branch แผน 3) + Postgres ใน Docker + `pnpm dev` แล้วเดินทั้ง flow ใน browser: login ด้วย email (ลิงก์จาก log mailer), สร้างทริป, เชิญอีก user, รับคำเชิญ, editor แก้ plan, owner ตั้ง private, คนนอกเปิดลิงก์ได้ 404, profile + follow
- `pnpm build` แล้ว `firebase serve` เช็ค shell rewrites
- จด bug ที่เจอ แก้ แล้ว commit
- Commit `fix: issues found in end-to-end run` (ถ้ามี)

## สิ่งที่แผนนี้ตัดสินใจเอง

- เก็บ token ใน localStorage (static site ไม่มี server ทำ httpOnly cookie ได้) — ยอมรับความเสี่ยง XSS แลกกับความง่าย; ลดความเสี่ยงด้วยการ validate URL ทุกตัวที่ render (cover/avatar/map)
- ใช้ shell page + Firebase rewrite แทนการเปลี่ยน URL เป็น query string เพื่อให้ลิงก์เดิม `/plans/<slug>` ใช้ได้ต่อ
- หน้าแก้ทริปใช้ diff-sync กับ endpoint ทีละส่วน เพราะ PUT เป็น owner-only และเปลี่ยน ID ทุกครั้ง
- เพิ่ม Vitest สำหรับ logic เท่านั้น ไม่ทำ component test ใน MVP
