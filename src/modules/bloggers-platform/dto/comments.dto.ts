


import { LikeStatus } from '../domain/like.entity';

export class CommentInputModel {
  content: string;
}


export class CommentViewModel {
  id: string;
  content: string;
  commentatorInfo: CommentatorInfo;
  createdAt: string;
  likesInfo: LikesInfoViewModel;
}


export class LikesInfoViewModel {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatus;
}

export interface CommentDB {
  id: string;
  postId: string;
  content: string;
  commentatorInfo: CommentatorInfo;
  createdAt: string;
}


export interface CommentatorInfo {
  userId: string;
  userLogin?: string;
}


export interface LoginSuccessViewModel {
  accessToken: string;
}

export interface MeViewModel {
  email: string;
  login: string;
  userId: string;
}
