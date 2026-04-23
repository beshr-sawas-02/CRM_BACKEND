import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VisitDocument = Visit & Document;

export enum VisitStatus {
  INTERESTED = 'interested',
  FOLLOW_UP = 'follow_up',
  NOT_INTERESTED = 'not_interested',
}

@Schema({ timestamps: true })
export class Visit {
  // Company Info
  @Prop({ required: true, trim: true })
  companyName: string;

  @Prop({ required: true, trim: true })
  contactPerson: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ required: true, trim: true })
  city: string;

  @Prop({ required: true, trim: true })
  businessType: string;

  // Visit Details
  @Prop({ required: true })
  summary: string;

  @Prop({ required: true, enum: VisitStatus })
  status: VisitStatus;

  // Auto Fields
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  agent: Types.ObjectId;

  @Prop({ required: true })
  agentName: string;

  @Prop({ required: true })
  visitDate: Date;

  @Prop({ required: true })
  visitTime: string;
}

export const VisitSchema = SchemaFactory.createForClass(Visit);

// Index for fast queries
VisitSchema.index({ agent: 1, visitDate: -1 });
VisitSchema.index({ status: 1 });
VisitSchema.index({ city: 1 });
VisitSchema.index({ visitDate: -1 });
