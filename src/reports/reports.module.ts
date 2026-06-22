import { Module } from '@nestjs/common';
import { Report } from 'src/entities/report.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportMessage } from 'src/entities/report-message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Report, ReportMessage])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule { }
