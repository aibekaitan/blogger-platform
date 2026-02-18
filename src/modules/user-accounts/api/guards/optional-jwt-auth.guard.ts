// src/user-accounts/api/guards/optional-jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('optional-jwt') {
  canActivate(context: ExecutionContext) {
    // Просто вызываем базовый guard, но НЕ кидаем ошибку
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // Если ошибка (нет токена / плохой токен) — просто возвращаем null
    if (err || !user) {
      return null;
    }
    return user;
  }
}