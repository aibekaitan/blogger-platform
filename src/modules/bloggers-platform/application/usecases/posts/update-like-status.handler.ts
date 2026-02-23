// update-like-status.command.ts
import { Command } from '@nestjs/cqrs';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PostRepository } from '../../../infrastructure/posts.repository';
import { LikeStatus } from '../../../dto/input-dto/like-status.input';

export class UpdateLikeStatusCommand extends Command<boolean | void> {
  constructor(
    public readonly postId: string,
    public readonly userId: string,
    public readonly likeStatus: LikeStatus,
  ) {
    super();
  }
}
@CommandHandler(UpdateLikeStatusCommand)
export class UpdateLikeStatusHandler implements ICommandHandler<
  UpdateLikeStatusCommand,
  boolean | void
> {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(command: UpdateLikeStatusCommand): Promise<boolean | void> {
    const { postId, userId, likeStatus } = command;

    const post = await this.postRepository.findById(postId, userId);
    if (!post) {
      throw new NotFoundException({
        message: 'Post not found',
        field: 'postId',
      });
    }

    return this.postRepository.setLikeStatus(postId, userId, likeStatus);
  }
}
