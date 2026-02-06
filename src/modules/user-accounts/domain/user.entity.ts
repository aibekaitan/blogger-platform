// src/user-accounts/domain/user.entity.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';

@Schema({
  versionKey: false,
  timestamps: { createdAt: true, updatedAt: false }, // createdAt будет Date
})
export class User {
  @Prop({ type: String, required: true, unique: true })
  id: string;

  @Prop({ type: String, required: true, unique: true, trim: true })
  login: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  })
  email: string;

  @Prop({ type: String, required: true })
  passwordHash: string;

  createdAt: Date;

  get idString(): string {
    return this._id?.toString();
  }

  _id: Types.ObjectId;

  static createInstance(dto: {
    id: string;
    login: string;
    email: string;
    passwordHash: string;
  }): User {
    const user = new this();
    user.id = dto.id;
    user.login = dto.login.trim();
    user.email = dto.email.trim().toLowerCase();
    user.passwordHash = dto.passwordHash;
    return user;
  }
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.loadClass(User);

export type UserDocument = HydratedDocument<User>;

export type UserModelType = Model<UserDocument> & typeof User;
UserSchema.loadClass(User);
