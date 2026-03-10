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
import { BloggersPlatformModule } from './modules/bloggers-platform/bloggers-platform.module';

@Module({
  imports: [
    // ThrottlerModule.forRoot({
    //   throttlers: [
    //     {
    //       ttl: 10000,
    //       limit: 5,
    //     },
    //   ],
    // }),
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
          url: configService.get<string>('DATABASE_URL'),
          // host: configService.get('PG_HOST'),
          // port: +configService.get('PG_PORT') || 5432,
          // username: configService.get('PG_USER'),
          // password: configService.get('PG_PASSWORD'),
          // database: configService.get('PG_DATABASE'),

          autoLoadEntities: true,
          synchronize: true,
          logging: ['query', 'error'],
          ssl: true,
          extra: {
            ssl: {
              rejectUnauthorized: false,
            },
          },
        };
      },
      inject: [ConfigService],
    }),

    TestingModule,
    UserAccountsModule,
    BloggersPlatformModule,
    CoreModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
