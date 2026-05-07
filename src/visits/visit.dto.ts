import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsEmail,
  IsArray,
  IsMongoId,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VisitStatus } from './visit.schema';

export class CreateVisitDto {
  @ApiProperty({ example: 'شركة النور للتجارة' })
  @IsString()
  companyName: string;

  @ApiProperty({ example: 'محمد عبدالله' })
  @IsString()
  contactPerson: string;

  @ApiProperty({ example: '0501234567' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: 'info@company.com' })
  @IsOptional()
  @IsEmail({}, { message: 'البريد الإلكتروني غير صحيح' })
  email?: string;

  @ApiProperty({ example: 'الرياض' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'مواد بناء' })
  @IsString()
  businessType: string;

  @ApiProperty({ example: 'تمت مقابلة المدير...' })
  @IsString()
  summary: string;

  @ApiProperty({ enum: VisitStatus, example: VisitStatus.INTERESTED })
  @IsEnum(VisitStatus)
  status: VisitStatus;

  // ✅ جديد - مصفوفة معارض (اختياري)
  @ApiPropertyOptional({
    type: [String],
    example: ['67890abc...', '67891def...'],
    description: 'معرفات المعارض المهتمة بها الشركة',
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true, message: 'معرف معرض غير صحيح' })
  exhibitions?: string[];

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  visitDate?: string;

  @ApiPropertyOptional({ example: '10:30' })
  @IsOptional()
  @IsString()
  visitTime?: string;
}

export class UpdateVisitStatusDto {
  @ApiProperty({ enum: VisitStatus, example: VisitStatus.CONFIRMED })
  @IsEnum(VisitStatus)
  status: VisitStatus;
}

export class UpdateVisitDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail({}, { message: 'البريد الإلكتروني غير صحيح' })
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  exhibitions?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  visitDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  visitTime?: string;
}

export class FilterVisitsDto {
  @ApiPropertyOptional({ enum: ['today', 'week', 'all'], default: 'all' })
  @IsOptional()
  @IsString()
  period?: 'today' | 'week' | 'all';

  @ApiPropertyOptional({ enum: VisitStatus })
  @IsOptional()
  @IsEnum(VisitStatus)
  status?: VisitStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  // ✅ جديد - فلترة حسب معرض
  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  exhibition?: string;
}