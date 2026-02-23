// delete-comment.command.ts
import { Command } from '@nestjs/cqrs';

// delete-comment.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CommentRepository } from '../../../infrastructure/comments.repository';
export class DeleteCommentCommand extends Command<void> {
  constructor(
    public readonly commentId: string,
    public readonly currentUserId: string,
  ) {
    super();
  }
}
@CommandHandler(DeleteCommentCommand)
export class DeleteCommentHandler implements ICommandHandler<
  DeleteCommentCommand,
  void
> {
  constructor(private readonly commentRepository: CommentRepository) {}

  async execute(command: DeleteCommentCommand): Promise<void> {
    const { commentId, currentUserId } = command;

    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.commentatorInfo.userId !== currentUserId) {
      throw new ForbiddenException('Forbidden: not your comment');
    }

    await this.commentRepository.delete(commentId);
  }
}
