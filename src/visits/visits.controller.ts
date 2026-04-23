import { Controller, Get, Post, Body, Param, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { VisitsService } from './visits.service';
import { ExportService } from '../export/export.service';
import { CreateVisitDto, FilterVisitsDto } from './visit.dto';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/user.schema';

@ApiTags('Visits')
@ApiBearerAuth()
@Controller('visits')
@UseGuards(RolesGuard)
export class VisitsController {
  constructor(
    private visitsService: VisitsService,
    private exportService: ExportService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'إضافة زيارة جديدة' })
  create(@Body() dto: CreateVisitDto, @CurrentUser() user: any) {
    return this.visitsService.create(dto, user._id.toString(), user.name);
  }

  @Get('my')
  @ApiOperation({ summary: 'زياراتي' })
  @ApiQuery({ name: 'period', enum: ['today', 'week', 'all'], required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'city', required: false })
  getMyVisits(@CurrentUser() user: any, @Query() filter: FilterVisitsDto) {
    return this.visitsService.findMyVisits(user._id.toString(), filter);
  }

  @Get('my/stats')
  @ApiOperation({ summary: 'إحصائياتي' })
  @ApiQuery({ name: 'period', required: false })
  getMyStats(@CurrentUser() user: any, @Query('period') period: string) {
    return this.visitsService.getMyStats(user._id.toString(), period);
  }

  @Get('my/export')
  @ApiOperation({ summary: 'تصدير زياراتي إلى Excel' })
  @ApiQuery({ name: 'period', enum: ['today', 'week', 'all'], required: false })
  async exportMyVisits(
    @CurrentUser() user: any,
    @Query() filter: FilterVisitsDto,
    @Res() res: Response,
  ) {
    const visits = await this.visitsService.findMyVisits(user._id.toString(), filter);
    const buffer = await this.exportService.exportVisitsToExcel(visits, user.name);

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="visits_${user.name}_${Date.now()}.xlsx"`,
    });
    res.send(buffer);
  }

  @Get('all')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'جميع الزيارات (للمدير فقط)' })
  findAll(@Query() filter: FilterVisitsDto) {
    return this.visitsService.findAll(filter);
  }

  @Get('all/export')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'تصدير جميع الزيارات إلى Excel (للمدير)' })
  async exportAll(@Query() filter: FilterVisitsDto, @Res() res: Response) {
    const visits = await this.visitsService.findAll(filter);
    const buffer = await this.exportService.exportVisitsToExcel(visits, 'جميع المندوبين');

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="all_visits_${Date.now()}.xlsx"`,
    });
    res.send(buffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'تفاصيل زيارة' })
  findOne(@Param('id') id: string) {
    return this.visitsService.findById(id);
  }
}
