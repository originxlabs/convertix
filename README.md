# CONVERTIX Monorepo

## Structure & Boundaries
- `apps/` contains deployable UI applications only. Web UI must not import backend services. Desktop UI only talks to `apps/desktop/src-tauri` via Tauri IPC.
- `services/` contains backend services only. Backend must not import UI code.
- `packages/` contains shared libraries and contracts only. They should be framework-agnostic and safe to share across apps/services.
- `infra/` contains deployment configs and infrastructure assets only.

## Deployments
- `apps/web` -> Vercel
- `apps/desktop/src-tauri` -> Desktop build (Tauri)
- `services/*` -> Cloud-hosted
