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
import { ExhibitionsService } from '../exhibitions/exhibitions.service';
import { ContractPdfService } from './pdf/contract-pdf.service';

@Injectable()
export class ContractsService {
  constructor(
    @InjectModel(Contract.name) private contractModel: Model<ContractDocument>,
    private visitsService: VisitsService,
    private exhibitionsService: ExhibitionsService, // ✅ جديد
    private pdfService: ContractPdfService,
  ) {}

  async create(dto: CreateContractDto, agentId: string, agentName: string): Promise<Contract> {
    // 1. تحقق من الزيارة
    const visit = await this.visitsService.findById(dto.visitId);
    if (visit.status !== VisitStatus.CONFIRMED) {
      throw new BadRequestException(
        'لا يمكن إنشاء عقد إلا لزيارة مثبتة. غيّر حالة الزيارة إلى "مثبتة" أولاً.',
      );
    }

    if ((visit as any).agent.toString() !== agentId) {
      throw new ForbiddenException('لا يمكنك إنشاء عقد لزيارة مندوب آخر');
    }

    // 2. تحقق ما في عقد سابق
    const existingContract = await this.contractModel.findOne({
      visit: new Types.ObjectId(dto.visitId),
    });
    if (existingContract) {
      throw new ConflictException('يوجد عقد سابق لهذه الزيارة');
    }

    // 3. ✅ تحقق من المعرض - موجود وفعّال
    await this.exhibitionsService.validateExhibitions([dto.exhibitionId]);

    // 4. تحقق مجموع الدفعات
    const sumPayments = dto.payments.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(sumPayments - dto.totalAmount) > 0.01) {
      throw new BadRequestException(
        `مجموع الدفعات (${sumPayments}) لا يساوي المبلغ الإجمالي (${dto.totalAmount})`,
      );
    }

    // 5. إنشاء العقد
    const { visitId, exhibitionId, ...rest } = dto;
    const contract = await this.contractModel.create({
      ...rest,
      visit: new Types.ObjectId(visitId),
      exhibition: new Types.ObjectId(exhibitionId), // ✅
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
    await this.visitsService.linkContract(visitId, (contract._id as Types.ObjectId).toString());

    return contract.toObject();
  }

  async findMyContracts(agentId: string): Promise<Contract[]> {
    return this.contractModel
      .find({ agent: new Types.ObjectId(agentId) })
      .populate('exhibition', 'name')
      .sort({ createdAt: -1 })
      .lean();
  }

  async findAll(): Promise<Contract[]> {
    return this.contractModel
      .find()
      .populate('exhibition', 'name')
      .sort({ createdAt: -1 })
      .lean();
  }

  async findById(id: string): Promise<Contract> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('معرف العقد غير صحيح');
    }
    const contract = await this.contractModel
      .findById(id)
      .populate('exhibition', 'name')
      .lean();
    if (!contract) throw new NotFoundException('العقد غير موجود');
    return contract;
  }

  async findByVisit(visitId: string): Promise<Contract | null> {
    if (!Types.ObjectId.isValid(visitId)) return null;
    return this.contractModel
      .findOne({ visit: new Types.ObjectId(visitId) })
      .populate('exhibition', 'name')
      .lean();
  }

  async update(id: string, dto: UpdateContractDto, userId: string, userRole: string): Promise<Contract> {
    const contract = await this.contractModel.findById(id);
    if (!contract) throw new NotFoundException('العقد غير موجود');

    this.checkPermission(contract, userId, userRole);

    // ✅ إذا تم تغيير المعرض، تحقق منه
    if (dto.exhibitionId) {
      await this.exhibitionsService.validateExhibitions([dto.exhibitionId]);
      contract.exhibition = new Types.ObjectId(dto.exhibitionId);
    }

    if (dto.payments) {
      const totalAmount = dto.totalAmount ?? contract.totalAmount;
      const sumPayments = dto.payments.reduce((sum, p) => sum + p.amount, 0);
      if (Math.abs(sumPayments - totalAmount) > 0.01) {
        throw new BadRequestException(
          `مجموع الدفعات (${sumPayments}) لا يساوي المبلغ الإجمالي (${totalAmount})`,
        );
      }
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

    Object.entries(dto).forEach(([key, value]) => {
      if (key !== 'payments' && key !== 'exhibitionId' && value !== undefined) {
        (contract as any)[key] = value;
      }
    });

    await contract.save();
    return contract.toObject();
  }

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

  async remove(id: string, userRole: string): Promise<void> {
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('فقط المدير يستطيع حذف العقود');
    }
    const contract = await this.contractModel.findById(id);
    if (!contract) throw new NotFoundException('العقد غير موجود');

    await this.visitsService.unlinkContract(contract.visit.toString());
    await this.contractModel.findByIdAndDelete(id);
  }

  async getMyStats(agentId: string) {
    const contracts = await this.contractModel
      .find({ agent: new Types.ObjectId(agentId) })
      .lean();

    return this.calculateStats(contracts);
  }

  async getAdminStats() {
    const contracts = await this.contractModel.find().lean();
    return this.calculateStats(contracts);
  }

  private calculateStats(contracts: Contract[]) {
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

  // PDF
  async generatePdf(id: string, userId: string, userRole: string): Promise<Buffer> {
    const contract = await this.contractModel.findById(id).populate('exhibition', 'name');
    if (!contract) throw new NotFoundException('العقد غير موجود');

    this.checkPermission(contract, userId, userRole);

    return this.pdfService.generateContractPdf(contract.toObject());
  }

  private checkPermission(contract: ContractDocument, userId: string, userRole: string) {
    if (userRole === UserRole.ADMIN) return;
    if (contract.agent.toString() !== userId) {
      throw new ForbiddenException('ليس لديك صلاحية لتعديل هذا العقد');
    }
  }
}