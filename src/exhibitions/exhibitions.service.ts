import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Exhibition, ExhibitionDocument } from './exhibition.schema';
import { CreateExhibitionDto, UpdateExhibitionDto } from './exhibition.dto';
import { Visit, VisitDocument } from '../visits/visit.schema';
import { Contract, ContractDocument } from '../contracts/contract.schema';
import { ExportService } from '../export/export.service';

@Injectable()
export class ExhibitionsService {
  constructor(
    @InjectModel(Exhibition.name) private exhibitionModel: Model<ExhibitionDocument>,
    @InjectModel(Visit.name) private visitModel: Model<VisitDocument>,
    @InjectModel(Contract.name) private contractModel: Model<ContractDocument>,
    private exportService: ExportService,
  ) {}

  // ✅ إنشاء معرض جديد
  async create(dto: CreateExhibitionDto): Promise<Exhibition> {
    const exhibition = await this.exhibitionModel.create({
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    });
    return exhibition.toObject();
  }

  // ✅ كل المعارض - الأدمن يشوف الكل، المندوب فقط الـ active
  async findAll(activeOnly: boolean = false): Promise<Exhibition[]> {
    const query: any = {};
    if (activeOnly) query.isActive = true;
    return this.exhibitionModel.find(query).sort({ createdAt: -1 }).lean();
  }

  // ✅ تفاصيل معرض
  async findById(id: string): Promise<Exhibition> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('معرف المعرض غير صحيح');
    }
    const exhibition = await this.exhibitionModel.findById(id).lean();
    if (!exhibition) throw new NotFoundException('المعرض غير موجود');
    return exhibition;
  }

  // ✅ تحديث معرض
  async update(id: string, dto: UpdateExhibitionDto): Promise<Exhibition> {
    const exhibition = await this.exhibitionModel.findById(id);
    if (!exhibition) throw new NotFoundException('المعرض غير موجود');

    Object.entries(dto).forEach(([key, value]) => {
      if (value !== undefined) {
        if ((key === 'startDate' || key === 'endDate') && typeof value === 'string') {
          (exhibition as any)[key] = new Date(value);
        } else {
          (exhibition as any)[key] = value;
        }
      }
    });

    await exhibition.save();
    return exhibition.toObject();
  }

  // ✅ حذف معرض - مع تحقق ذكي
  async remove(id: string, force: boolean = false): Promise<{ deleted: boolean; message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('معرف المعرض غير صحيح');
    }

    const exhibition = await this.exhibitionModel.findById(id);
    if (!exhibition) throw new NotFoundException('المعرض غير موجود');

    // عدّ الزيارات والعقود المرتبطة
    const [visitsCount, contractsCount] = await Promise.all([
      this.visitModel.countDocuments({ exhibitions: new Types.ObjectId(id) }),
      this.contractModel.countDocuments({ exhibition: new Types.ObjectId(id) }),
    ]);

    // إذا في زيارات/عقود → نمنع الحذف الفعلي ونسوي soft delete
    if (visitsCount > 0 || contractsCount > 0) {
      if (!force) {
        throw new ConflictException(
          `لا يمكن حذف هذا المعرض لأنه مرتبط بـ ${visitsCount} زيارة و ${contractsCount} عقد. يمكنك إخفاؤه بدلاً من ذلك.`,
        );
      }

      // force = true → soft delete (إخفاء)
      exhibition.isActive = false;
      await exhibition.save();
      return {
        deleted: false,
        message: `تم إخفاء المعرض. لا يزال مرتبطاً بـ ${visitsCount} زيارة و ${contractsCount} عقد.`,
      };
    }

    // ما في زيارات/عقود → حذف فعلي
    await this.exhibitionModel.findByIdAndDelete(id);
    return { deleted: true, message: 'تم حذف المعرض نهائياً' };
  }

  // ✅ الحصول على زيارات معرض معين
  async getExhibitionVisits(exhibitionId: string): Promise<Visit[]> {
    if (!Types.ObjectId.isValid(exhibitionId)) {
      throw new BadRequestException('معرف المعرض غير صحيح');
    }

    const exists = await this.exhibitionModel.exists({ _id: exhibitionId });
    if (!exists) throw new NotFoundException('المعرض غير موجود');

    return this.visitModel
      .find({ exhibitions: new Types.ObjectId(exhibitionId) })
      .sort({ visitDate: -1 })
      .lean();
  }

  // ✅ تصدير زيارات معرض إلى Excel
  async exportExhibitionVisits(exhibitionId: string): Promise<{ buffer: Buffer; exhibitionName: string }> {
    const exhibition = await this.findById(exhibitionId);
    const visits = await this.getExhibitionVisits(exhibitionId);
    const buffer = await this.exportService.exportVisitsToExcel(
      visits,
      `معرض - ${exhibition.name}`,
    );
    return { buffer, exhibitionName: exhibition.name };
  }

  // ✅ التحقق من أن مصفوفة معارض موجودة وكلها active (للاستخدام من Visits/Contracts)
  async validateExhibitions(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) return;

    const validIds = ids.filter((id) => Types.ObjectId.isValid(id));
    if (validIds.length !== ids.length) {
      throw new BadRequestException('بعض معرفات المعارض غير صحيحة');
    }

    const exhibitions = await this.exhibitionModel.find({
      _id: { $in: validIds.map((id) => new Types.ObjectId(id)) },
    });

    if (exhibitions.length !== validIds.length) {
      throw new BadRequestException('بعض المعارض غير موجودة');
    }

    const inactive = exhibitions.filter((e) => !e.isActive);
    if (inactive.length > 0) {
      throw new BadRequestException(
        `المعارض التالية غير نشطة: ${inactive.map((e) => e.name).join(', ')}`,
      );
    }
  }
}