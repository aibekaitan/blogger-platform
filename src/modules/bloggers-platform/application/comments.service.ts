import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
// import { CommentInputModel } from '../types/comments.dto.ts';

// import { PostQueryRepository } from '../../posts/repositories/post.query.repository';
import { CommentRepository } from '../infrastructure/comments.repository';

import { LikeStatus } from '../domain/like.entity';
import { CommentInputModel, CommentViewModel } from '../dto/comments.dto';
import { PostQueryRepository } from '../infrastructure/query-repo/posts.query.repository';

@Injectable()
export class CommentService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly postQueryRepository: PostQueryRepository,
  ) {}

  async getCommentById(
    commentId: string,
    currentUserId?: string,
  ): Promise<CommentViewModel | null> {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) return null;

    return this.postQueryRepository._getInViewComment(comment, currentUserId);
  }

  async delete(commentId: string, currentUserId: string): Promise<void> {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) throw new NotFoundException('Comment not found');

    if (comment.commentatorInfo.userId !== currentUserId) {
      throw new ForbiddenException('Forbidden: not your comment');
    }

    await this.commentRepository.delete(commentId);
  }

  async update(
    commentId: string,
    dto: CommentInputModel,
    currentUserId: string,
  ): Promise<void> {
    const comment = await this.commentRepository.findById(commentId);

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Самое важное — проверка владения
    if (comment.commentatorInfo.userId !== currentUserId) {
      throw new ForbiddenException(
        'Forbidden: you are not the owner of this comment',
      );
    }

    await this.commentRepository.update(commentId, dto);
  }

  async findById(commentId: string) {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) return false;

    return comment;
  }

  async setLikeStatus(
    commentId: string,
    userId: string,
    likeStatus: LikeStatus,
  ): Promise<void> {
    await this.commentRepository.setLikeStatus(commentId, userId, likeStatus);
  }
}
