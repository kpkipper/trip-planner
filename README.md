This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
pnpm install
```

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Static pages & privacy

The app is a static export served by Firebase Hosting. Public trips are prerendered at build time (page, Open Graph image, sitemap entry); only the title, destination/country and cover are baked in, never dates or day counts.

- A trip made private (or deleted) after a build keeps its prerendered page, OG image and sitemap entry until the next deploy. Visibility changes and deletes need a redeploy to remove them.
- A trip made public after a build is served by the client shell (`_shell`): `noindex`, generic OG image, until the next build prerenders it.
- Private and unknown trips are always loaded in the browser with the viewer's token, so the API stays the real access gate.

## Local development notes

`next dev` cannot open trips that were not returned by `generateStaticParams` (`output: 'export'`). To test new or private trips locally, build and serve the real output, where the Firebase rewrites route them to the shells:

```bash
pnpm build
firebase serve --only hosting
```

## Moments, feed and safety

- **Uploads.** Photos and videos ("moments") are attached to a trip day or plan. The browser asks the API to start an upload (`POST /journeys/:slug/moments/uploads`), PUTs the file straight to the returned signed URL using exactly the returned method and headers (never an `Authorization` header), then calls `.../complete`. Up to 3 files upload at once, 20 per selection; images are JPEG/PNG/WebP up to 10 MB, videos MP4/MOV up to 100 MB and 60 s. The client checks these first, the backend checks again.
- **Signed media URLs** expire after about an hour, so the moments list reloads when the tab becomes visible after 50+ minutes and (at most once per 5 minutes) when an image or video fails to load.
- **Bucket CORS and lifecycle.** Uploads are cross-origin PUTs to the storage bucket, so the bucket needs a CORS policy (and a lifecycle rule for abandoned pending uploads). That setup lives in the backend (`journey-service`) README, not here.
- **Firebase Storage rules** (`storage.rules`) deny all client access: the web app never talks to Storage directly, only through signed URLs issued by the API. `pnpm release` deploys Hosting only (`firebase deploy --only hosting`). Storage rules are deployed separately with `firebase deploy --only storage`, once Storage is enabled for the project.
- **Feed** (`/feed`) shows activity from people you follow plus a "now travelling" row. Logged-in users who open `/` are redirected there.
- **Block and report.** Users can block/unblock from a profile menu or the `/blocks` page, and report users, trips and moments (reasons: spam, harassment, inappropriate, privacy, other).
