// set-like-status.command.ts
import { Command } from '@nestjs/cqrs';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { CommentRepository } from '../../../infrastructure/comments.repository';
import { LikeStatus } from '../../../dto/input-dto/like-status.input';

export class SetLikeStatusCommand extends Command<void> {
  constructor(
    public readonly commentId: string,
    public readonly userId: string,
    public readonly likeStatus: LikeStatus,
  ) {
    super();
  }
}

@CommandHandler(SetLikeStatusCommand)
export class SetLikeStatusHandler implements ICommandHandler<
  SetLikeStatusCommand,
  void
> {
  constructor(private readonly commentRepository: CommentRepository) {}

  async execute(command: SetLikeStatusCommand): Promise<void> {
    const { commentId, userId, likeStatus } = command;

    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    await this.commentRepository.setLikeStatus(commentId, userId, likeStatus);
  }
}
