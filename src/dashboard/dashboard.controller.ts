import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { UserRole } from '../users/user.schema';

@ApiTags('Dashboard (Admin)')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'لوحة التحكم الكاملة' })
  getFullDashboard() {
    return this.dashboardService.getFullDashboard();
  }

  @Get('stats')
  @ApiOperation({ summary: 'الإحصائيات العامة' })
  getStats() {
    return this.dashboardService.getOverallStats();
  }

  @Get('agents')
  @ApiOperation({ summary: 'أداء المندوبين' })
  getAgentsPerformance() {
    return this.dashboardService.getAgentsPerformance();
  }

  @Get('recent-visits')
  @ApiOperation({ summary: 'آخر الزيارات' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getRecentVisits(@Query('limit') limit: number) {
    return this.dashboardService.getRecentVisits(limit || 20);
  }

  @Get('cities')
  @ApiOperation({ summary: 'تحليل المدن' })
  getCityAnalysis() {
    return this.dashboardService.getCityAnalysis();
  }

  @Get('business-types')
  @ApiOperation({ summary: 'تحليل أنواع الأعمال' })
  getBusinessTypeAnalysis() {
    return this.dashboardService.getBusinessTypeAnalysis();
  }

  @Get('trend')
  @ApiOperation({ summary: 'تطور الزيارات اليومي' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  getDailyTrend(@Query('days') days: number) {
    return this.dashboardService.getDailyTrend(days || 14);
  }
}
