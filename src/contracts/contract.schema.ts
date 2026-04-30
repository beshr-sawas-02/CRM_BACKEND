import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ContractDocument = Contract & Document;

export enum Currency {
  USD = 'USD',
  SYP = 'SYP', // الليرة السورية
}

// نظام الدفع لكل دفعة
@Schema({ _id: false })
export class Payment {
  @Prop({ required: true })
  amount: number; // مبلغ هذه الدفعة

  @Prop({ default: false })
  paid: boolean; // مدفوع / غير مدفوع

  @Prop({ default: null })
  paidAt?: Date; // تاريخ الدفع (يُملأ تلقائياً عند تغيير الحالة لمدفوع)

  @Prop({ trim: true })
  note?: string; // ملاحظة اختيارية على الدفعة
}

const PaymentSchema = SchemaFactory.createForClass(Payment);

@Schema({ timestamps: true })
export class Contract {
  // ===== بيانات الشركة =====
  @Prop({ required: true, trim: true })
  companyName: string;

  @Prop({ required: true, trim: true })
  ownerName: string; // اسم صاحب الشركة

  @Prop({ required: true, trim: true })
  ownerPhone: string; // رقم صاحب الشركة

  @Prop({ trim: true, lowercase: true })
  email?: string;

  @Prop({ required: true, trim: true })
  commercialNumber: string; // الرقم التجاري

  @Prop({ required: true, trim: true })
  commercialRegister: string; // السجل التجاري

  @Prop({ required: true, trim: true })
  businessType: string; // نوع نشاط الشركة

  // ===== بيانات العقد =====
  @Prop({ required: true })
  totalAmount: number; // المبلغ الإجمالي

  @Prop({ required: true, enum: Currency, default: Currency.USD })
  currency: Currency;

  @Prop({ type: [PaymentSchema], default: [] })
  payments: Payment[]; // قائمة الدفعات

  @Prop({ trim: true })
  notes?: string; // ملاحظات على العقد

  // ===== مراجع =====
  @Prop({ type: Types.ObjectId, ref: 'Visit', required: true })
  visit: Types.ObjectId; // الزيارة المرتبطة

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  agent: Types.ObjectId; // المندوب الذي أنشأ العقد

  @Prop({ required: true })
  agentName: string;

  @Prop({ default: () => new Date() })
  contractDate: Date; // تاريخ العقد
}

export const ContractSchema = SchemaFactory.createForClass(Contract);

// Indexes
ContractSchema.index({ agent: 1, contractDate: -1 });
ContractSchema.index({ visit: 1 }, { unique: true }); // كل زيارة لها عقد واحد فقط
ContractSchema.index({ companyName: 'text' });