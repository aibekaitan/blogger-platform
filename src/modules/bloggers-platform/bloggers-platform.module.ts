import { Module } from '@nestjs/common';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
// import { UsersExternalQueryRepository } from '../user-accounts/infrastructure/external-query/users.external-query-repository';
// import { UsersExternalService } from '../user-accounts/application/users.external-service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user-accounts/domain/user.entity';
import { UsersRepository } from '../user-accounts/infrastructure/users.repository';
import { Blog, BlogSchema } from './domain/blog.entity';
import { BcryptService } from '../user-accounts/adapters/bcrypt.service';
import { BlogsRepository } from './infrastructure/blogs.repository';
import { PostQueryRepository } from './infrastructure/query-repo/posts.query.repository';
import { CommentRepository } from './infrastructure/comments.repository';
// import { UsersController } from '../user-accounts/api/users.controller';
import { BlogsController } from './api/blogs.controller';
// import { CommentsController } from './api/comments.controller';
import { Post, PostSchema } from './domain/post.entity';
import { Comment, CommentSchema } from './domain/comment.entity';
import { Like, LikeSchema } from './domain/like.entity';
import { PostController } from './api/posts.controller';
import { PostRepository } from './infrastructure/posts.repository';
import { JwtStrategy } from '../user-accounts/strategies/jwt.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { appConfig } from '../../common/config/config';
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

//тут регистрируем провайдеры всех сущностей блоггерской платформы (blogs, posts, comments, etc...)
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Blog.name, schema: BlogSchema },
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Like.name, schema: LikeSchema },
    ]),
    UserAccountsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: appConfig.AC_SECRET,
      signOptions: { expiresIn: '5m' },
    }),
    CqrsModule,
  ],

  controllers: [BlogsController, PostController, CommentsController],
  providers: [
    // UsersExternalQueryRepository,
    // UsersExternalService,
    UsersRepository,
    BcryptService,
    BlogsRepository,
    PostQueryRepository,
    CommentRepository,
    PostRepository,
    JwtStrategy,

    CreateBlogHandler,
    UpdateBlogHandler,
    DeleteBlogHandler,
    CreatePostForBlogHandler,
    GetAllBlogsHandler,
    GetBlogByIdHandler,
    GetPostsByBlogIdHandler,
    BlogsRepository,

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
