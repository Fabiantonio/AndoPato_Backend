# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

REST API de AndoPato (presupuestos y gastos personales): Express 5 + TypeScript + Sequelize (decoradores, `sequelize-typescript`) sobre PostgreSQL. Mensajes de error y respuestas están en español.

## Comandos

- `npm run dev` — servidor con nodemon (`src/index.ts`), puerto `PORT` o 4000
- `npm run build` — `tsc` a `dist/`; `npm start` ejecuta `dist/index.js`
- `npm test` — jest; `npm run test:coverage` para cobertura (salida en `coverage/`)
- Un solo archivo: `npx jest src/tests/unit/controllers/AuthController.test.ts`
- Un solo test: `npx jest -t "nombre del test"`

**`npm test` ejecuta antes `pretest`** (`ts-node ./src/data --clear`), que hace `db.sync({ force: true })`: **borra y recrea todas las tablas** de la base apuntada por `DATABASE_URL`. Nunca correr los tests contra una base con datos reales. Para saltarse el borrado, invocar `npx jest` directamente.

Variables de entorno (`.env`, leídas con dotenv): `DATABASE_URL`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `JWT_SECRET`, `NODE_ENV`. No existe `.gitignore`: `.env`, `node_modules/` y `coverage/` están versionados.

## Arquitectura

`src/index.ts` solo hace `listen`; la app Express vive en `src/server.ts` (exporta `app` por defecto y `connectDB`, para que supertest la use sin levantar puerto). Al importar `server.ts` ya se llama `connectDB()` (authenticate + `db.sync()`), así que los tests de integración requieren una base real.

Rutas: `/api/auth` (`authRouter`) y `/api/budgets` (`budgetRouter`, que también contiene las rutas anidadas de gastos `/:budgetId/expenses/:expenseId`; no hay router de expenses separado). Capas: router → middleware → controller (clases con métodos `static` arrow) → modelo.

### Patrón de middleware con `router.param` (budgetRouter)
Toda la validación de recursos se engancha con `router.param("budgetId" | "expenseId", ...)` en vez de ir por ruta. Orden para `budgetId`: `validateBudgetId` → `validateBudgetExist` (deja `req.budget`) → `hasAccessToBudget` (compara `req.budget.userId` con `req.user.id`). Para `expenseId`: `validateExpenseId` → `validateExpenseExist` (deja `req.expense`). Los controllers asumen que `req.user`, `req.budget` y `req.expense` ya están poblados; esos campos se tipan con `declare global { namespace Express { interface Request ... } }` dentro de cada middleware (`auth.ts`, `budget.ts`, `expense.ts`).

Ojo: `validateExpenseExist` busca el gasto solo por id, sin comprobar que pertenezca a `req.budget`; `validateBudgetInput`/`validateExpenseInput` solo *corren* validaciones de express-validator, el 400 lo emite luego `handleInputErrors`.

### Auth
- Registro: `User.create` → hash bcrypt (`utils/auth.ts`) → token numérico de 6 dígitos (`utils/token.ts`, guardado en `User.token`) → correo vía nodemailer (`emails/AuthEmail.ts`, `config/nodemailer.ts`). Confirmación, forgot/reset y validate-token usan ese mismo campo `token` (se busca por token, se limpia a `""` al usar).
- Login devuelve JWT (30d, `utils/jwt.ts`); `middleware/auth.ts#authenticate` lo lee de `Authorization: Bearer`, y carga el usuario con solo `id, name, email`.
- `authRouter` aplica `limiter` (`config/limiter.ts`): 100 req/min en dev, 5 en producción.
- Hook de test: fuera de producción, `createAccount` guarda el token en `globalThis.andoPatoConfirmationToken`; el test de integración de confirmación lo usa en vez de leer el correo.

### Modelos
`User` 1—N `Budget` 1—N `Expense`, con `onDelete: CASCADE`. `config/db.ts` carga los modelos por glob (`models/**/*`). Las tablas se crean con `sync()`, no hay migraciones.

## Tests

Dos estilos en `src/tests/`:
- `unit/`: controllers y middlewares con `node-mocks-http` (`createRequest`/`createResponse`) y `jest.mock` de los modelos/utils; sin base de datos. Datos de ejemplo en `tests/mocks/`.
- `integration/app.test.ts`: supertest contra `server` con base de datos real; los tests son **secuenciales y dependen del estado** (el usuario creado en el primer `describe` se confirma en el segundo con el token de `globalThis`).

Cobertura actual: unit tests de `AuthController` solo cubren `createAccount` y `login`; no hay tests de `middleware/auth.ts`, `validation.ts`, `utils/*`, `AuthEmail`, ni de integración para login/forgot/reset/rutas de budgets.

`tsconfig` tiene `strict: false`, `experimentalDecorators` y `emitDecoratorMetadata` (necesarios para los modelos). Los imports usan `module: NodeNext` pero sin extensión `.js` explícita (código CommonJS por ts-jest/ts-node).
