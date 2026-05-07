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

export class PaymentDto {
  @ApiProperty({ example: 2500 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  paid?: boolean;

  @ApiPropertyOptional({ example: 'تم الاستلام نقداً' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateContractDto {
  @ApiProperty({ example: '67890abc...' })
  @IsMongoId({ message: 'معرف الزيارة غير صحيح' })
  visitId: string;

  // ✅ جديد - معرف المعرض (مطلوب)
  @ApiProperty({
    example: '67891def...',
    description: 'معرف المعرض الذي ستشارك فيه الشركة',
  })
  @IsMongoId({ message: 'معرف المعرض غير صحيح' })
  exhibitionId: string;

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

  @ApiProperty({ example: 10000 })
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiProperty({ enum: Currency, example: Currency.USD })
  @IsEnum(Currency)
  currency: Currency;

  @ApiProperty({ type: [PaymentDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PaymentDto)
  payments: PaymentDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateContractDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  exhibitionId?: string; // ✅ جديد

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

export class UpdatePaymentStatusDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  paid: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}