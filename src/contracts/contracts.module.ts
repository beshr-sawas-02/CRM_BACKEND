import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { Contract, ContractSchema } from './contract.schema';
import { VisitsModule } from '../visits/visits.module';
import { ContractPdfService } from './pdf/contract-pdf.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Contract.name, schema: ContractSchema }]),
    VisitsModule, // نحتاج VisitsService لربط العقد بالزيارة
  ],
  providers: [ContractsService, ContractPdfService],
  controllers: [ContractsController],
  exports: [ContractsService],
})
export class ContractsModule {}