import { Command } from '@nestjs/cqrs';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '../../../infrastructure/posts.repository';
export class DeletePostForBlogCommand extends Command<boolean> {
  constructor(
    public readonly blogId: string,
    public readonly postId: string,
  ) {
    super();
  }
}
@CommandHandler(DeletePostForBlogCommand)
export class DeletePostForBlogHandler implements ICommandHandler<
  DeletePostForBlogCommand,
  boolean
> {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(command: DeletePostForBlogCommand): Promise<boolean> {
    const { blogId, postId } = command;

    const post = await this.postRepository.findOneByIds(blogId, postId);

    if (!post) return false;

    const deleted = await this.postRepository.delete(postId);
    return deleted;
  }
}
