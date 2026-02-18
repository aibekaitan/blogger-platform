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

interface JwtUser {
  id: string; // userId из токена
  // deviceId?: string; // если нужно
}

@NoRateLimit()
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  // GET /posts — все посты с пагинацией (myStatus зависит от текущего юзера)
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  async getAllPosts(
    @Query() query: any,
    @CurrentUser() currentUser?: JwtUser | null,
  ): Promise<IPagination<any>> {
    // замени any на PostViewModel[]
    const userId = currentUser?.id ?? null;
    return this.postService.getAllPosts(query, userId);
  }

  // POST /posts — создание поста (только Basic Auth)
  @UseGuards(BasicAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPost(@Body() dto: PostInputModel) {
    const created = await this.postService.createPost(dto);
    return mapPostToView(created);
  }

  // GET /posts/:id — пост по id (myStatus опционально)
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

  // PUT /posts/:id — обновление поста (Basic Auth)
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

  // DELETE /posts/:id — удаление поста (Basic Auth)
  @UseGuards(BasicAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param('id') id: string): Promise<void> {
    const deleted = await this.postService.deletePost(id);
    if (!deleted) {
      throw new NotFoundException({ message: 'Post not found', field: 'id' });
    }
  }

  // GET /posts/:postId/comments — комментарии к посту (myStatus опционально)
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':postId/comments')
  async getCommentsByPostId(
    @Param('postId') postId: string,
    @Query() query: CommentsQueryFieldsType,
    @CurrentUser() currentUser?: JwtUser | null,
  ): Promise<IPagination<CommentViewModel[]>> {
    const userId = currentUser?.id ?? null;

    // Проверка существования поста (без userId, т.к. просто existence check)
    const post = await this.postService.getPostById(postId, null);
    if (!post) {
      throw new NotFoundException({
        message: 'Post not found',
        field: 'postId',
      });
    }

    return this.postService.getCommentsByPostId(postId, query, userId);
  }

  // POST /posts/:postId/comments — создание комментария (обязательный JWT)
  @UseGuards(JwtAuthGuard)
  @Post(':postId/comments')
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @Param('postId') postId: string,
    @Body() commentDto: { content: string }, // TODO: замени на CommentInputModel
    @CurrentUser() currentUser: JwtUser,
  ): Promise<CommentViewModel> {
    // currentUser гарантированно есть (JwtAuthGuard)
    const createdComment = await this.postService.createComment(
      postId,
      commentDto,
      currentUser.id,
    );
    return createdComment; // предполагаем, что сервис возвращает view
  }

  // PUT /posts/:postId/like-status — лайк/дизлайк (обязательный JWT)
  @UseGuards(JwtAuthGuard)
  @Put(':postId/like-status')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateLikeStatus(
    @Param('postId') postId: string,
    @Body() likeDto: LikeStatusInputModel,
    @CurrentUser() currentUser: JwtUser,
  ): Promise<void> {
    const updated = await this.postService.updateLikeStatus(
      postId,
      currentUser.id,
      likeDto.likeStatus,
    );

    if (!updated) {
      throw new NotFoundException({
        message: 'Post not found',
        field: 'postId',
      });
    }
  }
}
