import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ExamLibraryService } from './exam-library.service';
import { ExamLibraryDto } from './dto/exam-library.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('exams/library')
@UseGuards(JwtAuthGuard)
export class ExamLibraryController {
  constructor(private readonly libraryService: ExamLibraryService) { }

  @Post()
  async create(@Body() createDto: ExamLibraryDto) {
    return this.libraryService.saveExam(createDto);
  }

  @Post('upload-library')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLibrary(
    @Body() dto: ExamLibraryDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.libraryService.uploadToLibrary(dto, file);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importExam(
    @Body() dto: ExamLibraryDto,
    @Req() req, // ดึงข้อมูล User จาก Token
    @UploadedFile() file: Express.Multer.File,
  ) {
    // อัปโหลดขึ้น Supabase
    const savedExam = await this.libraryService.uploadToLibrary(dto, file);

    // เช็ค Role จาก Token (ดึงจาก req.user)
    const userRole = req.user.role;

    // ถ้าเป็น admin หรือ superadmin ถึงจะบันทึกไฟล์ลงเครื่องและสั่งแตกไฟล์
    if (userRole === 'admin' || userRole === 'superadmin') {
      await this.libraryService.saveFileToLocalAndConvert(savedExam, file);
    }

    return {
      message:
        userRole === 'admin' || userRole === 'superadmin'
          ? 'Imported and Conversion Triggered'
          : 'Imported successfully',
      data: savedExam,
    };
  }

  @Get()
  async findAll() {
    return this.libraryService.getAllExams();
  }

  // ค้นหาเฉพาะวิชา หรือเฉพาะปี
  @Get('search')
  async search(@Query('q') query: string) {
    if (!query) return this.libraryService.getAllExams(); // ถ้าช่องว่าง ให้ส่งกลับมาทั้งหมด
    return await this.libraryService.searchExams(query);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    // return this.libraryService.deleteExam(+id);
    return { message: `ลบวิชา ID: ${id} เรียบร้อย` };
  }

  // @Get('total-pages/:subjectName/:year')
  // async getTotalPages(
  //   @Param('subjectName') subjectName: string,
  //   @Param('year') year: string,
  // ) {
  //   const count = await this.examLibraryService.getTotalPages(
  //     subjectName,
  //     year,
  //   );
  //   return { totalPages: count };
  // }

  @Get('last-page/:subjectName')
  async getLastPage(@Param('subjectName') subjectName: string) {
    return { lastPage: 1 };
  }

  @Get('details')
  async getExamDetails(
    @Query('subjectName') subjectName: string,
    @Query('year') year: string,
  ) {
    // ไปหาข้อมูลใน DB ที่มีทั้ง pdfUrl, totalPages และ Path รูป
    const exam = await this.libraryService.findExamByDetails(subjectName, year);

    if (!exam) {
      return {
        totalPages: 0,
        lastPage: null,
        message: 'ไม่พบข้อมูลวิชานี้ค่ะ',
      };
    }

    return {
      totalPages: exam.totalPages,
      thumbnailPath: exam.thumbnailPath,
      pdfUrl: exam.pdfUrl,
      source: exam.source,
    };
  }

  @Get('total-pages')
  async getTotalPages(
    @Query('subjectName') subjectName: string,
    @Query('year') year: string,
  ) {
    const exam = await this.libraryService.findExamByDetails(subjectName, year);
    return { total: exam ? exam.totalPages : 0 };
  }
}
