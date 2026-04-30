import { IsString, IsEnum, IsOptional, IsDateString, IsEmail } from 'class-validator';
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

  @ApiProperty({ example: 'تمت مقابلة المدير وأبدى اهتماماً بالمشاركة في معرض البناء' })
  @IsString()
  summary: string;

  @ApiProperty({ enum: VisitStatus, example: VisitStatus.INTERESTED })
  @IsEnum(VisitStatus)
  status: VisitStatus;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  visitDate?: string;

  @ApiPropertyOptional({ example: '10:30' })
  @IsOptional()
  @IsString()
  visitTime?: string;
}

// DTO لتحديث حالة الزيارة فقط
export class UpdateVisitStatusDto {
  @ApiProperty({ enum: VisitStatus, example: VisitStatus.CONFIRMED })
  @IsEnum(VisitStatus)
  status: VisitStatus;
}

// ✅ جديد - DTO لتعديل بيانات الزيارة الكاملة (للأدمن فقط)
export class UpdateVisitDto {
  @ApiPropertyOptional({ example: 'شركة النور للتجارة' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ example: 'محمد عبدالله' })
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiPropertyOptional({ example: '0501234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'info@company.com' })
  @IsOptional()
  @IsEmail({}, { message: 'البريد الإلكتروني غير صحيح' })
  email?: string;

  @ApiPropertyOptional({ example: 'الرياض' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'مواد بناء' })
  @IsOptional()
  @IsString()
  businessType?: string;

  @ApiPropertyOptional({ example: 'تمت مقابلة المدير...' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  visitDate?: string;

  @ApiPropertyOptional({ example: '10:30' })
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
}