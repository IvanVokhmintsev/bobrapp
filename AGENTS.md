# Agent Instructions

Полные правила работы AI-агента в этом репозитории: **[docs/AGENTS.md](docs/AGENTS.md)**

Кратко:

- **Источник истины:** `docs/REQUIREMENTS.md` (отчёт) → `docs/PRODUCT_SPEC.md` → UI/Figma → код.
- **Автономия:** делай задачи сам; спрашивай только при блокерах и продуктовых противоречиях.
- **Git:** коммить завершённые итерации; push — только по просьбе.
- **Стек:** `backend/` (Fastify + Prisma), `frontend/web/` (React + Vite), auth через cookie.
- **Проверки:** `pnpm run build` в затронутых пакетах; migrate при изменении schema.

Перед работой прочитай `docs/AGENTS.md`.
