# FitForge — AI Workout App

An fitness tracker with a React web app (desktop) and Expo mobile app. Features include workout plans, exercise library, workout logging, progress analytics (charts, personal records), and an AI coach powered by GPT-4o.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI via Replit AI Integration

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Web: React + Vite, Wouter routing, TanStack Query, Recharts, Tailwind CSS
- Mobile: Expo (SDK 54), Expo Router, React Native, TanStack Query

## Where things live

- `lib/db/src/schema/` — Drizzle ORM table definitions (exercises, workouts, workout_exercises, workout_logs, workout_log_sets, user_profile, conversations, messages)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/src/generated/` — Generated TanStack Query hooks and Zod schemas (do not edit manually)
- `artifacts/api-server/src/routes/` — Express route handlers (exercises, workouts, workout_logs, progress, profile, ai)
- `artifacts/workout-web/src/` — React web app pages and components
- `artifacts/mobile/app/` — Expo mobile screens (tabs + detail screens)
- `artifacts/mobile/constants/colors.ts` — Design tokens (synced from web dark theme)

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → React Query hooks. All API calls use generated hooks.
- Date serialization: Drizzle returns JS `Date` objects; a `serializeDates()` helper in `api-server/src/lib/serialize.ts` converts them to ISO strings before Zod validation.
- Single user (no auth): All data is shared; no per-user isolation. User profile is singleton row in `user_profile`.
- AI via Replit Integration: OpenAI access via `@workspace/integrations-openai-ai-server` (no hardcoded API keys).
- Dark-first design: Electric cyan (`#00E6D2`) on obsidian black (`#09090B`) — consistent across web and mobile.

## Product

- **Exercise Library**: 20+ seeded exercises across all muscle groups and equipment types; custom exercise creation
- **Workout Plans**: Browse, create, and AI-generate personalized workout plans
- **Workout Logging**: Log completed sessions with duration, rating, and notes
- **Progress Analytics**: Charts for weekly activity, personal records per exercise, volume tracking
- **AI Coach**: GPT-4o powered chat and workout plan generation

## User preferences

- Dark-first design, electric cyan primary accent
- Outfit font family (web + mobile)
- No auth required — single-user app

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`
- Always run `serializeDates()` before Zod parsing of Drizzle query results (dates come as JS `Date` objects)
- `@workspace/integrations-openai-ai-server` must be in `api-server/package.json` as `workspace:*` — cannot be added via `pnpm add` (not on npm registry)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
