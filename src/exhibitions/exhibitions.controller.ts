import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ExhibitionsService } from './exhibitions.service';
import { CreateExhibitionDto, UpdateExhibitionDto } from './exhibition.dto';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/user.schema';

@ApiTags('Exhibitions')
@ApiBearerAuth()
@Controller('exhibitions')
@UseGuards(RolesGuard)
export class ExhibitionsController {
  constructor(private exhibitionsService: ExhibitionsService) {}

  // ===== كل المستخدمين =====

  @Get()
  @ApiOperation({ summary: 'قائمة المعارض (المندوب يرى النشطة فقط، الأدمن يرى الكل)' })
  @ApiQuery({ name: 'all', required: false, type: Boolean })
  findAll(@CurrentUser() user: any, @Query('all') all?: string) {
    // المندوب: يرى النشطة فقط
    // الأدمن: افتراضياً يرى الكل، إلا لو طلب all=false
    const showAll = user.role === UserRole.ADMIN && all !== 'false';
    return this.exhibitionsService.findAll(!showAll);
  }

  @Get(':id')
  @ApiOperation({ summary: 'تفاصيل معرض' })
  findOne(@Param('id') id: string) {
    return this.exhibitionsService.findById(id);
  }

  // ===== الأدمن فقط =====

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'إنشاء معرض جديد (للأدمن فقط)' })
  create(@Body() dto: CreateExhibitionDto) {
    return this.exhibitionsService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'تعديل معرض (للأدمن فقط)' })
  update(@Param('id') id: string, @Body() dto: UpdateExhibitionDto) {
    return this.exhibitionsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'حذف معرض (للأدمن فقط) - يفشل لو في زيارات/عقود مرتبطة',
  })
  @ApiQuery({ name: 'force', required: false, type: Boolean, description: 'force=true يخفي بدلاً من حذف' })
  remove(@Param('id') id: string, @Query('force') force?: string) {
    return this.exhibitionsService.remove(id, force === 'true');
  }

  @Get(':id/visits')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'زيارات معرض معين (للأدمن)' })
  getExhibitionVisits(@Param('id') id: string) {
    return this.exhibitionsService.getExhibitionVisits(id);
  }

  @Get(':id/visits/export')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'تصدير زيارات معرض معين إلى Excel (للأدمن)' })
  async exportExhibitionVisits(@Param('id') id: string, @Res() res: Response) {
    const { buffer, exhibitionName } = await this.exhibitionsService.exportExhibitionVisits(id);

    const arabicFileName = `زيارات_${exhibitionName}_${Date.now()}.xlsx`;
    const asciiFallback = `exhibition_visits_${Date.now()}.xlsx`;

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(arabicFileName)}`,
    });
    res.send(buffer);
  }
}