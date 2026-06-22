import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { Admission } from './entities/admission.entity';
import { University } from './entities/university.entity';
import { CalculatorModule } from './calculator/calculator.module';
import { ScoresModule } from './scores/scores.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ExamsModule } from './exams/exams.module';
import { ExamQuestion } from './entities/exam-question.entity';
import { ExamLibrary } from './entities/exam-library.entity';
import { ReportsModule } from './reports/reports.module';
import { Report } from './entities/report.entity';

@Module({
  imports: [
    CacheModule.register({
      ttl: 600, // เก็บไว้ 10 นาที
      max: 100, // เก็บได้สูงสุด 100 ใน Memory
    }),
    UsersModule,
    ConfigModule.forRoot({ isGlobal: true }), // บอกให้ทั้งโปรเจกต์รู้จักไฟล์ .env
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [
          __dirname + '/**/*.entity{.ts,.js}',
          University,
          Admission,
          ExamQuestion,
          ExamLibrary,
          Report,
        ],
        synchronize: true,
      }),
    }),
    AuthModule,
    CalculatorModule,
    ScoresModule,
    ExamsModule,
    ReportsModule,
  ],
})
export class AppModule { }
