import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExhibitionsService } from './exhibitions.service';
import { ExhibitionsController } from './exhibitions.controller';
import { Exhibition, ExhibitionSchema } from './exhibition.schema';
import { Visit, VisitSchema } from '../visits/visit.schema';
import { Contract, ContractSchema } from '../contracts/contract.schema';
import { ExportModule } from '../export/export.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Exhibition.name, schema: ExhibitionSchema },
      { name: Visit.name, schema: VisitSchema },
      { name: Contract.name, schema: ContractSchema },
    ]),
    ExportModule,
  ],
  providers: [ExhibitionsService],
  controllers: [ExhibitionsController],
  exports: [ExhibitionsService],
})
export class ExhibitionsModule {}