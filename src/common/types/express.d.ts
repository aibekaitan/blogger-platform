// src/types/express.d.ts (создай файл в src/types/)
import { Request } from 'express';

declare module 'express' {
  interface Request {
    ip?: string; // или string | undefined
  }
}