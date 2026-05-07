import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ContractDocument = Contract & Document;

export enum Currency {
  USD = 'USD',
  SYP = 'SYP',
}

@Schema({ _id: false })
export class Payment {
  @Prop({ required: true })
  amount: number;

  @Prop({ default: false })
  paid: boolean;

  @Prop({ default: null })
  paidAt?: Date;

  @Prop({ trim: true })
  note?: string;
}

const PaymentSchema = SchemaFactory.createForClass(Payment);

@Schema({ timestamps: true })
export class Contract {
  // بيانات الشركة
  @Prop({ required: true, trim: true })
  companyName: string;

  @Prop({ required: true, trim: true })
  ownerName: string;

  @Prop({ required: true, trim: true })
  ownerPhone: string;

  @Prop({ trim: true, lowercase: true })
  email?: string;

  @Prop({ required: true, trim: true })
  commercialNumber: string;

  @Prop({ required: true, trim: true })
  commercialRegister: string;

  @Prop({ required: true, trim: true })
  businessType: string;

  // بيانات العقد
  @Prop({ required: true })
  totalAmount: number;

  @Prop({ required: true, enum: Currency, default: Currency.USD })
  currency: Currency;

  @Prop({ type: [PaymentSchema], default: [] })
  payments: Payment[];

  @Prop({ trim: true })
  notes?: string;

  // ✅ جديد - المعرض المرتبط (مطلوب)
  @Prop({ type: Types.ObjectId, ref: 'Exhibition', required: true })
  exhibition: Types.ObjectId;

  // مراجع
  @Prop({ type: Types.ObjectId, ref: 'Visit', required: true })
  visit: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  agent: Types.ObjectId;

  @Prop({ required: true })
  agentName: string;

  @Prop({ default: () => new Date() })
  contractDate: Date;
}

export const ContractSchema = SchemaFactory.createForClass(Contract);

ContractSchema.index({ agent: 1, contractDate: -1 });
ContractSchema.index({ visit: 1 }, { unique: true });
ContractSchema.index({ exhibition: 1 }); // ✅ جديد
ContractSchema.index({ companyName: 'text' });