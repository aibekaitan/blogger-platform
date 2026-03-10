import { Command } from '@nestjs/cqrs';
import { PostInputModel } from '../../../dto/input-dto/post.input';
// update-post-for-blog.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '../../../infrastructure/posts.repository';
import { UpdatePostForBlogDto } from '../../../dto/input-dto/update.post.for.blog.dto';
export class UpdatePostForBlogCommand extends Command<boolean> {
  constructor(
    public readonly blogId: string,
    public readonly postId: string,
    public readonly dto: UpdatePostForBlogDto,
  ) {
    super();
  }
}
@CommandHandler(UpdatePostForBlogCommand)
export class UpdatePostForBlogHandler implements ICommandHandler<
  UpdatePostForBlogCommand,
  boolean
> {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(command: UpdatePostForBlogCommand): Promise<boolean> {
    const { blogId, postId, dto } = command;

    const post = await this.postRepository.findOneByIds(blogId, postId);
    if (!post) return false;

    post.updateContent(dto.title, dto.shortDescription, dto.content);
    await this.postRepository.save(post);
    return true;
  }
}
