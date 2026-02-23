// delete-blog.command.ts
import { Command } from '@nestjs/cqrs';

// delete-blog.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsRepository } from '../../../infrastructure/blogs.repository';

export class DeleteBlogCommand extends Command<boolean> {
  constructor(public readonly id: string) {
    super();
  }
}
@CommandHandler(DeleteBlogCommand)
export class DeleteBlogHandler implements ICommandHandler<
  DeleteBlogCommand,
  boolean
> {
  constructor(private readonly blogsRepository: BlogsRepository) {}

  async execute(command: DeleteBlogCommand): Promise<boolean> {
    const { id } = command;
    return this.blogsRepository.delete(id);
  }
}
