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
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { PostInputModel } from '../dto/input-dto/post.input';
import { LikeStatusInputModel } from '../dto/input-dto/like-status.input';
import { CommentInputModel } from '../dto/input-dto/comment.input';
import type { CommentsQueryFieldsType } from '../types/comments.queryFields.type';
import { IPagination } from '../../../common/types/pagination';
import { CommentViewModel } from '../dto/comments.dto';

import { NoRateLimit } from '../../../common/decorators/no-rate-limit.decorator';
import { BasicAuthGuard } from '../../user-accounts/api/guards/basic-auth.guard';
import { JwtAuthGuard } from '../../user-accounts/api/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../user-accounts/api/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

import { mapPostToView } from './middlewares/posts.mapper';
import { GetAllPostsQuery } from '../application/usecases/posts/get-all-posts.handler';
import { CreatePostCommand } from '../application/usecases/posts/create-post.handler';
import { GetPostByIdQuery } from '../application/usecases/posts/get-post-by-id.handler';
import { UpdatePostCommand } from '../application/usecases/posts/update-post.handler';
import { DeletePostCommand } from '../application/usecases/posts/delete-post.handler';
import { GetCommentsByPostIdQuery } from '../application/usecases/posts/get-comments-by-post-id.handler';
import { CreateCommentForPostCommand } from '../application/usecases/posts/create-comment-for-post.handler';
import { UpdateLikeStatusCommand } from '../application/usecases/posts/update-like-status.handler';

export interface JwtUser {
  id: string;
  // deviceId?: string;
}

@NoRateLimit()
@Controller('posts')
export class PostController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  async getAllPosts(
    @Query() query: any,
    @CurrentUser() currentUser?: JwtUser | null,
  ): Promise<IPagination<any>> {
    const userId = currentUser?.id ?? null;

    return this.queryBus.execute(new GetAllPostsQuery(query, userId));
  }

  @UseGuards(BasicAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPost(@Body() dto: PostInputModel) {
    const created = await this.commandBus.execute(new CreatePostCommand(dto));
    return mapPostToView(created);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  async getPostById(
    @Param('id') id: string,
    @CurrentUser() currentUser?: JwtUser | null,
  ) {
    const userId = currentUser?.id ?? null;

    const post = await this.queryBus.execute(new GetPostByIdQuery(id, userId));

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
    const updated = await this.commandBus.execute(
      new UpdatePostCommand(id, dto),
    );

    if (!updated) {
      throw new NotFoundException({ message: 'Post not found', field: 'id' });
    }
  }

  @UseGuards(BasicAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param('id') id: string): Promise<void> {
    const deleted = await this.commandBus.execute(new DeletePostCommand(id));

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

    // Проверяем существование поста (можно через GetPostByIdQuery)
    const post = await this.queryBus.execute(
      new GetPostByIdQuery(postId, null), // null — без userId для проверки существования
    );

    if (!post) {
      throw new NotFoundException({
        message: 'Post not found',
        field: 'postId',
      });
    }

    return this.queryBus.execute(
      new GetCommentsByPostIdQuery(postId, query, userId),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':postId/comments')
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @Param('postId') postId: string,
    @Body() commentDto: CommentInputModel,
    @CurrentUser() currentUser: JwtUser,
  ): Promise<CommentViewModel> {
    return this.commandBus.execute(
      new CreateCommentForPostCommand(postId, commentDto, currentUser.id),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put(':postId/like-status')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateLikeStatus(
    @Param('postId') postId: string,
    @Body() likeDto: LikeStatusInputModel,
    @CurrentUser() currentUser: JwtUser,
  ): Promise<void> {
    await this.commandBus.execute(
      new UpdateLikeStatusCommand(postId, currentUser.id, likeDto.likeStatus),
    );
  }
}
