// src/common/decorators/no-rate-limit.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const NO_RATE_LIMIT_KEY = 'noRateLimit';
export const NoRateLimit = () => SetMetadata(NO_RATE_LIMIT_KEY, true);