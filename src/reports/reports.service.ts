import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from 'src/entities/report.entity';
import { ReportMessage } from 'src/entities/report-message.entity';
import { ReportStatus } from 'src/enums/reportStatus.enum';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,

    @InjectRepository(ReportMessage)
    private messageRepository: Repository<ReportMessage>,
  ) { }

  // User เป็นคนสร้าง
  async create(createReportDto: CreateReportDto, userId: string) {
    const report = this.reportRepository.create({
      ...createReportDto,
      senderId: userId,
    });
    return await this.reportRepository.save(report);
  }

  // Admin ดูทั้งหมด (ซ่อนแชทที่ลบแล้ว และดึงประวัติข้อความ)
  async findAll() {
    return await this.reportRepository.find({
      where: { isDeletedByAdmin: false },
      relations: ['sender', 'messages', 'messages.sender'],
      order: {
        createdAt: 'DESC',
        messages: { createdAt: 'ASC' }
      },
    });
  }

  // Admin อัปเดตสถานะทั่วไป
  async updateStatus(id: string, status: ReportStatus) {
    const report = await this.reportRepository.findOneBy({ id });
    if (!report)
      throw new NotFoundException('ไม่พบข้อความร้องเรียนนี้ค่ะ');

    report.status = status;
    return await this.reportRepository.save(report);
  }

  // ในไฟล์ reports.service.ts

  async addMessage(
    reportId: string,
    userId: string,
    message: string,
    userRole: string,
  ) {
    const report = await this.reportRepository.findOne({
      where: { id: reportId },
      relations: ['sender'],
    });

    if (!report) throw new NotFoundException('ไม่พบห้องแชทนี้ค่ะ');

    if (userRole !== 'admin' && report.senderId !== userId) {
      throw new Error('คุณไม่มีสิทธิ์ส่งข้อความในห้องแชทนี้ค่ะ');
    }

    // แปลงโรลให้เป็นพิมพ์เล็กเสมอก่อนบันทึกเพื่อความปลอดภัย
    const normalizedRole = userRole.toLowerCase();

    const newMessage = this.messageRepository.create({
      message,
      senderRole: normalizedRole,
      report: { id: reportId },
      sender: { id: userId },
    });

    const savedMessage = await this.messageRepository.save(newMessage);

    // คืนค่าข้อมูลข้อความที่สมบูรณ์กลับไปให้หน้าบ้าน
    return await this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender'], // ดึง Relation ให้ครบถ้วนเหมือนตอน findAll/findOne
    });
  }

  async findOne(id: string) {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: ['sender', 'messages', 'messages.sender'],
      order: {
        messages: { createdAt: 'ASC' },
      }
    });

    if (!report) {
      throw new NotFoundException(
        `ไม่พบรายการแจ้งปัญหา ID: ${id} นี้ในระบบค่ะ`,
      );
    }
    return report;
  }

  // ปิดแชท: ห้ามพิมพ์เพิ่ม (ใช้ Enum ให้ถูกต้อง)
  async closeReport(id: string) {
    const report = await this.reportRepository.findOneBy({ id });
    if (!report) throw new NotFoundException('ไม่พบข้อความร้องเรียนนี้ค่ะ');

    return await this.reportRepository.update(id, { status: ReportStatus.CLOSED });
  }

  // ลบแชท: ซ่อนจากฝั่ง Admin (Soft Delete)
  async deleteReportByAdmin(id: string) {
    const report = await this.reportRepository.findOneBy({ id });
    if (!report) throw new NotFoundException('ไม่พบข้อความร้องเรียนนี้ค่ะ');

    return await this.reportRepository.update(id, { isDeletedByAdmin: true });
  }

  async findMyReports(userId: string) {
    const allReports = await this.reportRepository.find({
      order: { createdAt: 'DESC' },
    });

    return await this.reportRepository.find({
      where: { sender: { id: userId } },
      order: { createdAt: 'DESC' },
      relations: ['sender'],
    });
  }
}
