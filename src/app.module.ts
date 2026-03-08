import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';
// import { TestingModule } from './modules/testing/testing.module';
// import { BloggersPlatformModule } from './modules/bloggers-platform/bloggers-platform.module';
import { CoreModule } from './core/core.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { TestingModule } from './testing/testing.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 10, // 60 секунд
        limit: 5, // глобально 10 req/min
      },
      {
        name: 'resend', // отдельный трекер
        ttl: 60,
        limit: 2, // всего 2 resend в минуту
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        // const isProd = configService.get('NODE_ENV') === 'production';

        return {
          type: 'postgres' as const,
          url: configService.get<string>('DATABASE_URL'), // ← сюда всю строку от Neon
          // или отдельно (если хочешь):
          // host: configService.get('PG_HOST'),
          // port: +configService.get('PG_PORT') || 5432,
          // username: configService.get('PG_USER'),
          // password: configService.get('PG_PASSWORD'),
          // database: configService.get('PG_DATABASE'),

          autoLoadEntities: true, // автоматически подтянет все @Entity()
          synchronize: true, // в продакшене → false!!! (используй миграции)
          logging: ['query', 'error'], // или true для отладки
          ssl: true, // Neon требует SSL
          extra: {
            ssl: {
              rejectUnauthorized: false, // важно для Neon (сертификат самоподписанный)
            },
          },
        };
      },
      inject: [ConfigService],
    }),

    TestingModule,
    UserAccountsModule,
    // BloggersPlatformModule,
    CoreModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
