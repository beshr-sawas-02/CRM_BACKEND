import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Visit, VisitDocument, VisitStatus } from './visit.schema';
import { CreateVisitDto, FilterVisitsDto, UpdateVisitDto } from './visit.dto';

@Injectable()
export class VisitsService {
  constructor(@InjectModel(Visit.name) private visitModel: Model<VisitDocument>) {}

  async create(dto: CreateVisitDto, agentId: string, agentName: string): Promise<Visit> {
    const now = new Date();
    const visitDate = dto.visitDate ? new Date(dto.visitDate) : now;
    const visitTime = dto.visitTime || now.toTimeString().slice(0, 5);

    // ✅ تحويل معرفات المعارض من string إلى ObjectId
    const exhibitions = (dto.exhibitions || []).map(
      (id) => new Types.ObjectId(id),
    );

    const visit = await this.visitModel.create({
      ...dto,
      exhibitions,
      agent: new Types.ObjectId(agentId),
      agentName,
      visitDate,
      visitTime,
    });
    return visit;
  }

  async findMyVisits(agentId: string, filter: FilterVisitsDto): Promise<Visit[]> {
    const query: any = { agent: new Types.ObjectId(agentId) };
    this.applyPeriodFilter(query, filter.period);
    if (filter.status) query.status = filter.status;
    if (filter.city) query.city = new RegExp(filter.city, 'i');
    // ✅ فلترة حسب معرض
    if (filter.exhibition) {
      query.exhibitions = new Types.ObjectId(filter.exhibition);
    }

    return this.visitModel
      .find(query)
      .populate('exhibitions', 'name')
      .sort({ visitDate: -1 })
      .lean();
  }

  async findAll(filter: FilterVisitsDto): Promise<Visit[]> {
    const query: any = {};
    this.applyPeriodFilter(query, filter.period);
    if (filter.status) query.status = filter.status;
    if (filter.city) query.city = new RegExp(filter.city, 'i');
    if (filter.exhibition) {
      query.exhibitions = new Types.ObjectId(filter.exhibition);
    }

    return this.visitModel
      .find(query)
      .populate('exhibitions', 'name')
      .sort({ visitDate: -1 })
      .lean();
  }

  async findById(id: string): Promise<Visit> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('معرف الزيارة غير صحيح');
    }
    const visit = await this.visitModel
      .findById(id)
      .populate('exhibitions', 'name')
      .lean();
    if (!visit) throw new NotFoundException('الزيارة غير موجودة');
    return visit;
  }

  async updateStatus(id: string, status: VisitStatus, userId: string, userRole: string): Promise<Visit> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('معرف الزيارة غير صحيح');
    }

    const visit = await this.visitModel.findById(id);
    if (!visit) throw new NotFoundException('الزيارة غير موجودة');

    if (userRole !== 'admin' && visit.agent.toString() !== userId) {
      throw new ForbiddenException('ليس لديك صلاحية لتعديل هذه الزيارة');
    }

    if (visit.contract && visit.status === VisitStatus.CONFIRMED && status !== VisitStatus.CONFIRMED) {
      throw new BadRequestException(
        'لا يمكن تغيير حالة زيارة لها عقد مرتبط. احذف العقد أولاً.',
      );
    }

    visit.status = status;
    await visit.save();
    return visit.toObject();
  }

  // تعديل بيانات الزيارة (للأدمن فقط)
  async update(id: string, dto: UpdateVisitDto): Promise<Visit> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('معرف الزيارة غير صحيح');
    }

    const visit = await this.visitModel.findById(id);
    if (!visit) throw new NotFoundException('الزيارة غير موجودة');

    Object.entries(dto).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'visitDate' && typeof value === 'string') {
          (visit as any)[key] = new Date(value);
        } else if (key === 'exhibitions' && Array.isArray(value)) {
          // ✅ تحويل معرفات المعارض
          (visit as any)[key] = value.map((id: string) => new Types.ObjectId(id));
        } else {
          (visit as any)[key] = value;
        }
      }
    });

    await visit.save();
    return visit.toObject();
  }

  async linkContract(visitId: string, contractId: string): Promise<void> {
    await this.visitModel.findByIdAndUpdate(visitId, {
      contract: new Types.ObjectId(contractId),
    });
  }

  async unlinkContract(visitId: string): Promise<void> {
    await this.visitModel.findByIdAndUpdate(visitId, {
      $unset: { contract: 1 },
    });
  }

  async getMyStats(agentId: string, period?: string) {
    const query: any = { agent: new Types.ObjectId(agentId) };
    this.applyPeriodFilter(query, period as any);

    const [total, interested, followUp, notInterested, confirmed] = await Promise.all([
      this.visitModel.countDocuments(query),
      this.visitModel.countDocuments({ ...query, status: 'interested' }),
      this.visitModel.countDocuments({ ...query, status: 'follow_up' }),
      this.visitModel.countDocuments({ ...query, status: 'not_interested' }),
      this.visitModel.countDocuments({ ...query, status: 'confirmed' }),
    ]);

    return { total, interested, followUp, notInterested, confirmed };
  }

  async getTodayVisitsForAgent(agentId: string): Promise<Visit[]> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return this.visitModel.find({
      agent: new Types.ObjectId(agentId),
      visitDate: { $gte: start, $lte: end },
    }).lean();
  }

  private applyPeriodFilter(query: any, period?: string) {
    if (period === 'today') {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end = new Date(); end.setHours(23, 59, 59, 999);
      query.visitDate = { $gte: start, $lte: end };
    } else if (period === 'week') {
      const start = new Date();
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      query.visitDate = { $gte: start };
    }
  }
}