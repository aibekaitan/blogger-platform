import { Module } from '@nestjs/common';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { BlogsService } from './application/blogs.service';
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
import { CommentService } from './application/comments.service';
// import { UsersController } from '../user-accounts/api/users.controller';
import { BlogsController } from './api/blogs.controller';
// import { CommentsController } from './api/comments.controller';
import { Post, PostSchema } from './domain/post.entity';
import { Comment, CommentSchema } from './domain/comment.entity';
import { Like, LikeSchema } from './domain/like.entity';
import { PostController } from './api/posts.controller';
import { PostRepository } from './infrastructure/posts.repository';
import { PostService } from './application/posts.service';
import { OptionalJwtStrategy } from '../user-accounts/strategies/optional-jwt.strategy';
import { JwtStrategy } from '../user-accounts/strategies/jwt.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { appConfig } from '../../common/config/config';
import { CommentsController } from './api/comments.controller';

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
      signOptions: { expiresIn: '5m' }, // как в задании — минимум 5 минут
    }),
  ],

  controllers: [BlogsController, PostController, CommentsController],
  providers: [
    BlogsService,
    // UsersExternalQueryRepository,
    // UsersExternalService,
    UsersRepository,
    BcryptService,
    BlogsRepository,
    PostQueryRepository,
    CommentRepository,
    CommentService,
    PostRepository,
    PostService,
    OptionalJwtStrategy,
    JwtStrategy,
  ],
})
export class BloggersPlatformModule {}
