

// DTO для обновления/создания комментария
import { LikeStatus } from '../domain/like.entity';

export class CommentInputModel {
  content: string;
}

// Модель для ответа клиенту
export class CommentViewModel {
  id: string;
  content: string;
  commentatorInfo: CommentatorInfo;
  createdAt: string;
  likesInfo: LikesInfoViewModel;
}

// Информация о лайках
export class LikesInfoViewModel {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatus;
}

// Тип для внутреннего хранения в БД
export interface CommentDB {
  id: string;
  postId: string;
  content: string;
  commentatorInfo: CommentatorInfo;
  createdAt: string;
}

// Информация о комментаторе
export interface CommentatorInfo {
  userId: string;
  userLogin?: string;
}

// Дополнительные модели (если нужны)
export interface LoginSuccessViewModel {
  accessToken: string;
}

export interface MeViewModel {
  email: string;
  login: string;
  userId: string;
}
