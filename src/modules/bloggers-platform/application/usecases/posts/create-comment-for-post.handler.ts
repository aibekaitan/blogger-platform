// create-comment-for-post.command.ts
import { Command } from '@nestjs/cqrs';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { CommentViewModel } from '../../../dto/comments.dto';
import { CommentInputModel } from '../../../dto/input-dto/comment.input';
import { PostRepository } from '../../../infrastructure/posts.repository';
import { CommentRepository } from '../../../infrastructure/comments.repository';
import { PostQueryRepository } from '../../../infrastructure/query-repo/posts.query.repository';

export class CreateCommentForPostCommand extends Command<CommentViewModel> {
  constructor(
    public readonly postId: string,
    public readonly dto: CommentInputModel,
    public readonly userId: string,
  ) {
    super();
  }
}
@CommandHandler(CreateCommentForPostCommand)
export class CreateCommentForPostHandler implements ICommandHandler<
  CreateCommentForPostCommand,
  CommentViewModel
> {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly commentRepository: CommentRepository,
    private readonly postQueryRepository: PostQueryRepository,
  ) {}

  async execute(
    command: CreateCommentForPostCommand,
  ): Promise<CommentViewModel> {
    const { postId, dto, userId } = command;

    const post = await this.postRepository.findById(postId, userId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const createdComment = await this.commentRepository.create(
      dto,
      postId,
      userId,
    );
    return this.postQueryRepository._getInViewComment(createdComment, userId);
  }
}
