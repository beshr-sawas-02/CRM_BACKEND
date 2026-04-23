import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
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
