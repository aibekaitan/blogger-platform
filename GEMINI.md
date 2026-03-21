# GEMINI.md - Project Context

## Project Overview
**Blogger Platform** is a NestJS-based REST API for managing blogs, posts, comments, and user accounts. It features robust authentication, security measures, and a modern architectural approach.

### Main Technologies
- **Framework:** [NestJS](https://nestjs.com/) (Node.js)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database:** PostgreSQL with [TypeORM](https://typeorm.io/)
- **Patterns:** [CQRS](https://docs.nestjs.com/recipes/cqrs) (Command Query Responsibility Segregation), Repository Pattern, Clean Architecture.
- **Authentication:** JWT with [Passport.js](https://www.passportjs.org/), bcrypt for hashing.
- **Validation:** [class-validator](https://github.com/typestack/class-validator) and [class-transformer](https://github.com/typestack/class-transformer).
- **Documentation:** [Swagger/OpenAPI](https://docs.nestjs.com/openapi/introduction).

## Architecture
The project follows a modular and layer-based architecture:
- **`src/modules/`**: Contains domain-specific modules.
  - **`user-accounts/`**: Users, authentication, security devices, sessions.
  - **`bloggers-platform/`**: Blogs, posts, comments, likes.
- **`src/core/`**: Shared core logic, base DTOs, and utility types.
- **`src/common/`**: Shared decorators, config, and validation helpers.
- **`src/setup/`**: Centralized NestJS application configurations (pipes, swagger, etc.).

### Layer Breakdown
- **API Layer**: Controllers (`*.controller.ts`) handle HTTP requests.
- **Application Layer**: Handlers (`*.handler.ts`) implement CQRS commands and queries.
- **Domain Layer**: Entities (`*.entity.ts`) define the data model and business logic.
- **Infrastructure Layer**: Repositories (`*.repository.ts`) handle data persistence.

## Building and Running
### Prerequisites
- Node.js & pnpm
- PostgreSQL (ensure `DATABASE_URL` is set in `.env`)

### Key Commands
- `pnpm install` - Install dependencies.
- `pnpm run build` - Build the project.
- `pnpm run start:dev` - Run the application in development mode with watch.
- `pnpm run start:prod` - Run the production build.
- `pnpm run lint` - Run ESLint with auto-fix.
- `pnpm run test` - Run unit tests.
- `pnpm run test:e2e` - Run end-to-end tests.

## Development Conventions
- **CQRS:** All state-changing operations should use Commands; all read operations should use Queries.
- **Validation:** Use `class-validator` decorators in DTOs. Global validation is handled by a custom `ValidationPipe` in `src/main.ts`.
- **Entities:** TypeORM entities are used for database mapping and domain logic.
- **Error Handling:** Follow the project's standard of returning formatted validation errors (e.g., `{ errorsMessages: [{ message, field }] }`).
- **Environment Variables:** All configuration should be managed via `ConfigService` or `appConfig` in `src/common/config/config.ts`.
- **Database Synchronization:** `TypeOrmModule` is currently configured with `synchronize: true` for development. Be cautious when modifying entities.
