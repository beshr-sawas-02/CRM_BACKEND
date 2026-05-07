import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Contract, ContractDocument } from './contract.schema';
import {
  CreateContractDto,
  UpdateContractDto,
  UpdatePaymentStatusDto,
} from './contract.dto';
import { VisitsService } from '../visits/visits.service';
import { VisitStatus } from '../visits/visit.schema';
import { UserRole } from '../users/user.schema';
import { ContractPdfService } from './pdf/contract-pdf.service';

@Injectable()
export class ContractsService {
  constructor(
    @InjectModel(Contract.name) private contractModel: Model<ContractDocument>,
    private visitsService: VisitsService,
    private pdfService: ContractPdfService, // ✅ جديد

  ) {}

  // ✅ إنشاء عقد جديد - فقط للزيارات confirmed
  async create(dto: CreateContractDto, agentId: string, agentName: string): Promise<Contract> {
    // 1. تحقق من وجود الزيارة وأنها مثبتة (confirmed)
    const visit = await this.visitsService.findById(dto.visitId);
    if (visit.status !== VisitStatus.CONFIRMED) {
      throw new BadRequestException(
        'لا يمكن إنشاء عقد إلا لزيارة مثبتة. غيّر حالة الزيارة إلى "مثبتة" أولاً.',
      );
    }

    // 2. تحقق أن الزيارة تخص المندوب نفسه
    if ((visit as any).agent.toString() !== agentId) {
      throw new ForbiddenException('لا يمكنك إنشاء عقد لزيارة مندوب آخر');
    }

    // 3. تحقق أنه ما في عقد سابق لهذه الزيارة
    const existingContract = await this.contractModel.findOne({
      visit: new Types.ObjectId(dto.visitId),
    });
    if (existingContract) {
      throw new ConflictException('يوجد عقد سابق لهذه الزيارة');
    }

    // 4. تحقق أن مجموع الدفعات = المبلغ الإجمالي
    const sumPayments = dto.payments.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(sumPayments - dto.totalAmount) > 0.01) {
      throw new BadRequestException(
        `مجموع الدفعات (${sumPayments}) لا يساوي المبلغ الإجمالي (${dto.totalAmount})`,
      );
    }

    // 5. إنشاء العقد
    const contract = await this.contractModel.create({
      ...dto,
      visit: new Types.ObjectId(dto.visitId),
      agent: new Types.ObjectId(agentId),
      agentName,
      payments: dto.payments.map((p) => ({
        amount: p.amount,
        paid: p.paid ?? false,
        paidAt: p.paid ? new Date() : null,
        note: p.note,
      })),
    });

    // 6. ربط العقد بالزيارة
    await this.visitsService.linkContract(dto.visitId, (contract._id as Types.ObjectId).toString());

