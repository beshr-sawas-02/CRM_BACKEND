import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Report, ReportDocument } from './report.schema';
import { Visit, VisitDocument } from '../visits/visit.schema';
import { CreateReportDto } from './report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
    @InjectModel(Visit.name) private visitModel: Model<VisitDocument>,
  ) {}

  async generateReport(dto: CreateReportDto, agentId: string, agentName: string): Promise<Report> {
    const reportDate = dto.reportDate ? new Date(dto.reportDate) : new Date();
    const start = new Date(reportDate); start.setHours(0, 0, 0, 0);
    const end = new Date(reportDate); end.setHours(23, 59, 59, 999);

    // Get today's visits for this agent
    const visits = await this.visitModel.find({
      agent: new Types.ObjectId(agentId),
      visitDate: { $gte: start, $lte: end },
    }).lean();

    const totalVisits = visits.length;
    const interested = visits.filter(v => v.status === 'interested').length;
    const followUp = visits.filter(v => v.status === 'follow_up').length;
    const notInterested = visits.filter(v => v.status === 'not_interested').length;

    // Generate smart summary
    const smartSummary = this.buildSmartSummary({
      agentName,
      reportDate,
      totalVisits,
      interested,
      followUp,
      notInterested,
      visits,
    });

    // Upsert - one report per agent per day
    const report = await this.reportModel.findOneAndUpdate(
      { agent: new Types.ObjectId(agentId), reportDate: { $gte: start, $lte: end } },
      {
        agent: new Types.ObjectId(agentId),
        agentName,
        reportDate,
        totalVisits,
        interested,
        followUp,
        notInterested,
        notes: dto.notes || '',
        smartSummary,
      },
      { upsert: true, new: true },
    );

    return report;
  }

  private buildSmartSummary(data: {
    agentName: string;
    reportDate: Date;
    totalVisits: number;
    interested: number;
    followUp: number;
    notInterested: number;
    visits: any[];
  }): string {
    const { agentName, reportDate, totalVisits, interested, followUp, notInterested, visits } = data;
    const dateStr = reportDate.toLocaleDateString('ar-SA', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const cities = [...new Set(visits.map(v => v.city))];
    const interestedCompanies = visits
      .filter(v => v.status === 'interested')
      .map(v => v.companyName)
      .join('، ');

    const successRate = totalVisits > 0 ? Math.round((interested / totalVisits) * 100) : 0;

    let summary = `📋 التقرير اليومي - ${agentName}\n`;
    summary += `📅 ${dateStr}\n\n`;
    summary += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    summary += `📊 ملخص الأداء:\n`;
    summary += `  • إجمالي الزيارات: ${totalVisits}\n`;
    summary += `  • الشركات المهتمة: ${interested} ✅\n`;
    summary += `  • تحتاج متابعة: ${followUp} 🔄\n`;
    summary += `  • غير مهتمة: ${notInterested} ❌\n`;
    summary += `  • نسبة النجاح: ${successRate}%\n\n`;

    if (cities.length > 0) {
      summary += `🗺️ المدن التي تمت زيارتها: ${cities.join('، ')}\n\n`;
    }

    if (interestedCompanies) {
      summary += `⭐ الشركات المهتمة:\n${interestedCompanies}\n\n`;
    }

    if (totalVisits === 0) {
      summary += `لم تُسجَّل أي زيارات لهذا اليوم.`;
    } else if (successRate >= 50) {
      summary += `💪 أداء ممتاز! نسبة النجاح مرتفعة.`;
    } else if (successRate >= 25) {
      summary += `👍 أداء جيد، يمكن تحسين نسبة التحويل.`;
    } else {
      summary += `📈 يُنصح بمراجعة أسلوب الإقناع لرفع نسبة الاهتمام.`;
    }

    return summary;
  }

  async sendToAdmin(reportId: string, agentId: string): Promise<Report> {
    const report = await this.reportModel.findOne({
      _id: reportId,
      agent: new Types.ObjectId(agentId),
    });
    if (!report) throw new NotFoundException('التقرير غير موجود');

    report.sentToAdmin = true;
    await report.save();
    return report;
  }

  async getMyReports(agentId: string): Promise<Report[]> {
    return this.reportModel
      .find({ agent: new Types.ObjectId(agentId) })
      .sort({ reportDate: -1 })
      .lean();
  }

  async getAllReports(): Promise<Report[]> {
    return this.reportModel
      .find({ sentToAdmin: true })
      .sort({ reportDate: -1 })
      .lean();
  }

  async getReportById(id: string): Promise<Report> {
    const report = await this.reportModel.findById(id).lean();
    if (!report) throw new NotFoundException('التقرير غير موجود');
    return report;
  }
}
