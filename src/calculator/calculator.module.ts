import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios'; // สำหรับ HttpService
import { CalculatorService } from './calculator.service';
import { CalculatorController } from './calculator.controller';
import { Admission } from '../entities/admission.entity';
import { Score } from '../entities/score.entity';
import { AdmissionStat } from '../entities/admission-stat.entity';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      ttl: 600, // เก็บไว้ 10 นาที
      max: 100, // เก็บได้สูงสุด 100 รายการ
    }),
    HttpModule,
    TypeOrmModule.forFeature([Admission, Score, AdmissionStat]),
  ],
  controllers: [CalculatorController],
  providers: [CalculatorService],
})
export class CalculatorModule { }
