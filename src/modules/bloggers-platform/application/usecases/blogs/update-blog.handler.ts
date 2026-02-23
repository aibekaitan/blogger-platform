// update-blog.command.ts

// update-blog.handler.ts
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogInputModel } from '../../../dto/input-dto/blog.input';
import { BlogsRepository } from '../../../infrastructure/blogs.repository';

export class UpdateBlogCommand extends Command<boolean> {
  constructor(
    public readonly id: string,
    public readonly dto: BlogInputModel,
  ) {
    super();
  }
}

@CommandHandler(UpdateBlogCommand)
export class UpdateBlogHandler implements ICommandHandler<
  UpdateBlogCommand,
  boolean
> {
  constructor(private readonly blogsRepository: BlogsRepository) {}

  async execute(command: UpdateBlogCommand): Promise<boolean> {
    const { id, dto } = command;

    const blog = await this.blogsRepository.findOrNotFoundFail(id);

    blog.name = dto.name;
    blog.description = dto.description;
    blog.websiteUrl = dto.websiteUrl;

    await this.blogsRepository.save(blog);
    return true;
  }
}
