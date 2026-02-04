import { Module } from '@nestjs/common';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { BlogsService } from './blogs.service';
import { UsersExternalQueryRepository } from '../user-accounts/infrastructure/external-query/users.external-query-repository';
import { UsersExternalService } from '../user-accounts/application/users.external-service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user-accounts/domain/user.entity';
import { UsersRepository } from '../user-accounts/infrastructure/users.repository';

//тут регистрируем провайдеры всех сущностей блоггерской платформы (blogs, posts, comments, etc...)
@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    UserAccountsModule,
  ],
  providers: [
    BlogsService,
    UsersExternalQueryRepository,
    UsersExternalService,
    UsersRepository,
  ],
})
export class BloggersPlatformModule {}
