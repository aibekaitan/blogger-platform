// create-blog.command.ts

// create-blog.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { v4 as uuidv4 } from 'uuid';

import { Command } from '@nestjs/cqrs';
import { BlogsRepository } from '../../../infrastructure/blogs.repository';
import { BlogInputModel } from '../../../dto/input-dto/blog.input';
import { mapBlogToView } from '../../../api/middlewares/blog.mapper';

export class CreateBlogCommand extends Command<any> {
  // или конкретный ViewModel
  constructor(public readonly dto: BlogInputModel) {
    super();
  }
}

@CommandHandler(CreateBlogCommand)
export class CreateBlogHandler implements ICommandHandler<CreateBlogCommand> {
  constructor(private readonly blogsRepository: BlogsRepository) {}

  async execute(command: CreateBlogCommand) {
    const { dto } = command;

    const blog = {
      id: uuidv4(),
      name: dto.name,
      description: dto.description,
      websiteUrl: dto.websiteUrl,
      createdAt: new Date().toISOString(),
      isMembership: false,
    };

    const created = await this.blogsRepository.create(blog);
    return mapBlogToView(created); // или просто created, если mapper не обязателен
  }
}
