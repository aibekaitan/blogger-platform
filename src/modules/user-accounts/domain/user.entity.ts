// src/user-accounts/domain/user.entity.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';

@Schema({
  versionKey: false,
  timestamps: { createdAt: true, updatedAt: false }, // createdAt будет Date
})
export class User {
  /**
   * Уникальный строковый идентификатор (обычно uuid)
   */
  @Prop({ type: String, required: true, unique: true })
  id: string;

  /**
   * Логин пользователя (уникальный)
   */
  @Prop({ type: String, required: true, unique: true, trim: true })
  login: string;

  /**
   * Email пользователя (уникальный)
   */
  @Prop({
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  })
  email: string;

  /**
   * Хэш пароля (пока оставляем, даже если auth не мигрируем)
   */
  @Prop({ type: String, required: true })
  passwordHash: string;

  // createdAt и updatedAt добавляются автоматически благодаря timestamps
  // но в ViewModel нужен string ISO → будем преобразовывать в сервисе/маппере
  createdAt: Date;
  /**
   * Виртуальное поле для получения id как строки
   * (если где-то нужен _id.toString())
   */
  get idString(): string {
    return this._id?.toString();
  }

  // Добавляем поле, чтобы TypeScript не ругался на this._id
  _id: Types.ObjectId;

  /**
   * Фабричный метод создания пользователя
   * (используется в сервисе при регистрации)
   */
  static createInstance(dto: {
    id: string; // генерируем uuid
    login: string;
    email: string;
    passwordHash: string;
  }): User {
    const user = new this();
    user.id = dto.id;
    user.login = dto.login.trim();
    user.email = dto.email.trim().toLowerCase();
    user.passwordHash = dto.passwordHash;
    // createdAt будет автоматически от timestamps
    return user;
  }
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.loadClass(User);

// Типы
export type UserDocument = HydratedDocument<User>;

// Если нужны статические методы на уровне модели
export type UserModelType = Model<UserDocument> & typeof User;
UserSchema.loadClass(User);
