import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TestingController } from './api/testing.controller';
import { TestingService } from './application/testing.service';
import {
  Blog,
  BlogSchema,
} from '../modules/bloggers-platform/domain/blog.entity';
import {
  Post,
  PostSchema,
} from '../modules/bloggers-platform/domain/post.entity';
import {
  Comment,
  CommentSchema,
} from '../modules/bloggers-platform/domain/comment.entity';
import { User, UserSchema } from '../modules/user-accounts/domain/user.entity';
import {
  Like,
  LikeSchema,
} from '../modules/bloggers-platform/domain/like.entity';

// Импортируем все нужные схемы

// ... остальные схемы

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Blog.name, schema: BlogSchema },
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: User.name, schema: UserSchema },
      { name: Like.name, schema: LikeSchema },
      // ... все остальные сущности, которые чистишь
    ]),
  ],
  controllers: [TestingController],
  providers: [TestingService],
  // Если хочешь использовать этот сервис где-то ещё — exports: [TestingService]
})
export class TestingModule {}
