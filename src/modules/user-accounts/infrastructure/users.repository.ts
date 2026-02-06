import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, UpdateResult } from 'mongoose';
import { User, UserDocument } from '../domain/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /** Создание нового пользователя */
  async create(user: Partial<User>): Promise<string> {
    const newUser = new this.userModel(user);
    const savedUser = await newUser.save();
    return savedUser._id.toString();
  }

  /** Удаление пользователя по id */
  async delete(id: string): Promise<boolean> {
    const result = await this.userModel.deleteOne({ _id: id });
    return result.deletedCount === 1;
  }

  /** Найти пользователя по id (plain object) */
  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('-__v').lean().exec();
  }

  /** Сохранение изменений пользователя */
  async save(user: UserDocument): Promise<void> {
    await user.save();
  }

  /** Найти пользователя по логину или email */
  async findByLoginOrEmail(loginOrEmail: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ $or: [{ email: loginOrEmail }, { login: loginOrEmail }] })
      .select('-__v')
      .lean()
      .exec();
  }

  /** Проверка существования пользователя по логину или email */
  async doesExistByLoginOrEmail(
    login: string,
    email: string,
  ): Promise<boolean> {
    const user = await this.userModel
      .findOne({ $or: [{ email }, { login }] })
      .lean()
      .exec();
    return !!user;
  }

  /** Обновление refreshToken */
  async updateRefreshToken(userId: string, token: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { $set: { refreshToken: token } },
    );
  }

  /** Обновление подтверждения email */
  async updateConfirmation(_id: ObjectId): Promise<UpdateResult> {
    return this.userModel.updateOne(
      { _id },
      { $set: { 'emailConfirmation.isConfirmed': true } },
    );
  }

  /** Обновление пароля */
  async updatePassword(
    _id: ObjectId,
    newPassword: string,
  ): Promise<UpdateResult> {
    return this.userModel.updateOne(
      { _id },
      { $set: { passwordHash: newPassword } },
    );
  }

  /** Обновление кода восстановления пароля */
  async updatePasswordRecoveryCode(
    _id: ObjectId,
    newCode: string,
  ): Promise<UpdateResult> {
    return this.userModel.updateOne(
      { _id },
      { $set: { passwordRecoveryCode: newCode } },
    );
  }

  /** Обновление кода подтверждения email */
  async updateConfirmationCode(
    _id: ObjectId,
    newCode: string,
  ): Promise<UpdateResult> {
    return this.userModel.updateOne(
      { _id },
      { $set: { 'emailConfirmation.confirmationCode': newCode } },
    );
  }

  /** Найти пользователя по коду подтверждения email */
  async findUserByConfirmationCode(
    emailConfirmationCode: string,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ 'emailConfirmation.confirmationCode': emailConfirmationCode })
      .select('-__v')
      .lean()
      .exec();
  }

  /** Найти пользователя по коду восстановления пароля */
  async findUserByPasswordRecoveryCode(
    passwordRecoveryCode: string,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ passwordRecoveryCode })
      .select('-__v')
      .lean()
      .exec();
  }
}
