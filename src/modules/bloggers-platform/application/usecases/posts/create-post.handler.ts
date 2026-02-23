// create-post.command.ts
import { Command } from '@nestjs/cqrs';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { BlogsRepository } from '../../../infrastructure/blogs.repository';
import { PostInputModel } from '../../../dto/input-dto/post.input';
import { PostRepository } from '../../../infrastructure/posts.repository';
import { mapPostToView } from '../../../api/middlewares/posts.mapper';

export class CreatePostCommand extends Command<any> {
  // или PostViewModel
  constructor(public readonly dto: PostInputModel) {
    super();
  }
}
@CommandHandler(CreatePostCommand)
export class CreatePostHandler implements ICommandHandler<CreatePostCommand> {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly blogsRepository: BlogsRepository,
  ) {}

  async execute(command: CreatePostCommand) {
    const { dto } = command;

    const blog = await this.blogsRepository.findById(dto.blogId);
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    const createdPost = await this.postRepository.create(dto, blog.name);
    return mapPostToView(createdPost);
  }
}
