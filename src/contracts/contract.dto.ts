import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsEmail,
  IsMongoId,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency } from './contract.schema';

// DTO لكل دفعة
export class PaymentDto {
  @ApiProperty({ example: 2500, description: 'مبلغ الدفعة' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: false, description: 'مدفوع أم لا' })
  @IsOptional()
  @IsBoolean()
  paid?: boolean;

  @ApiPropertyOptional({ example: 'تم الاستلام نقداً' })
  @IsOptional()
  @IsString()
  note?: string;
}

// DTO لإنشاء عقد جديد
export class CreateContractDto {
  // ===== الزيارة =====
  @ApiProperty({ example: '67890abc...', description: 'معرّف الزيارة المرتبطة' })
  @IsMongoId({ message: 'معرف الزيارة غير صحيح' })
  visitId: string;

  // ===== بيانات الشركة =====
  @ApiProperty({ example: 'شركة النور للتجارة' })
  @IsString()
  companyName: string;

  @ApiProperty({ example: 'أحمد عبدالله' })
  @IsString()
  ownerName: string;

  @ApiProperty({ example: '0501234567' })
  @IsString()
  ownerPhone: string;

  @ApiPropertyOptional({ example: 'info@company.com' })
  @IsOptional()
  @IsEmail({}, { message: 'البريد الإلكتروني غير صحيح' })
  email?: string;

  @ApiProperty({ example: '1010234567' })
  @IsString()
  commercialNumber: string;

  @ApiProperty({ example: 'CR-12345' })
  @IsString()
  commercialRegister: string;

  @ApiProperty({ example: 'مواد بناء' })
  @IsString()
  businessType: string;

  // ===== بيانات العقد =====
  @ApiProperty({ example: 10000 })
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiProperty({ enum: Currency, example: Currency.USD })
  @IsEnum(Currency)
  currency: Currency;

  @ApiProperty({
    type: [PaymentDto],
    example: [
      { amount: 2500, paid: true },
      { amount: 2500, paid: false },
      { amount: 2500, paid: false },
      { amount: 2500, paid: false },
    ],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'يجب إضافة دفعة واحدة على الأقل' })
  @ValidateNested({ each: true })
  @Type(() => PaymentDto)
  payments: PaymentDto[];

  @ApiPropertyOptional({ example: 'العقد ساري المفعول لمدة سنة' })
  @IsOptional()
  @IsString()
  notes?: string;
}

// DTO لتحديث بيانات العقد
export class UpdateContractDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  commercialNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  commercialRegister?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAmount?: number;

  @ApiPropertyOptional({ enum: Currency })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional({ type: [PaymentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentDto)
  payments?: PaymentDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

// DTO لتحديث حالة دفعة محددة
export class UpdatePaymentStatusDto {
  @ApiProperty({ example: true, description: 'مدفوع أم لا' })
  @IsBoolean()
  paid: boolean;

  @ApiPropertyOptional({ example: 'تم الدفع عبر التحويل البنكي' })
  @IsOptional()
  @IsString()
  note?: string;
}