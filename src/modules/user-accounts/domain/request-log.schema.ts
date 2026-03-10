import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ versionKey: false })
export class RequestLog extends Document {
  @Prop({ required: true })
  ip: string;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true, default: Date.now })
  date: Date;

  @Prop()
  method?: string;

  @Prop()
  userId?: string;
}

export const RequestLogSchema = SchemaFactory.createForClass(RequestLog);

RequestLogSchema.index({ ip: 1, url: 1, date: 1 });
