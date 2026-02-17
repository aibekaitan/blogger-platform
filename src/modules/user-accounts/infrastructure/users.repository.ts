import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types, UpdateResult } from 'mongoose';
import { User, UserDocument } from '../domain/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(user: Partial<User>): Promise<string> {
    const newUser = new this.userModel(user);
    const savedUser = await newUser.save();
    return savedUser._id.toString();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.userModel.deleteOne({ _id: id });
    return result.deletedCount === 1;
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('-__v').lean().exec();
  }

  async save(user: UserDocument): Promise<void> {
    await user.save();
  }

  async findByLoginOrEmail(loginOrEmail: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ $or: [{ email: loginOrEmail }, { login: loginOrEmail }] })
      .select('-__v')
      .lean()
      .exec();
  }

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

  async updateRefreshToken(userId: string, token: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { $set: { refreshToken: token } },
    );
  }

  async updateConfirmation(_id: Types.ObjectId): Promise<UpdateResult> {
    return this.userModel.updateOne(
      { _id },
      { $set: { 'emailConfirmation.isConfirmed': true } },
    );
  }

  async updatePassword(
    _id: Types.ObjectId,
    newPassword: string,
  ): Promise<UpdateResult> {
    return this.userModel.updateOne(
      { _id },
      { $set: { passwordHash: newPassword } },
    );
  }

  async updatePasswordRecoveryCode(
    _id: Types.ObjectId,
    newCode: string,
  ): Promise<UpdateResult> {
    return this.userModel.updateOne(
      { _id },
      { $set: { passwordRecoveryCode: newCode } },
    );
  }

  async updateConfirmationCode(
    _id: Types.ObjectId,
    newCode: string,
  ): Promise<UpdateResult> {
    return this.userModel.updateOne(
      { _id },
      { $set: { 'emailConfirmation.confirmationCode': newCode } },
    );
  }

  async findUserByConfirmationCode(
    emailConfirmationCode: string,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ 'emailConfirmation.confirmationCode': emailConfirmationCode })
      .select('-__v')
      .lean()
      .exec();
  }

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
