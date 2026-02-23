import { Command } from '@nestjs/cqrs';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { CreatePostForBlogInputModel } from '../../../dto/input-dto/create-post-for-blog.input';
import { BlogsRepository } from '../../../infrastructure/blogs.repository';

export class CreatePostForBlogCommand extends Command<any> {
  // тип поста
  constructor(
    public readonly blogId: string,
    public readonly dto: CreatePostForBlogInputModel,
  ) {
    super();
  }
}

@CommandHandler(CreatePostForBlogCommand)
export class CreatePostForBlogHandler implements ICommandHandler<CreatePostForBlogCommand> {
  constructor(private readonly blogsRepository: BlogsRepository) {}

  async execute(command: CreatePostForBlogCommand) {
    const { blogId, dto } = command;

    const blog = await this.blogsRepository.findById(blogId);
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    return this.blogsRepository.createPostByBlogId(blog, dto);
  }
}
