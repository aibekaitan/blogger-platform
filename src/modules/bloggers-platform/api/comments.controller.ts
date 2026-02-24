import {
  Controller,
  Get,
  Param,
  Delete,
  Put,
  Body,
  HttpCode,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { CommentViewModel } from '../dto/comments.dto';
import { CommentInputModel } from '../dto/input-dto/comment.input';
import { LikeStatusInputModel } from '../dto/input-dto/like-status.input';

import { NoRateLimit } from '../../../common/decorators/no-rate-limit.decorator';
import { JwtAuthGuard } from '../../user-accounts/api/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../user-accounts/api/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { GetCommentByIdQuery } from '../application/usecases/comments/get-comment-by-id.handler';
import { DeleteCommentCommand } from '../application/usecases/comments/delete-comment.handler';
import { UpdateCommentCommand } from '../application/usecases/comments/update-comment.handler';
import { SetLikeStatusCommand } from '../application/usecases/comments/set-like-status.handler';


@NoRateLimit()
@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  async getCommentById(
    @Param('id') id: string,
    @CurrentUser() currentUser?: { id: string } | null,
  ): Promise<CommentViewModel> {
    const currentUserId = currentUser?.id ?? undefined;

    const comment = await this.queryBus.execute(
      new GetCommentByIdQuery(id, currentUserId),
    );

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(204)
  async deleteComment(
    @Param('id') id: string,
    @CurrentUser() currentUser: { id: string },
  ): Promise<void> {
    await this.commandBus.execute(new DeleteCommentCommand(id, currentUser.id));
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @HttpCode(204)
  async updateComment(
    @Param('id') id: string,
    @Body() dto: CommentInputModel,
    @CurrentUser() currentUser: { id: string; login: string },
  ): Promise<void> {
    await this.commandBus.execute(
      new UpdateCommentCommand(id, dto, currentUser.id),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/like-status')
  @HttpCode(204)
  async setLikeStatus(
    @Param('id') id: string,
    @CurrentUser() currentUser: { id: string },
    @Body() dto: LikeStatusInputModel,
  ): Promise<void> {
    await this.commandBus.execute(
      new SetLikeStatusCommand(id, currentUser.id, dto.likeStatus),
    );
  }
}
