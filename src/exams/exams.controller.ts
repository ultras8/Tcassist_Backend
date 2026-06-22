import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  HttpStatus,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ExamsService } from './exams.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ExamQuestionDto } from './dto/exam-question.dto';
import { join } from 'path';
import * as express from 'express';
import * as fs from 'fs';
import { exec } from 'child_process';
import { SaveCriteriaDto } from './dto/save-criteria.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateManyAnswersDto } from './dto/update-many-answers.dto';

@ApiTags('exams')
@Controller('exams')
// @UseGuards(JwtAuthGuard)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) { }

  @Get('subjects')
  @ApiOperation({ summary: 'ดึงรายชื่อวิชาทั้งหมด' })
  getSubjects() {
    return this.examsService.findAllSubjects();
  }

  @Get('last-page')
  async getLastPage(
    @Query('subjectId') subjectId?: string,
    @Query('subjectName') subjectName?: string,
    @Query('year') year?: string,
  ) {
    let folderName = '';
    let thumbnailPath = '';

    if (subjectId) {
      const library = (await this.examsService.findLibraryById(subjectId)) as any;
      if (!library) throw new NotFoundException(`ไม่พบวิชา ID: ${subjectId}`);

      // เก็บค่าลงตัวแปรที่ประกาศไว้ข้างบน
      thumbnailPath = library.thumbnailPath || '';
      const pathParts = thumbnailPath.split('/');
      folderName = pathParts.pop() || library.subjectName || '';
    } else if (subjectName) {
      // กรณีหาด้วยชื่อ
      const library = await this.examsService.findLibraryBySubjectNameAndYear(subjectName, year || '');
      if (!library) throw new NotFoundException(`ไม่พบวิชา: ${subjectName}`);

      thumbnailPath = library.thumbnailPath || '';
      const pathParts = thumbnailPath.split('/');
      folderName = pathParts.pop() || library.subjectName || '';
    }

    const lastPage = await this.examsService.countPages(
      folderName,
      thumbnailPath,
    );

    return { lastPage };
  }

  @Get('total-pages')
  async getTotalPages(
    @Query('subjectName') subjectName: string,
    @Query('year') year: string,
  ) {
    const cleanSubject = decodeURIComponent(subjectName);
    return await this.examsService.getTotalPages(cleanSubject, year);
  }

  @Post('questions')
  async create(@Body() dto: ExamQuestionDto) {
    return await this.examsService.createOrUpdate(dto);
  }

  @Get('info/:libraryId')
  async getLibraryInfo(@Param('libraryId') id: string) {
    return await this.examsService.findLibraryById(id);
  }

  @Get('questions/all')
  async getAllQuestionsQuery(
    @Query('year') year: string,
    @Query('subjectName') subjectName: string
  ) {
    return await this.examsService.findAllQuestionsBySubject(year, subjectName);
  }

  @Get('questions/by-library/:libraryId')
  async getQuestionsByLibrary(@Param('libraryId') id: string) {
    return await this.examsService.findAllQuestionsByLibraryId(id);
  }

  @Get('questions/:subjectId/:page')
  async getQuestionsById(
    @Param('subjectId') id: string,
    @Param('page') page: string,
  ) {
    return await this.examsService.getQuestionsByExamId(
      parseInt(id),
      parseInt(page),
    );
  }

  @Get('questions/:year/:subjectName/all')
  @ApiOperation({ summary: 'ดึงคำถามทั้งหมด (รองรับทั้ง Param และ Query)' })
  async getAllQuestions(
    @Param('year') pYear: string,
    @Param('subjectName') pSubject: string,
    @Query('year') qYear: string,
    @Query('subjectName') qSubject: string,
  ) {
    const finalYear = pYear !== 'all' ? pYear : qYear;
    const finalSubject = pSubject !== 'all' ? pSubject : qSubject;
    return await this.examsService.findAllQuestionsBySubject(
      finalYear,
      finalSubject,
    );
  }

  @Get('questions/:year/:subjectName/:pageNumber')
  async getQuestionsByPage(
    @Param('year') year: string,
    @Param('subjectName') subjectName: string,
    @Param('pageNumber') pageNumber: string,
  ) {
    const page = parseInt(pageNumber);
    if (isNaN(page)) return [];
    return await this.examsService.getQuestionsByPage(year, subjectName, page);
  }

  @Post('criteria')
  async saveCriteria(@Body() data: SaveCriteriaDto) {
    return await this.examsService.saveCriteria(data);
  }

  @Get('criteria/:year/:subjectName')
  async getCriteria(
    @Param('year') year: string,
    @Param('subjectName') subjectName: string,
  ) {
    const criteria = await this.examsService.getCriteria(year, subjectName);
    return (
      criteria || {
        message: 'ยังไม่มีการกำหนดเกณฑ์สำหรับวิชานี้ค่ะ',
        criteriaJson: [],
      }
    );
  }

  @Get('last-question/:year/:subjectName')
  getLastQuestionNumber(
    @Param('year') year: string,
    @Param('subjectName') subjectName: string,
  ) {
    return this.examsService.getLastQuestionNumber(year, subjectName);
  }

  @Get('pages/:subjectName')
  async getPages(@Param('subjectName') subjectName: string) {
    return this.examsService.findPagesBySubject(subjectName);
  }

  @Post('scan-answers')
  async runOcrScan(@Body() body: { subjectName: string; year: string }) {
    return new Promise((resolve) => {
      const venvPythonPath = 'D:\\Project_Tcassist\\back_py\\venv\\Scripts\\python.exe';
      const pythonScriptPath = 'D:\\Project_Tcassist\\back_py\\scripts\\exam_processor\\extract_answer_table.py';
      const projectRoot = 'D:\\Project_Tcassist\\back_py';

      const { subjectName, year } = body;

      const folderName = `${year} ${subjectName}`;

      const command = `"${venvPythonPath}" "${pythonScriptPath}" "${folderName}"`;

      exec(
        command,
        {
          cwd: projectRoot,
          env: { ...process.env, PYTHONPATH: projectRoot },
        },
        (error, stdout, stderr) => {
          if (error) {
            console.error('OCR Error:', error.message);
            return resolve({
              status: 'error',
              message: error.message,
              details: stderr,
            });
          }
          console.log('OCR Output:', stdout);
          resolve({ status: 'success', output: stdout });
        },
      );
    });
  }

  @Patch('questions/:id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.examsService.updateQuestion(id, data);
  }

  @Post('update-answers')
  async updateAnswers(@Body() body: UpdateManyAnswersDto) {
    return await this.examsService.updateManyAnswers(body);
  }

  @Post('submit')
  async submitExam(
    @Body() payload: { year: string; subjectName: string; answers: any[] },
  ) {
    return await this.examsService.submitExam(payload);
  }

  @Delete('questions/:id')
  remove(@Param('id') id: string) {
    return this.examsService.removeQuestion(id);
  }

  @Delete('questions/:year/:subjectName/:pageNumber')
  async removeByPage(
    @Param('year') year: string,
    @Param('subjectName') subjectName: string,
    @Param('pageNumber') pageNumber: number,
  ) {
    return await this.examsService.deleteQuestionsByPage(
      year,
      subjectName,
      pageNumber,
    );
  }

  @Get('image/:libraryId/:pageNumber')
  async getFullPageImage(
    @Param('libraryId') id: string,
    @Param('pageNumber') page: string,
    @Res() res: express.Response,
  ) {
    const fullPath = await this.examsService.getFilePathById(id, page);
    if (!fullPath) return res.status(404).json({ message: 'หาไฟล์ไม่เจอค่ะ' });
    return res.sendFile(fullPath);
  }

  @Get('image/:id/:page')
  async getExamImage(
    @Param('id') id: string,
    @Param('page') page: string,
    @Res() res: any,
  ) {
    const filePath = await this.examsService.getFilePathById(id, page);
    if (!filePath) {
      return res.status(404).json({ message: 'ไม่พบไฟล์ภาพข้อสอบชุดนี้ค่ะ' });
    }

    return res.sendFile(filePath, (err) => {
      if (err) {
        console.error('เกิดข้อผิดพลาดขณะส่งไฟล์ภาพให้หน้าบ้าน:', err);
        if (!res.headersSent) {
          res.status(500).json({ message: 'เกิดข้อผิดพลาดในการส่งไฟล์ภาพ' });
        }
      }
    });
  }

  @Get('questions/subject-id-fallback')
  async getSubjectIdFallback(
    @Query('subjectName') subjectName: string,
    @Query('year') year: string,
  ) {
    const exam = await this.examsService.findLibraryBySubjectNameAndYear(
      subjectName,
      year,
    );
    if (!exam) {
      throw new NotFoundException('ไม่พบวิชานี้ในสารบบคลังข้อสอบค่ะ');
    }
    return { id: exam.id };
  }
}
