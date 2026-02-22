# Bunchfood Frontend (Next.js 15)

Modern App Router frontend rebuild for Bunchfood, designed for a Django/DRF (or similar) API backend.

## Stack
- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- `next/font` (Inter)
- `lucide-react`

## Setup
1. `cd frontend`
2. `cp .env.example .env.local`
3. Update `NEXT_PUBLIC_API_BASE_URL`
4. `npm install`
5. `npm run dev`

## Env vars
- `NEXT_PUBLIC_API_BASE_URL`: API base URL (example: `http://localhost:8000/api`)

## Route map
Public: `/`, `/shops`, `/shops/[shopId]`, `/products/[productId]`, `/cart`, `/wishlist`, `/about`, `/contact`, `/budget-planner`, `/account/analytics`, `/messages`, `/messages/[threadId]`, `/login`, `/register`

Admin: `/admin`, `/admin/analytics`, `/admin/products`, `/admin/products/new`, `/admin/orders`, `/admin/customers`

## API integration
All API endpoint paths are centralized in `lib/api/endpoints.ts` (`apiPaths` object).

## Auth notes
- Middleware protects `/cart`, `/wishlist`, `/budget-planner`, `/account/*`, `/messages/*`, `/admin/*`
- `middleware.ts` checks `access_token` or `sessionid` cookie
- Session helper: `lib/auth/session.ts`

## Notes
- Pages are wired to API calls with graceful fallback states.
- Unknown endpoints are intentionally easy to update in one file (`apiPaths`).
- Placeholder assets are in `/public`.