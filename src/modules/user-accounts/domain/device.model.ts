import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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

export type DeviceDocument = Device & Document;

@Schema({
  versionKey: false,
  timestamps: false,
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

export const DeviceSchema = SchemaFactory.createForClass(Device);

DeviceSchema.index({ userId: 1, lastActiveDate: -1 });
DeviceSchema.index({ expirationDate: 1 });
