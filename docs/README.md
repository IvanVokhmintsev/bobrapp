# Music Roadmap App

Music Roadmap App — приложение для начинающих и развивающихся музыкантов, которое помогает пользователю проходить путь профессионального роста через персонализированный roadmap, социальную ленту и профиль достижений.

## MVP

В MVP реализуются три ключевых раздела:

1. Социальная лента
2. Roadmap развития музыканта
3. Профиль пользователя

Пользователь регистрируется, выбирает роль, проходит онбординг и попадает в основной интерфейс приложения.

## User Roles

### Musician

Музыкант может:

- зарегистрироваться и войти в приложение;
- выбрать роль `musician`;
- пройти онбординг по уровню подготовки;
- просматривать социальную ленту;
- создавать собственные посты;
- проходить roadmap;
- видеть прогресс и достижения;
- редактировать профиль;
- добавлять информацию о музыкальных достижениях.

### Label

В MVP роль лейбла реализуется минимально.

Лейбл может:

- зарегистрироваться и войти в приложение;
- выбрать роль `label`;
- просматривать социальную ленту;
- открывать профили музыкантов.

Подписка, trial period, расширенный поиск, матчинг, аналитика и монетизация выносятся за рамки первой версии MVP.

## Core Screens

- Auth Screens
- Onboarding Screen
- Feed Screen
- Roadmap Screen
- Roadmap Lesson Screen
- Profile Screen

## Tech Stack

Подтвержденный backend-стек:

- Node.js
- Fastify
- TypeScript
- PostgreSQL
- Prisma
- JWT
- bcrypt

Frontend-стек будет уточнен отдельно:

- React / React Native / Next.js

Backend разрабатывается первым как отдельное API в папке `backend`.

## Project Documents

Подробное описание продукта и MVP находится в отдельных файлах:

- `PRODUCT_SPEC.md` — продуктовая спецификация MVP;
- `TASKS.md` — этапы разработки;
- `AGENTS.md` — правила работы для Codex / AI-агента.

## Getting Started

После инициализации проекта команды запуска могут выглядеть так:

```bash
cd backend
pnpm install
pnpm dev
```

Для production-сборки backend:

```bash
cd backend
pnpm build
pnpm start
```

## Development Approach

Разработка ведется маленькими итерациями:

1. Backend skeleton
2. Auth
3. Users and roles
4. Musician onboarding
5. Feed
6. Roadmap
7. Profile
8. Frontend integration

Codex / AI-агент должен выполнять задачи поэтапно и не реализовывать функциональность вне MVP без отдельного согласования.
