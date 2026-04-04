import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';
import { CoreModule } from './core/core.module';
import { TestingModule } from './testing/testing.module';
import { BloggersPlatformModule } from './modules/bloggers-platform/bloggers-platform.module';
import { configModule } from './config-dynamic-module';
import { CoreConfig } from './core/core.config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    configModule,
    CoreModule, //запускает конфиг вообще везде за счет @Global
    // ThrottlerModule.forRoot([
    //   {
    //     ttl: 10000, // 10 секунд
    //     limit: 5, // максимум 5 запросов
    //   },
    // ]),
    TypeOrmModule.forRootAsync({
      useFactory: (coreConfig: CoreConfig) => {
        return {
          type: 'postgres' as const,
          //запуск нашего бд
          url: coreConfig.databaseUrl,
          autoLoadEntities: true,
          synchronize: true, // Надо быть осторожным в продакшене
          logging:
            coreConfig.env === 'development' ? ['query', 'error'] : ['error'],
          ssl: true,
          extra: {
            ssl: {
              rejectUnauthorized: false,
            },
          },
        };
      },
      inject: [CoreConfig],
    }),
    UserAccountsModule,
    BloggersPlatformModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // {
    //   provide: APP_GUARD,
    //   useClass: ThrottlerGuard, // применяется глобально
    // },
  ],
})
export class AppModule {
  /**
   * Статический метод для динамической настройки модуля.
   * Здесь мы можем решать, какие модули подключать на основе конфига.
   */
  static forRoot(coreConfig: CoreConfig): DynamicModule {
    const imports = [
      ...(coreConfig.includeTestingModule ? [TestingModule] : []),
    ];

    return {
      module: AppModule,
      imports: imports,
    };
  }
}
