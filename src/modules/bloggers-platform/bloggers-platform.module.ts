import { Module } from '@nestjs/common';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { UsersRepository } from '../user-accounts/infrastructure/users.repository';
import { BcryptService } from '../user-accounts/adapters/bcrypt.service';
import { BlogsRepository } from './infrastructure/blogs.repository';
import { PostQueryRepository } from './infrastructure/query-repo/posts.query.repository';
import { CommentsQueryRepository } from './infrastructure/query-repo/comments.query.repository';
import { CommentRepository } from './infrastructure/comments.repository';
import { BlogsController } from './api/blogs.controller';
import { Like } from './domain/like.entity';
import { PostController } from './api/posts.controller';
import { PostRepository } from './infrastructure/posts.repository';
import { JwtStrategy } from '../user-accounts/strategies/jwt.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { CommentsController } from './api/comments.controller';
import { CreateBlogHandler } from './application/usecases/blogs/create-blog.handler';
import { UpdateBlogHandler } from './application/usecases/blogs/update-blog.handler';
import { DeleteBlogHandler } from './application/usecases/blogs/delete-blog.handler';
import { CreatePostForBlogHandler } from './application/usecases/blogs/create-post-for-blog.handler';
import { GetAllBlogsHandler } from './application/usecases/blogs/get-all-blogs.handler';
import { GetBlogByIdHandler } from './application/usecases/blogs/get-blog-by-id.handler';
import { GetPostsByBlogIdHandler } from './application/usecases/blogs/get-posts-by-blog-id.handler';
import { GetCommentByIdHandler } from './application/usecases/comments/get-comment-by-id.handler';
import { DeleteCommentHandler } from './application/usecases/comments/delete-comment.handler';
import { UpdateCommentHandler } from './application/usecases/comments/update-comment.handler';
import { SetLikeStatusHandler } from './application/usecases/comments/set-like-status.handler';
import { UpdatePostHandler } from './application/usecases/posts/update-post.handler';
import { CreatePostHandler } from './application/usecases/posts/create-post.handler';
import { DeletePostHandler } from './application/usecases/posts/delete-post.handler';
import { CreateCommentForPostHandler } from './application/usecases/posts/create-comment-for-post.handler';
import { UpdateLikeStatusHandler } from './application/usecases/posts/update-like-status.handler';
import { GetAllPostsHandler } from './application/usecases/posts/get-all-posts.handler';
import { GetPostByIdHandler } from './application/usecases/posts/get-post-by-id.handler';
import { GetCommentsByPostIdHandler } from './application/usecases/posts/get-comments-by-post-id.handler';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Blog } from './domain/blog.entity';
import { Post } from './domain/post.entity';
import { User } from '../user-accounts/domain/user.entity';
import { Comment } from './domain/comment.entity';
import { SaBlogsController } from './api/sa.blogs.controller';
import { UpdatePostForBlogHandler } from './application/usecases/blogs/update-post-for-blog.handler';
import { DeletePostForBlogHandler } from './application/usecases/blogs/delete-post-for-blog.handler';

@Module({
  imports: [
    TypeOrmModule.forFeature([Blog, Post, User, Comment, Like]),
    UserAccountsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // JwtModule.registerAsync({
    //   imports: [UserAccountsConfigModule],
    //   useFactory: (config: UserAccountsConfig) => ({
    //     secret: config.accessTokenSecret,
    //     signOptions: { expiresIn: config.accessTokenExpireIn as any },
    //   }),
    //   inject: [UserAccountsConfig],
    // }),
    CqrsModule,
  ],

  controllers: [
    BlogsController,
    SaBlogsController,
    PostController,
    CommentsController,
  ],
  providers: [
    UsersRepository,
    BcryptService,
    BlogsRepository,
    PostQueryRepository,
    CommentsQueryRepository,
    CommentRepository,
    PostRepository,
    // JwtStrategy,

    CreateBlogHandler,
    UpdateBlogHandler,
    DeleteBlogHandler,
    CreatePostForBlogHandler,
    GetAllBlogsHandler,
    GetBlogByIdHandler,
    GetPostsByBlogIdHandler,
    UpdatePostForBlogHandler,
    DeletePostForBlogHandler,

    GetCommentByIdHandler,
    DeleteCommentHandler,
    UpdateCommentHandler,
    SetLikeStatusHandler,

    CreatePostHandler,
    UpdatePostHandler,
    DeletePostHandler,
    CreateCommentForPostHandler,
    UpdateLikeStatusHandler,
    GetAllPostsHandler,
    GetPostByIdHandler,
    GetCommentsByPostIdHandler,
  ],
})
export class BloggersPlatformModule {}
