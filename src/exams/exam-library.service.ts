import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { ExamLibrary } from '../entities/exam-library.entity';
import { ExamLibraryDto } from './dto/exam-library.dto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ExamLibraryService {
  private supabase: SupabaseClient;

  constructor(
    @InjectRepository(ExamLibrary)
    private libraryRepository: Repository<ExamLibrary>,
  ) {
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_KEY || '',
    );
  }

  async saveExam(dto: ExamLibraryDto) {
    const newExam = this.libraryRepository.create(dto);
    return await this.libraryRepository.save(newExam);
  }

  async getAllExams() {
    // ลองเอา 'order' ออกชั่วคราวเพื่อดูว่าข้อมูลมาครบไหม
    // หรือเช็กว่ามี filter อะไรแอบซ่อนอยู่หรือไม่
    const allExams = await this.libraryRepository.find();
    return allExams;
  }

  async searchExams(query: string) {
    return await this.libraryRepository
      .createQueryBuilder('exam')
      .where('exam.subjectName LIKE :q OR exam.year LIKE :q', {
        q: `%${query}%`,
      })
      .getMany();
  }

  async uploadToLibrary(dto: ExamLibraryDto, file: Express.Multer.File) {
    try {
      // 1. นับหน้า PDF จาก Buffer
      const pdfDoc = await PDFDocument.load(file.buffer);
      const totalPages = pdfDoc.getPageCount();

      // 2. อัปโหลดขึ้น Supabase
      const fileExt = file.originalname.split('.').pop();
      const fileName = `exam_${uuidv4().substring(0, 8)}.${fileExt}`;
      const { data, error } = await this.supabase.storage
        .from('tcas-exam-library')
        .upload(fileName, file.buffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (error)
        throw new InternalServerErrorException(
          'Supabase Error: ' + error.message,
        );

      const { data: urlData } = this.supabase.storage
        .from('tcas-exam-library')
        .getPublicUrl(fileName);

      // 3. บันทึกลง DB
      const generatedThumbnail = `uploads/${dto.year}/${dto.subjectName}`;
      const newEntry = this.libraryRepository.create({
        subjectName: dto.subjectName,
        pdfUrl: urlData.publicUrl,
        year: dto.year,
        source: dto.source || 'User Upload',
        totalPages: totalPages,
        thumbnailPath: generatedThumbnail,
      });

      const savedEntry = await this.libraryRepository.save(newEntry);

      await this.saveFileToLocalAndConvert(savedEntry, file);

      return savedEntry;
    } catch (err) {
      console.error('Catch Error:', err);
      throw err;
    }
  }

  async triggerPdfToPng(examData: ExamLibrary, fileBuffer: Buffer) {
    try {
      // ส่ง Request ไปหา Python API (สมมติรันอยู่ที่ port 5000)
      const pythonApiUrl = 'http://localhost:5000/convert';

      const payload = {
        examId: examData.id,
        subjectName: examData.subjectName,
        year: examData.year,
        pdfUrl: examData.pdfUrl, // ส่ง URL จาก Supabase ให้ Python ไปโหลดเอง
      };

      axios.post(pythonApiUrl, payload).catch((err) => {
        console.error('Python Service Error:', err.message);
      });
    } catch (error) {
      console.error('Trigger Python Error:', error);
    }
  }

  async saveFileToLocalAndConvert(exam: any, file: Express.Multer.File) {
    try {
      const baseUploadPath = path.resolve(process.cwd(), 'uploads');
      const targetDir = path.join(
        baseUploadPath,
        exam.year.toString(),
        exam.subjectName,
      );

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const filePath = path.join(targetDir, 'original.pdf');
      fs.writeFileSync(filePath, file.buffer);

      const pythonUrl = 'http://127.0.0.1:5000/convert-local';
      const payload = {
        filePath: filePath,
        outputDir: targetDir,
        subjectName: exam.subjectName,
        year: exam.year,
      };

      axios
        .post(pythonUrl, payload)
        .then((res) => console.log('Python Result:', res.data))
        .catch((err) => console.error('Python Error:', err.message));
    } catch (error) {
      console.error('Service Error:', error);
      throw error;
    }
  }

  async getTotalPages(subjectName: string, year: string): Promise<number> {
    const targetDir = path.resolve(process.cwd(), 'uploads', year, subjectName);

    if (!fs.existsSync(targetDir)) {
      return 0; // ถ้าไม่เจอโฟลเดอร์ ให้ส่ง 0 กลับไป
    }

    // นับไฟล์ .png ในโฟลเดอร์นั้น
    const files = fs.readdirSync(targetDir);
    const pngFiles = files.filter((file) => file.endsWith('.png'));

    return pngFiles.length;
  }

  async findExamByDetails(subjectName: string, year: string) {
    return await this.libraryRepository.findOne({
      where: {
        subjectName: subjectName,
        year: year,
      },
    });
  }

  async getTotalPagesFromDb(
    subjectName: string,
    year: string,
  ): Promise<number> {
    const exam = await this.findExamByDetails(subjectName, year);
    return exam ? exam.totalPages : 0;
  }

  async repairOldData() {
    const oldExams = await this.libraryRepository.find({ where: { totalPages: 0 } });

    for (const exam of oldExams) {
      try {
        const response = await axios.get(exam.pdfUrl, { responseType: 'arraybuffer' });
        const pdfDoc = await PDFDocument.load(response.data);
        const count = pdfDoc.getPageCount();

        await this.libraryRepository.update(exam.id, {
          totalPages: count,
          thumbnailPath: `uploads/${exam.year}/${exam.subjectName}/page_1.png`
        });

      } catch (err) {
        console.error(`ซ่อม ${exam.subjectName} ไม่สำเร็จ:`, err.message);
      }
    }
  }
}
