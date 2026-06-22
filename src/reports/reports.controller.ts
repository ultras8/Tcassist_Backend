import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ReportStatus } from 'src/enums/reportStatus.enum';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CreateReportDto } from './dto/create-report.dto';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) { }

  @Get('my-reports')
  async getMyReports(@Req() req) {
    return await this.reportsService.findMyReports(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.reportsService.findOne(id);
  }

  // 1. ดึงแชททั้งหมด (สำหรับหน้า Inbox Admin)
  @Get()
  async findAll() {
    return await this.reportsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'สร้างรายการแจ้งปัญหาใหม่ (Open Ticket)' })
  async create(
    @Body() createReportDto: CreateReportDto,
    @Request() req
  ) {
    // ดึง userId จาก req.user (ซึ่งปกติ JwtStrategy จะเป็นคนยัดใส่มาให้ค่ะ)
    const userId = req.user.id;

    return await this.reportsService.create(createReportDto, userId);
  }

  // 2. ส่งข้อความ (ใช้ฟังก์ชันเดียวรองรับทั้ง Admin และ User)
  @Post(':id/messages')
  async addMessage(
    @Param('id') id: string,
    @Body('message') message: string,
    @Req() req,
  ) {
    return await this.reportsService.addMessage(
      id,
      req.user.id,
      message,
      req.user.role
    );
  }

  // 3. ปิดแชท
  @Patch(':id/close')
  async closeChat(@Param('id') id: string) {
    return await this.reportsService.closeReport(id);
  }

  // 4. ลบแชท (Soft Delete)
  @Delete(':id')
  async deleteChat(@Param('id') id: string) {
    return await this.reportsService.deleteReportByAdmin(id);
  }

  // 5. อัปเดตสถานะ (resolved, in_progress, etc.)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ReportStatus,
  ) {
    return await this.reportsService.updateStatus(id, status);
  }
}
