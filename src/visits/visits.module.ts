import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VisitsService } from './visits.service';
import { VisitsController } from './visits.controller';
import { Visit, VisitSchema } from './visit.schema';
import { ExportModule } from '../export/export.module';
import { Exhibition, ExhibitionSchema } from '../exhibitions/exhibition.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Visit.name, schema: VisitSchema },
      { name: Exhibition.name, schema: ExhibitionSchema },
    ]),
    ExportModule,
  ],
  providers: [VisitsService],
  controllers: [VisitsController],
  exports: [VisitsService, MongooseModule],
})
export class VisitsModule {}