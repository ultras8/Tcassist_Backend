import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamsController } from './exams.controller';
import { ExamsService } from './exams.service';
import { ExamQuestion } from 'src/entities/exam-question.entity';
import { ExamLibraryController } from './exam-library.controller';
import { ExamLibraryService } from './exam-library.service';
import { ExamLibrary } from 'src/entities/exam-library.entity';
import { ExamCriteria } from 'src/entities/exam-criteria.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExamQuestion, ExamLibrary, ExamCriteria]),
  ],
  controllers: [ExamsController, ExamLibraryController],
  providers: [ExamsService, ExamLibraryService],
})
export class ExamsModule { }
