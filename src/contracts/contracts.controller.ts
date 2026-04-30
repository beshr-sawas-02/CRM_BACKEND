import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import {
  CreateContractDto,
  UpdateContractDto,
  UpdatePaymentStatusDto,
} from './contract.dto';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/user.schema';

@ApiTags('Contracts')
@ApiBearerAuth()
@Controller('contracts')
@UseGuards(RolesGuard)
export class ContractsController {
  constructor(private contractsService: ContractsService) {}

  // ===== Endpoints للمندوب والمدير =====

  @Post()
  @ApiOperation({ summary: 'إنشاء عقد جديد لزيارة مثبتة' })
  create(@Body() dto: CreateContractDto, @CurrentUser() user: any) {
    return this.contractsService.create(dto, user._id.toString(), user.name);
  }

  @Get('my')
  @ApiOperation({ summary: 'عقودي (للمندوب)' })
  findMyContracts(@CurrentUser() user: any) {
    return this.contractsService.findMyContracts(user._id.toString());
  }

  @Get('my/stats')
  @ApiOperation({ summary: 'إحصائيات عقودي' })
  getMyStats(@CurrentUser() user: any) {
    return this.contractsService.getMyStats(user._id.toString());
  }

  @Get('by-visit/:visitId')
  @ApiOperation({ summary: 'الحصول على عقد زيارة معينة (لو موجود)' })
  findByVisit(@Param('visitId') visitId: string) {
    return this.contractsService.findByVisit(visitId);
  }

  // ===== Endpoints للمدير فقط =====

  @Get('all')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'جميع العقود (للمدير)' })
  findAll() {
    return this.contractsService.findAll();
  }

  @Get('admin/stats')
@Roles(UserRole.ADMIN)
@ApiOperation({ summary: 'إحصائيات كل العقود (للمدير)' })
getAdminStats() {
  return this.contractsService.getAdminStats();
}

  // ===== Endpoints مشتركة =====

  @Get(':id')
  @ApiOperation({ summary: 'تفاصيل عقد' })
  findOne(@Param('id') id: string) {
    return this.contractsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'تحديث بيانات عقد' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateContractDto,
    @CurrentUser() user: any,
  ) {
    return this.contractsService.update(id, dto, user._id.toString(), user.role);
  }

  @Patch(':id/payments/:index')
  @ApiOperation({ summary: 'تغيير حالة دفعة (مدفوع/غير مدفوع)' })
  updatePaymentStatus(
    @Param('id') id: string,
    @Param('index', ParseIntPipe) index: number,
    @Body() dto: UpdatePaymentStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.contractsService.updatePaymentStatus(
      id,
      index,
      dto,
      user._id.toString(),
      user.role,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'حذف عقد (للمدير فقط)' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    await this.contractsService.remove(id, user.role);
    return { message: 'تم حذف العقد بنجاح' };
  }
}