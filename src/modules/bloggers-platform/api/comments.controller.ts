import {
  Controller,
  Get,
  Param,
  Delete,
  Put,
  Body,
  HttpCode,
  Req,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
// import { CommentService } from '../domain/comments.service';
import type { Request } from 'express';
import { CommentViewModel } from '../dto/comments.dto';
import { CommentService } from '../application/comments.service';
import { NoRateLimit } from '../../../common/decorators/no-rate-limit.decorator';
import { JwtAuthGuard } from '../../user-accounts/api/guards/jwt-auth.guard';
import { LikeStatusInputModel } from '../dto/input-dto/like-status.input';
import { CommentInputModel } from '../dto/input-dto/comment.input';
@NoRateLimit()
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentService: CommentService) {}

  @Get(':id')
  async getCommentById(
    @Param('id') id: string,
    @Req() req,
  ): Promise<CommentViewModel> {
    const currentUserId = req.user?.id; // TODO: if authorization added
    const comment = await this.commentService.getCommentById(id, currentUserId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    return comment;
  }
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(204)
  async deleteComment(@Param('id') id: string): Promise<void> {
    await this.commentService.delete(id);
  }
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @HttpCode(204)
  async updateComment(
    @Param('id') id: string,
    @Body() dto: CommentInputModel,
  ): Promise<void> {
    await this.commentService.update(id, dto);
  }
  @UseGuards(JwtAuthGuard)
  @Put(':id/like-status')
  @HttpCode(204)
  async setLikeStatus(
    @Param('id') id: string,
    @Req() req,
    @Body() dto: LikeStatusInputModel,
  ): Promise<void> {
    const userId = req.user!.id; // предполагаем, что есть авторизация
    await this.commentService.setLikeStatus(id, userId, dto.likeStatus);
  }
}
