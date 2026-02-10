// src/bloggers-platform/types/post.view.ts

import { PostDocument } from '../domain/post.entity';
import { LikeStatus } from '../domain/like.entity';

export class ExtendedLikesInfoView {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatus;
  newestLikes: Array<{
    addedAt: string;
    userId: string;
    login: string;
  }>;
}

export class PostViewModel {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
  extendedLikesInfo: ExtendedLikesInfoView;
}
