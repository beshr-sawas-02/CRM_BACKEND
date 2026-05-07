import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { Contract, ContractSchema } from './contract.schema';
import { VisitsModule } from '../visits/visits.module';
import { ExhibitionsModule } from '../exhibitions/exhibitions.module'; // ✅
import { ContractPdfService } from './pdf/contract-pdf.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Contract.name, schema: ContractSchema }]),
    VisitsModule,
    forwardRef(() => ExhibitionsModule), // ✅ forwardRef لحل circular dependency
  ],
  providers: [ContractsService, ContractPdfService],
  controllers: [ContractsController],
  exports: [ContractsService],
})
export class ContractsModule {}