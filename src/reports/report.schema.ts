import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReportDocument = Report & Document;

@Schema({ timestamps: true })
export class Report {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  agent: Types.ObjectId;

  @Prop({ required: true })
  agentName: string;

  @Prop({ required: true })
  reportDate: Date;

  // Stats
  @Prop({ default: 0 })
  totalVisits: number;

  @Prop({ default: 0 })
  interested: number;

  @Prop({ default: 0 })
  followUp: number;

  @Prop({ default: 0 })
  notInterested: number;

  // Notes
  @Prop({ default: '' })
  notes: string;

  // Smart report text generated automatically
  @Prop({ default: '' })
  smartSummary: string;

  @Prop({ default: false })
  sentToAdmin: boolean;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
ReportSchema.index({ agent: 1, reportDate: -1 });