    return contract.toObject();
  }

  // ✅ عقودي (للمندوب)
  async findMyContracts(agentId: string): Promise<Contract[]> {
    return this.contractModel
      .find({ agent: new Types.ObjectId(agentId) })
      .sort({ createdAt: -1 })
      .lean();
  }

  // ✅ كل العقود (للمدير)
  async findAll(): Promise<Contract[]> {
    return this.contractModel.find().sort({ createdAt: -1 }).lean();
  }

  // ✅ تفاصيل عقد
  async findById(id: string): Promise<Contract> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('معرف العقد غير صحيح');
    }
    const contract = await this.contractModel.findById(id).lean();
    if (!contract) throw new NotFoundException('العقد غير موجود');
    return contract;
  }

  // ✅ عقد زيارة معينة (يستخدم في الـ frontend لمعرفة هل في عقد لهذه الزيارة)
  async findByVisit(visitId: string): Promise<Contract | null> {
    if (!Types.ObjectId.isValid(visitId)) return null;
    return this.contractModel.findOne({ visit: new Types.ObjectId(visitId) }).lean();
  }

  async generatePdf(id: string, userId: string, userRole: string): Promise<Buffer> {
  const contract = await this.contractModel.findById(id);
  if (!contract) throw new NotFoundException('العقد غير موجود');

  this.checkPermission(contract, userId, userRole);

  return this.pdfService.generateContractPdf(contract.toObject());
}

  // ✅ تحديث بيانات العقد
  async update(id: string, dto: UpdateContractDto, userId: string, userRole: string): Promise<Contract> {
    const contract = await this.contractModel.findById(id);
    if (!contract) throw new NotFoundException('العقد غير موجود');

    // التحقق من الصلاحيات
    this.checkPermission(contract, userId, userRole);

    // تحقق من المبالغ لو تم تحديث الدفعات
    if (dto.payments) {
      const totalAmount = dto.totalAmount ?? contract.totalAmount;
      const sumPayments = dto.payments.reduce((sum, p) => sum + p.amount, 0);
      if (Math.abs(sumPayments - totalAmount) > 0.01) {
        throw new BadRequestException(
          `مجموع الدفعات (${sumPayments}) لا يساوي المبلغ الإجمالي (${totalAmount})`,
        );
      }
      // تحديث الدفعات مع الحفاظ على paidAt للدفعات المدفوعة سابقاً
      contract.payments = dto.payments.map((p, i) => {
        const existing = contract.payments[i];
        return {
          amount: p.amount,
          paid: p.paid ?? false,
          paidAt: p.paid ? (existing?.paidAt || new Date()) : null,
          note: p.note ?? existing?.note,
        } as any;
      });
    }

    // تحديث باقي الحقول
    Object.entries(dto).forEach(([key, value]) => {
      if (key !== 'payments' && value !== undefined) {
        (contract as any)[key] = value;
      }
    });

    await contract.save();
    return contract.toObject();
  }

  // ✅ تحديث حالة دفعة محددة (toggle)
  async updatePaymentStatus(
    contractId: string,
    paymentIndex: number,
    dto: UpdatePaymentStatusDto,
    userId: string,
    userRole: string,
  ): Promise<Contract> {
    const contract = await this.contractModel.findById(contractId);
    if (!contract) throw new NotFoundException('العقد غير موجود');

    this.checkPermission(contract, userId, userRole);

    if (paymentIndex < 0 || paymentIndex >= contract.payments.length) {
      throw new BadRequestException('رقم الدفعة غير صحيح');
    }

    contract.payments[paymentIndex].paid = dto.paid;
    contract.payments[paymentIndex].paidAt = dto.paid ? new Date() : null;
    if (dto.note !== undefined) {
      contract.payments[paymentIndex].note = dto.note;
    }

    contract.markModified('payments');
    await contract.save();
    return contract.toObject();
  }

  // ✅ حذف عقد (للمدير فقط)
  async remove(id: string, userRole: string): Promise<void> {
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('فقط المدير يستطيع حذف العقود');
    }
    const contract = await this.contractModel.findById(id);
    if (!contract) throw new NotFoundException('العقد غير موجود');

    // إزالة الربط من الزيارة
    await this.visitsService.unlinkContract(contract.visit.toString());

    await this.contractModel.findByIdAndDelete(id);
  }

  // ✅ إحصائيات عقود المندوب
  async getMyStats(agentId: string) {
    const contracts = await this.contractModel
      .find({ agent: new Types.ObjectId(agentId) })
      .lean();

    const totalContracts = contracts.length;
    let totalRevenueUSD = 0;
    let totalRevenueSYP = 0;
    let totalPaidUSD = 0;
    let totalPaidSYP = 0;

    contracts.forEach((c) => {
      const paid = c.payments.filter((p) => p.paid).reduce((sum, p) => sum + p.amount, 0);
      if (c.currency === 'USD') {
        totalRevenueUSD += c.totalAmount;
        totalPaidUSD += paid;
      } else {
        totalRevenueSYP += c.totalAmount;
        totalPaidSYP += paid;
      }
    });

    return {
      totalContracts,
      totalRevenueUSD,
      totalRevenueSYP,
      totalPaidUSD,
      totalPaidSYP,
      pendingUSD: totalRevenueUSD - totalPaidUSD,
      pendingSYP: totalRevenueSYP - totalPaidSYP,
    };
  }
  // ✅ إحصائيات كل العقود (للمدير)
async getAdminStats() {
  const contracts = await this.contractModel.find().lean();

  const totalContracts = contracts.length;
  let totalRevenueUSD = 0;
  let totalRevenueSYP = 0;
  let totalPaidUSD = 0;
  let totalPaidSYP = 0;
  let fullyPaidContracts = 0;
  let partiallyPaidContracts = 0;
  let unpaidContracts = 0;

  contracts.forEach((c) => {
    const paid = c.payments.filter((p) => p.paid).reduce((sum, p) => sum + p.amount, 0);

    if (c.currency === 'USD') {
      totalRevenueUSD += c.totalAmount;
      totalPaidUSD += paid;
    } else {
      totalRevenueSYP += c.totalAmount;
      totalPaidSYP += paid;
    }

    if (paid === 0) unpaidContracts++;
    else if (Math.abs(paid - c.totalAmount) < 0.01) fullyPaidContracts++;
    else partiallyPaidContracts++;
  });

  return {
    totalContracts,
    totalRevenueUSD,
    totalRevenueSYP,
    totalPaidUSD,
    totalPaidSYP,
    pendingUSD: totalRevenueUSD - totalPaidUSD,
    pendingSYP: totalRevenueSYP - totalPaidSYP,
    fullyPaidContracts,
    partiallyPaidContracts,
    unpaidContracts,
    collectionRateUSD:
      totalRevenueUSD > 0 ? Math.round((totalPaidUSD / totalRevenueUSD) * 100) : 0,
    collectionRateSYP:
      totalRevenueSYP > 0 ? Math.round((totalPaidSYP / totalRevenueSYP) * 100) : 0,
  };
}

  // ===== Helpers =====
  private checkPermission(contract: ContractDocument, userId: string, userRole: string) {
    if (userRole === UserRole.ADMIN) return; // المدير يقدر يعدل أي شي
    if (contract.agent.toString() !== userId) {
      throw new ForbiddenException('ليس لديك صلاحية لتعديل هذا العقد');
    }
  }
}