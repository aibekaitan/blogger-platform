import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  HttpStatus,
  NotFoundException,
  Put,
  HttpCode,
  Delete,
  UseGuards,
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
import { NoRateLimit } from '../../../common/decorators/no-rate-limit.decorator';
import { JwtAuthGuard } from '../../user-accounts/api/guards/jwt-auth.guard';
import { BasicAuthGuard } from '../../user-accounts/adapters/basic-auth.guard';
// import { CommentDB } from '../../comments/types/comments.dto';
@NoRateLimit()
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  async getAllPosts(@Query() query: any) {
    return this.postService.getAllPosts(query);
  }

  @Get(':id')
  async getPostById(@Param('id') id: string): Promise<any> {
    const post = await this.postService.getPostById(id);
    if (!post)
      throw new NotFoundException({ message: 'Post not found', field: 'id' });
    return post;
  }
  @UseGuards(BasicAuthGuard)
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
  @UseGuards(BasicAuthGuard)
  @Put(':id')
  @HttpCode(204)
  async updatePost(
    @Param('id') id: string,
    @Body() updatePostDto: PostInputModel,
  ): Promise<void> {
    const isUpdated = await this.postService.updatePost(id, updatePostDto);

    if (!isUpdated) {
      throw new NotFoundException({
        message: 'Post not found',
        field: 'id',
      });
    }
  }
  @UseGuards(BasicAuthGuard)
  @Delete(':id')
  @HttpCode(204)
  async deletePost(@Param('id') id: string): Promise<void> {
    const isDeleted = await this.postService.deletePost(id);

    if (!isDeleted) {
      throw new NotFoundException({
        message: 'Post not found',
        field: 'id',
      });
    }
  }
}
