import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Visit, VisitDocument } from './visit.schema';
import { CreateVisitDto, FilterVisitsDto } from './visit.dto';

@Injectable()
export class VisitsService {
  constructor(@InjectModel(Visit.name) private visitModel: Model<VisitDocument>) {}

  async create(dto: CreateVisitDto, agentId: string, agentName: string): Promise<Visit> {
    const now = new Date();
    const visitDate = dto.visitDate ? new Date(dto.visitDate) : now;
    const visitTime = dto.visitTime || now.toTimeString().slice(0, 5);

    const visit = await this.visitModel.create({
      ...dto,
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

    return this.visitModel.find(query).sort({ visitDate: -1 }).lean();
  }

  async findAll(filter: FilterVisitsDto): Promise<Visit[]> {
    const query: any = {};
    this.applyPeriodFilter(query, filter.period);
    if (filter.status) query.status = filter.status;
    if (filter.city) query.city = new RegExp(filter.city, 'i');

    return this.visitModel.find(query).sort({ visitDate: -1 }).lean();
  }

  async findById(id: string): Promise<Visit> {
    const visit = await this.visitModel.findById(id).lean();
    if (!visit) throw new NotFoundException('الزيارة غير موجودة');
    return visit;
  }

  async getMyStats(agentId: string, period?: string) {
    const query: any = { agent: new Types.ObjectId(agentId) };
    this.applyPeriodFilter(query, period as any);

    const [total, interested, followUp, notInterested] = await Promise.all([
      this.visitModel.countDocuments(query),
      this.visitModel.countDocuments({ ...query, status: 'interested' }),
      this.visitModel.countDocuments({ ...query, status: 'follow_up' }),
      this.visitModel.countDocuments({ ...query, status: 'not_interested' }),
    ]);

    return { total, interested, followUp, notInterested };
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
