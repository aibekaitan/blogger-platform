// src/security-devices/domain/device.model.ts
// или src/models/device.model.ts — как у тебя принято

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Интерфейс для TypeScript (для view / dto / handlers)
export interface Device {
  _id: Types.ObjectId;
  userId: string;
  deviceId: string;
  ip: string;
  title: string;
  lastActiveDate: Date;
  expirationDate: Date;
  refreshToken: string;
}

// Для lean() / find() возврата
export type DeviceDocument = Device & Document;

// Для Mongoose схемы
@Schema({
  versionKey: false,           // убираем __v
  timestamps: false,           // если не нужны createdAt/updatedAt
  // timestamps: true,         // если нужны — раскомментируй
})
export class Device {
  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, required: true, unique: true, index: true })
  deviceId: string;

  @Prop({ type: String, required: true })
  ip: string;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: Date, required: true })
  lastActiveDate: Date;

  @Prop({ type: Date, required: true })
  expirationDate: Date;

  @Prop({ type: String, required: true })
  refreshToken: string;
}

// Экспорт модели
export const DeviceSchema = SchemaFactory.createForClass(Device);

// Индексы (для ускорения поиска)
DeviceSchema.index({ userId: 1, lastActiveDate: -1 });
DeviceSchema.index({ expirationDate: 1 }); // для удаления expired