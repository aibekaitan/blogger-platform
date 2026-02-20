import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PostService } from '../application/posts.service';
import { PostInputModel } from '../dto/input-dto/post.input';
import { LikeStatusInputModel } from '../dto/input-dto/like-status.input';
// import { CommentInputModel } from '../dto/input-dto/comment.input'; // создай этот DTO ниже
import { mapPostToView } from './middlewares/posts.mapper';
import { NoRateLimit } from '../../../common/decorators/no-rate-limit.decorator';
import { BasicAuthGuard } from '../../user-accounts/api/guards/basic-auth.guard';
import { JwtAuthGuard } from '../../user-accounts/api/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../user-accounts/api/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { CommentsQueryFieldsType } from '../types/comments.queryFields.type';
import { IPagination } from '../../../common/types/pagination';
import { CommentViewModel } from '../dto/comments.dto';
import { CommentInputModel } from '../dto/input-dto/comment.input';

export interface JwtUser {
  id: string;
  // deviceId?: string;
}

@NoRateLimit()
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}


  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  async getAllPosts(
    @Query() query: any,
    @CurrentUser() currentUser?: JwtUser | null,
  ): Promise<IPagination<any>> {
    console.log(currentUser);

    const userId = currentUser?.id ?? null;
    return this.postService.getAllPosts(query, userId);
  }


  @UseGuards(BasicAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPost(@Body() dto: PostInputModel) {
    const created = await this.postService.createPost(dto);
    return mapPostToView(created);
  }


  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  async getPostById(
    @Param('id') id: string,
    @CurrentUser() currentUser?: JwtUser | null,
  ) {
    const userId = currentUser?.id ?? null;
    const post = await this.postService.getPostById(id, userId);
    if (!post) {
      throw new NotFoundException({ message: 'Post not found', field: 'id' });
    }
    return mapPostToView(post);
  }


  @UseGuards(BasicAuthGuard)
  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(
    @Param('id') id: string,
    @Body() dto: PostInputModel,
  ): Promise<void> {
    const updated = await this.postService.updatePost(id, dto);
    if (!updated) {
      throw new NotFoundException({ message: 'Post not found', field: 'id' });
    }
  }


  @UseGuards(BasicAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param('id') id: string): Promise<void> {
    const deleted = await this.postService.deletePost(id);
    if (!deleted) {
      throw new NotFoundException({ message: 'Post not found', field: 'id' });
    }
  }


  @UseGuards(OptionalJwtAuthGuard)
  @Get(':postId/comments')
  async getCommentsByPostId(
    @Param('postId') postId: string,
    @Query() query: CommentsQueryFieldsType,
    @CurrentUser() currentUser?: JwtUser | null,
  ): Promise<IPagination<CommentViewModel[]>> {
    const userId = currentUser?.id ?? null;


    const post = await this.postService.getPostById(postId, null);
    if (!post) {
      throw new NotFoundException({
        message: 'Post not found',
        field: 'postId',
      });
    }

    return this.postService.getCommentsByPostId(postId, query, userId);
  }


  @UseGuards(JwtAuthGuard)
  @Post(':postId/comments')
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @Param('postId') postId: string,
    @Body() commentDto: CommentInputModel,
    @CurrentUser() currentUser: JwtUser,
  ): Promise<CommentViewModel> {
    const createdComment = await this.postService.createComment(
      postId,
      commentDto,
      currentUser.id,
    );
    return createdComment;
  }

  @UseGuards(JwtAuthGuard)
  @Put(':postId/like-status')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateLikeStatus(
    @Param('postId') postId: string,
    @Body() likeDto: LikeStatusInputModel,
    @CurrentUser() currentUser: JwtUser,
  ): Promise<void> {
    await this.postService.updateLikeStatus(
      postId,
      currentUser.id,
      likeDto.likeStatus,
    );
  }
}
