import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Visit, VisitDocument } from '../visits/visit.schema';
import { User, UserDocument } from '../users/user.schema';
import { Report, ReportDocument } from '../reports/report.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Visit.name) private visitModel: Model<VisitDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
  ) {}

  async getOverallStats() {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7); weekStart.setHours(0, 0, 0, 0);

    const [
      todayVisits,
      weekVisits,
      totalInterested,
      totalNotInterested,
      totalFollowUp,
      totalVisits,
    ] = await Promise.all([
      this.visitModel.countDocuments({ visitDate: { $gte: todayStart, $lte: todayEnd } }),
      this.visitModel.countDocuments({ visitDate: { $gte: weekStart } }),
      this.visitModel.countDocuments({ status: 'interested' }),
      this.visitModel.countDocuments({ status: 'not_interested' }),
      this.visitModel.countDocuments({ status: 'follow_up' }),
      this.visitModel.countDocuments(),
    ]);

    return {
      todayVisits,
      weekVisits,
      totalInterested,
      totalNotInterested,
      totalFollowUp,
      totalVisits,
    };
  }

  async getAgentsPerformance() {
    const agents = await this.userModel.find({ role: 'agent', isActive: true }).select('name email').lean();

    const performance = await Promise.all(
      agents.map(async (agent) => {
        const [totalVisits, interested, followUp, notInterested] = await Promise.all([
          this.visitModel.countDocuments({ agent: agent._id }),
          this.visitModel.countDocuments({ agent: agent._id, status: 'interested' }),
          this.visitModel.countDocuments({ agent: agent._id, status: 'follow_up' }),
          this.visitModel.countDocuments({ agent: agent._id, status: 'not_interested' }),
        ]);

        const successRate = totalVisits > 0 ? Math.round((interested / totalVisits) * 100) : 0;

        return {
          agentId: agent._id,
          agentName: agent.name,
          email: agent.email,
          totalVisits,
          interested,
          followUp,
          notInterested,
          successRate,
        };
      }),
    );

    return performance.sort((a, b) => b.totalVisits - a.totalVisits);
  }

  async getRecentVisits(limit = 20) {
    return this.visitModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async getCityAnalysis() {
    return this.visitModel.aggregate([
      {
        $group: {
          _id: '$city',
          totalVisits: { $sum: 1 },
          interested: { $sum: { $cond: [{ $eq: ['$status', 'interested'] }, 1, 0] } },
          followUp: { $sum: { $cond: [{ $eq: ['$status', 'follow_up'] }, 1, 0] } },
          notInterested: { $sum: { $cond: [{ $eq: ['$status', 'not_interested'] }, 1, 0] } },
        },
      },
      { $sort: { totalVisits: -1 } },
      { $limit: 10 },
      {
        $project: {
          city: '$_id',
          totalVisits: 1,
          interested: 1,
          followUp: 1,
          notInterested: 1,
          successRate: {
            $cond: [
              { $gt: ['$totalVisits', 0] },
              { $round: [{ $multiply: [{ $divide: ['$interested', '$totalVisits'] }, 100] }, 0] },
              0,
            ],
          },
          _id: 0,
        },
      },
    ]);
  }

  async getBusinessTypeAnalysis() {
    return this.visitModel.aggregate([
      {
        $group: {
          _id: '$businessType',
          totalVisits: { $sum: 1 },
          interested: { $sum: { $cond: [{ $eq: ['$status', 'interested'] }, 1, 0] } },
        },
      },
      { $sort: { interested: -1 } },
      { $limit: 10 },
      {
        $project: {
          businessType: '$_id',
          totalVisits: 1,
          interested: 1,
          interestRate: {
            $cond: [
              { $gt: ['$totalVisits', 0] },
              { $round: [{ $multiply: [{ $divide: ['$interested', '$totalVisits'] }, 100] }, 0] },
              0,
            ],
          },
          _id: 0,
        },
      },
    ]);
  }

  async getDailyTrend(days = 14) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    return this.visitModel.aggregate([
      { $match: { visitDate: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$visitDate' },
            month: { $month: '$visitDate' },
            day: { $dayOfMonth: '$visitDate' },
          },
          totalVisits: { $sum: 1 },
          interested: { $sum: { $cond: [{ $eq: ['$status', 'interested'] }, 1, 0] } },
          followUp: { $sum: { $cond: [{ $eq: ['$status', 'follow_up'] }, 1, 0] } },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      {
        $project: {
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: '$_id.day',
                },
              },
            },
          },
          totalVisits: 1,
          interested: 1,
          followUp: 1,
          _id: 0,
        },
      },
    ]);
  }

  async getFullDashboard() {
    const [stats, agentsPerformance, recentVisits, cityAnalysis, businessTypeAnalysis, dailyTrend] =
      await Promise.all([
        this.getOverallStats(),
        this.getAgentsPerformance(),
        this.getRecentVisits(10),
        this.getCityAnalysis(),
        this.getBusinessTypeAnalysis(),
        this.getDailyTrend(14),
      ]);

    return {
      stats,
      agentsPerformance,
      recentVisits,
      cityAnalysis,
      businessTypeAnalysis,
      dailyTrend,
    };
  }
}
