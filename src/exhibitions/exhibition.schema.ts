import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ExhibitionDocument = Exhibition & Document;

@Schema({ timestamps: true })
export class Exhibition {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  @Prop({ trim: true })
  location?: string;

  @Prop({ default: true })
  isActive: boolean; // Soft delete - false يعني مخفي
}

export const ExhibitionSchema = SchemaFactory.createForClass(Exhibition);

ExhibitionSchema.index({ isActive: 1 });
ExhibitionSchema.index({ name: 'text' });