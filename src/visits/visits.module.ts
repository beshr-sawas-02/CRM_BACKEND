import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VisitsService } from './visits.service';
import { VisitsController } from './visits.controller';
import { Visit, VisitSchema } from './visit.schema';
import { ExportModule } from '../export/export.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Visit.name, schema: VisitSchema }]),
    ExportModule,
  ],
  providers: [VisitsService],
  controllers: [VisitsController],
  exports: [VisitsService],
})
export class VisitsModule {}
