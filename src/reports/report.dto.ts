import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReportDto {
  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  reportDate?: string;

  @ApiPropertyOptional({ example: 'يوم جيد، تمت زيارة 5 شركات في المنطقة الصناعية' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SendReportDto {
  @ApiProperty()
  @IsString()
  reportId: string;
}
