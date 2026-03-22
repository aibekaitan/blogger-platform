# План миграции на продвинутую конфигурацию (IT-Incubator: Lesson 4 Final)

Этот план описывает перенос структуры управления переменными окружения из референсного репозитория в проект `blogger-platform`.

## 1. Подготовительный этап
1.  **Утилита валидации**: Создать `src/setup/config-validation.utility.ts` (копируем логику `validateSync` и преобразования в boolean).
2.  **Config Dynamic Module**: Создать `src/config-dynamic-module.ts`, который настраивает `ConfigModule.forRoot` с поддержкой разных `.env` файлов (`.env.development`, `.env.testing` и т.д.).

## 2. Создание типизированных конфигов (Injectable)
Вместо `src/common/config/config.ts` создаем:

### A. Core Config (`src/core/core.config.ts`)
- `port`: number
- `databaseUrl`: string (PostgreSQL)
- `env`: Environments (dev, prod, test)
- `includeTestingModule`: boolean
- `isSwaggerEnabled`: boolean

### B. User Accounts Config (`src/modules/user-accounts/config/user-accounts.config.ts`)
- `accessTokenSecret`: string
- `accessTokenExpireIn`: string
- `refreshTokenSecret`: string
- `refreshTokenExpireIn`: string
- `email`: string
- `emailPass`: string

## 3. Изменение инициализации приложения
1.  **init-app-module.ts**: Создать `src/init-app-module.ts` для предварительного получения `CoreConfig` через `createApplicationContext`.
2.  **AppModule**: 
    - Добавить `static forRoot(coreConfig: CoreConfig)` для динамического подключения модулей (например, `TestingModule`).
    - Перевести `TypeOrmModule.forRootAsync` на использование `CoreConfig`.
3.  **main.ts**: Переписать `bootstrap`, чтобы использовать `initAppModule()`.

## 4. Рефакторинг модулей
1.  **UserAccountsModule**:
    - Зарегистрировать `UserAccountsConfig` в `providers`.
    - Обновить фабрики для `ACCESS_TOKEN_STRATEGY_INJECT_TOKEN` и `REFRESH_TOKEN_STRATEGY_INJECT_TOKEN`, чтобы они использовали `UserAccountsConfig`.
    - Обновить `JwtStrategy` и `NodemailerService`.
2.  **BloggersPlatformModule**:
    - Аналогично обновить `JwtModule` (если используется).

## 5. Очистка
- Удалить `src/common/config/config.ts`.
- Удалить все импорты `import { appConfig } from ...`.

## Преимущества этого подхода:
- **Fail-fast**: Если в `.env` ошибка (например, PORT не число), приложение выдаст понятную ошибку и не запустится.
- **Dependency Injection**: Конфиг — это обычный провайдер, его легко мокать в тестах.
- **Scoped**: Каждый модуль видит только свои настройки.
