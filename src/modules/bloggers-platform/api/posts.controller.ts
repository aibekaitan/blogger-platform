import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
// import { PostService } from '../domain/post.service';
// import { PostInputModel } from '../dto/post.input';
// import { IPagination } from '../../common/types/pagination';
import type { CommentsQueryFieldsType } from '../types/comments.queryFields.type';
import { PostType } from '../types/post';
import { PostService } from '../application/posts.service';
import { IPagination } from '../../../common/types/pagination';
import { PostInputModelType } from '../types/post.input.type';
import { CommentDB } from '../dto/comments.dto';
import { PostInputModel } from '../dto/input-dto/post.input';
import { mapPostToView } from './middlewares/posts.mapper';
// import { CommentDB } from '../../comments/types/comments.dto';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  async getAllPosts(@Query() query: any) {
    return this.postService.getAllPosts(query);
  }

  @Get(':id')
  async getPostById(@Param('id') id: string): Promise<any> {
    const post = mapPostToView(await this.postService.getPostById(id));
    if (!post)
      throw new NotFoundException({ message: 'Post not found', field: 'id' });
    return post;
  }

  @Post()
  async createPost(@Body() dto: PostInputModel): Promise<any> {
    // const blogName = dto.blogName || 'Unknown Blog';
    return this.postService.createPost(dto);
  }

  @Get(':postId/comments')
  async getCommentsByPostId(
    @Param('postId') postId: string,
    @Query() query: CommentsQueryFieldsType,
  ) {
    const post = await this.postService.getPostById(postId);
    if (!post)
      throw new NotFoundException({ message: 'Post not found', field: 'id' });
    return this.postService.getCommentsByPostId(postId, query);
  }
}
