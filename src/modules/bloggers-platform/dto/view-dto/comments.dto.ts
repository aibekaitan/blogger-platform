// src/bloggers-platform/types/comments.dto.ts
// или где у тебя enum LikeStatus

import { LikeStatus } from '../../domain/like.entity';

export interface CommentatorInfoView {
  userId: string;
  userLogin: string;
}

export interface LikesInfoViewModel {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatus; // 'Like' | 'Dislike' | 'None'
}

export interface CommentViewModel {
  id: string;
  content: string;
  commentatorInfo: CommentatorInfoView;
  createdAt: string;
  likesInfo: LikesInfoViewModel;
}