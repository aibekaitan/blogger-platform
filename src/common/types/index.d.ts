import { Request } from 'express';
import { IdType } from './id';
import { CommentInputModel } from '../../comments/types/comment.input.model';

declare global {
  namespace Express {
    export interface Request {
      user?: IdType;

      comment?: CommentInputModel;

      device?: {
        id: string;
      };

      context?: {
        userId?: string;
        deviceId?: string;
        ip?: string;
        // role?: string;
        // sessionId?: string;
      };
    }
  }
}
