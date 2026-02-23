// update-post.command.ts
import { Command } from '@nestjs/cqrs';

export class UpdatePostCommand extends Command<boolean> {
  constructor(
    public readonly postId: string,
    public readonly dto: PostInputModel,
  ) {
    super();
  }
}
// update-post.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { BlogsRepository } from '../../../infrastructure/blogs.repository';
import { PostInputModel } from '../../../dto/input-dto/post.input';
import { PostRepository } from '../../../infrastructure/posts.repository';

@CommandHandler(UpdatePostCommand)
export class UpdatePostHandler implements ICommandHandler<
  UpdatePostCommand,
  boolean
> {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly blogsRepository: BlogsRepository,
  ) {}

  async execute(command: UpdatePostCommand): Promise<boolean> {
    const { postId, dto } = command;

    const blog = await this.blogsRepository.findById(dto.blogId);
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    const updateResult = await this.postRepository.update(postId, dto);
    return updateResult.matchedCount === 1;
  }
}
