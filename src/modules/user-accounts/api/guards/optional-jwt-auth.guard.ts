// src/user-accounts/api/guards/optional-jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {  // ← используем 'jwt', а не 'optional-jwt'
  canActivate(context: ExecutionContext) {
    // Просто запускаем проверку, но ошибки игнорируем
    const result = super.canActivate(context);
    return result;
  }

  // Самое важное: перехватываем ошибку и возвращаем null вместо throw
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Если ошибка (нет токена, плохой токен) — НЕ кидаем, возвращаем null
    if (err || !user) {
      return null;
    }
    return user;
  }
}