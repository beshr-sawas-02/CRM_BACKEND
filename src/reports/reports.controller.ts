import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './report.dto';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/user.schema';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(RolesGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Post('generate')
  @ApiOperation({ summary: 'إنشاء/تحديث التقرير اليومي (Smart Report)' })
  generate(@Body() dto: CreateReportDto, @CurrentUser() user: any) {
    return this.reportsService.generateReport(dto, user._id.toString(), user.name);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'إرسال التقرير للمدير' })
  send(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reportsService.sendToAdmin(id, user._id.toString());
  }

  @Get('my')
  @ApiOperation({ summary: 'تقاريري السابقة' })
  getMyReports(@CurrentUser() user: any) {
    return this.reportsService.getMyReports(user._id.toString());
  }

  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'جميع التقارير المرسلة (للمدير فقط)' })
  getAllReports() {
    return this.reportsService.getAllReports();
  }

  @Get(':id')
  @ApiOperation({ summary: 'تفاصيل تقرير' })
  getOne(@Param('id') id: string) {
    return this.reportsService.getReportById(id);
  }
}
