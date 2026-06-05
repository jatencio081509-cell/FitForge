# FitForge

Monorepo for FitForge (workout/fitness app).

## Structure

- `apps/mobile/` - React Native + Expo mobile app
- `apps/web/` - Website version (to be developed)
- `packages/shared/` - Shared code between web and mobile

## Getting Started (Mobile)

```bash
cd apps/mobile
npm install
npx expo start
```

## Scripts

- `pnpm dev` - Run development (if turbo is set up)
- `pnpm build` - Build all packages