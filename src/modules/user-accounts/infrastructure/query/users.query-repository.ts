import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../domain/user.entity';
import { SortQueryFilterType } from '../../../../common/types/sortQueryFilter.type';
import { IPagination } from '../../../../common/types/pagination';
import { IUserView, IUserView2 } from '../../types/user.view.interface';
import { IUserDB } from '../../types/user.db.interface';
// import { IUserView, IUserView2 } from '../types/user.view.interface';
// import { IUserDB } from '../types/user.db.interface';
// import { IPagination } from '../../common/types/pagination';
// import { SortQueryFilterType } from '../../common/types/sortQueryFilter.type';
// import { User, UserDocument } from '../domain/user.entity';

@Injectable()
export class UsersQueryRepository {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /** Получение всех пользователей с фильтрацией и пагинацией */
  async findAllUsers(
    sortQueryDto: SortQueryFilterType,
  ): Promise<IPagination<IUserView[]>> {
    const {
      searchEmailTerm,
      searchLoginTerm,
      sortBy = 'createdAt',
      sortDirection = -1,
      pageSize = 10,
      pageNumber = 1,
    } = sortQueryDto;

    const filter: any = {};
    const conds: Record<string, any>[] = [];

    if (searchLoginTerm)
      conds.push({ login: { $regex: searchLoginTerm, $options: 'i' } });
    if (searchEmailTerm)
      conds.push({ email: { $regex: searchEmailTerm, $options: 'i' } });

    if (conds.length > 0) filter.$or = conds;

    const totalCount = await this.userModel.countDocuments(filter);

    const users = await this.userModel
      .find(filter)
      .sort({ [sortBy]: sortDirection })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .select(
        '-__v -passwordHash -refreshToken -passwordRecoveryCode -emailConfirmation',
      )
      .lean()
      .exec();

    return {
      pagesCount: Math.ceil(totalCount / pageSize),
      page: pageNumber,
      pageSize,
      totalCount,
      items: users.map((u) => this._toUserView(u)),
    };
  }

  /** Получение одного пользователя по ID */
  async getByIdOrNotFoundFail(id: string): Promise<IUserView> {
    if (!Types.ObjectId.isValid(id)) throw new Error('Invalid user ID');

    const user = await this.userModel
      .findById(id)
      .select(
        '-__v -passwordHash -refreshToken -passwordRecoveryCode -emailConfirmation',
      )
      .lean()
      .exec();

    if (!user) throw new Error('User not found');
    return this._toUserView(user);
  }

  /** Метод для IUserView */
  private _toUserView(user: IUserDB & { _id: Types.ObjectId }): IUserView {
    return {
      id: user._id.toString(),
      login: user.login,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    };
  }

  /** Метод для IUserView2 */
  private _toUserView2(user: IUserDB & { _id: Types.ObjectId }): IUserView2 {
    return {
      userId: user._id.toString(),
      login: user.login,
      email: user.email,
    };
  }

  /** Проверка валидности ObjectId */
  private _checkObjectId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }
}
