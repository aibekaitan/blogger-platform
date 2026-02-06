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
} from '@nestjs/common';
// import { CommentService } from '../domain/comments.service';
import type { Request } from 'express';
import { CommentViewModel } from '../dto/comments.dto';
import { CommentService } from '../application/comments.service';
// import { UpdateCommentDto } from '../api/input-dto/update-comment.dto';
// import { LikeStatusDto } from '../api/input-dto/like-status.dto';
// import { CommentViewDto } from '../api/view-dto/comment.view-dto';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentService: CommentService) {}

  @Get(':id')
  async getCommentById(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<CommentViewModel> {
    const currentUserId = req.user?.id; // TODO: if authorization added
    const comment = await this.commentService.getCommentById(id, currentUserId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    return comment;
  }

  /*
  @Delete(':id')
  @HttpCode(204)
  async deleteComment(@Param('id') id: string): Promise<void> {
    await this.commentService.delete(id);
  }


  @Put(':id')
  @HttpCode(204)
  async updateComment(
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
  ): Promise<void> {
    await this.commentService.update(id, dto);
  }


  @Put(':id/like-status')
  @HttpCode(204)
  async setLikeStatus(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: LikeStatusDto,
  ): Promise<void> {
    const userId = req.user!.id; // предполагаем, что есть авторизация
    await this.commentService.setLikeStatus(id, userId, dto.likeStatus);
  }*/
}
