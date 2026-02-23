import { Command } from '@nestjs/cqrs';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '../../../infrastructure/posts.repository';

export class DeletePostCommand extends Command<boolean> {
  constructor(public readonly postId: string) {
    super();
  }
}
@CommandHandler(DeletePostCommand)
export class DeletePostHandler implements ICommandHandler<
  DeletePostCommand,
  boolean
> {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(command: DeletePostCommand): Promise<boolean> {
    const { postId } = command;
    const deleteResult = await this.postRepository.delete(postId);
    return deleteResult.deletedCount === 1;
  }
}
