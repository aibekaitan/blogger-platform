// update-comment.command.ts
import { Command } from '@nestjs/cqrs';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CommentInputModel } from '../../../dto/input-dto/comment.input';
import { CommentRepository } from '../../../infrastructure/comments.repository';

export class UpdateCommentCommand extends Command<void> {
  constructor(
    public readonly commentId: string,
    public readonly dto: CommentInputModel,
    public readonly currentUserId: string,
  ) {
    super();
  }
}
@CommandHandler(UpdateCommentCommand)
export class UpdateCommentHandler implements ICommandHandler<
  UpdateCommentCommand,
  void
> {
  constructor(private readonly commentRepository: CommentRepository) {}

  async execute(command: UpdateCommentCommand): Promise<void> {
    const { commentId, dto, currentUserId } = command;

    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.commentatorInfo.userId !== currentUserId) {
      throw new ForbiddenException(
        'Forbidden: you are not the owner of this comment',
      );
    }

    await this.commentRepository.update(commentId, dto);
  }
}
