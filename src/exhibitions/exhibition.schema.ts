import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ExhibitionDocument = Exhibition & Document;

@Schema({ timestamps: true })
export class Exhibition {
  @Prop({ required: true, trim: true })
  name: string; // اسم المعرض - الحقل الوحيد

  @Prop({ default: true })
  isActive: boolean; // نشط/غير نشط (Soft delete)
}

export const ExhibitionSchema = SchemaFactory.createForClass(Exhibition);

ExhibitionSchema.index({ isActive: 1 });
ExhibitionSchema.index({ name: 'text' });