import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { ExamQuestion } from 'src/entities/exam-question.entity';
import { ExamCriteria } from 'src/entities/exam-criteria.entity';
import { Repository, Like, ILike } from 'typeorm';
import { ExamQuestionDto } from './dto/exam-question.dto';
import { SaveCriteriaDto } from './dto/save-criteria.dto';
import * as fs from 'fs';
import { ExamLibrary } from 'src/entities/exam-library.entity';
import { UpdateManyAnswersDto } from './dto/update-many-answers.dto';

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(ExamQuestion)
    private readonly questionRepo: Repository<ExamQuestion>,

    @InjectRepository(ExamCriteria)
    private readonly criteriaRepo: Repository<ExamCriteria>,

    @InjectRepository(ExamLibrary)
    private readonly libraryRepo: Repository<ExamLibrary>,
  ) { }

  public readonly rootPath = 'D:\\Project_Tcassist\\back_py';

  async findOne(id: string) {
    const numericId = Number(id);
    if (isNaN(numericId)) return null;

    return await this.questionRepo.findOne({
      where: { id: numericId as any },
      relations: ['exam'],
    });
  }

  async saveCriteria(data: SaveCriteriaDto) {
    const existing = await this.criteriaRepo.findOne({
      where: { year: data.year, subjectName: data.subjectName },
    });

    if (existing) {
      return await this.criteriaRepo.update(existing.id, {
        criteriaJson: data.criteriaJson,
      });
    }
    const newCriteria = this.criteriaRepo.create(data);
    return await this.criteriaRepo.save(newCriteria);
  }

  async getCriteria(year: string, subjectName: string) {
    const decodedSubject = decodeURIComponent(subjectName).trim();
    const cleanSearchTerm = decodedSubject
      .replace(/\d{4}/g, '')
      .replace('ข้อสอบวิชา', '')
      .replace('A-Level', '')
      .trim();

    const criteria = await this.criteriaRepo.findOne({
      where: [
        { year: year.trim(), subjectName: decodedSubject },
        { year: year.trim(), subjectName: ILike(`%${cleanSearchTerm}%`) },
      ],
    });

    if (!criteria) {
      const fallback = await this.criteriaRepo.findOne({
        where: { subjectName: ILike(`%${cleanSearchTerm}%`) },
      });
      if (fallback) return fallback;
      return {
        message: 'ยังไม่มีการกำหนดเกณฑ์สำหรับวิชานี้ค่ะ',
        criteriaJson: [],
      };
    }
    return criteria;
  }

  async submitExam(payload: {
    year: string;
    subjectName: string;
    answers: { questionId: number; answer: string }[];
  }) {
    const { year, subjectName, answers } = payload;
    const decodedSubject = decodeURIComponent(subjectName).trim();

    const questions = await this.findAllQuestionsBySubject(
      year,
      decodedSubject,
    );
    const criteria = await this.getCriteria(year, decodedSubject);

    let totalScore = 0;
    let maxScore = 0;
    let correctCount = 0;
    const details: any[] = [];

    questions.forEach((q) => {
      const userAnswerObj = answers.find((a) => a.questionId === q.id);
      const userAnswer = userAnswerObj ? userAnswerObj.answer.trim() : '';
      const correctAnswer = q.correctAnswer ? q.correctAnswer.trim() : '';

      let point = 1;
      if (criteria && (criteria as any).criteriaJson) {
        const qNum = parseInt(q.questionNumber);
        const rule = (criteria as any).criteriaJson.find(
          (r: any) => qNum >= r.startNumber && qNum <= r.endNumber,
        );
        if (rule) point = Number(rule.point);
      }
      maxScore += point;

      let isCorrect = false;
      let checkMode = 'standard';
      const isFree =
        correctAnswer.includes('ฟรีทุกข้อ') ||
        correctAnswer === 'ฟรี' ||
        correctAnswer.toLowerCase() === 'free';

      if (isFree) {
        isCorrect = true;
        checkMode = 'free_point';
      } else {
        const answerOptions = correctAnswer
          .split(/,|หรือ|\|/)
          .map((s) => s.trim())
          .filter((s) => s !== '');
        isCorrect = answerOptions.some((option) => {
          const cleanOpt = option.replace(/\*/g, '');
          const cleanUser = userAnswer.trim();
          const optNum = parseFloat(cleanOpt);
          const userNum = parseFloat(cleanUser);
          if (!isNaN(optNum) && !isNaN(userNum)) {
            if (option.includes('*')) return optNum === userNum;
            const precision = cleanOpt.includes('.')
              ? cleanOpt.split('.')[1].length
              : 0;
            return optNum.toFixed(precision) === userNum.toFixed(precision);
          }
          return cleanOpt.toLowerCase() === cleanUser.toLowerCase();
        });
        checkMode = answerOptions.length > 1 ? 'multiple_options' : 'standard';
      }

      if (isCorrect) {
        totalScore += point;
        correctCount++;
      }
      details.push({
        questionNumber: q.questionNumber,
        isCorrect,
        pointReceived: isCorrect ? point : 0,
        checkMode,
      });
    });

    return {
      subjectName,
      year,
      scoreObtained: totalScore,
      maxScore,
      correctCount,
      totalQuestions: questions.length,
      hasCustomCriteria: !!criteria,
      details,
      message: (criteria as any).id
        ? 'ตรวจทานตามเกณฑ์เรียบร้อยค่ะ'
        : 'ใช้เกณฑ์มาตรฐานค่ะ',
    };
  }

  findAllSubjects() {
    if (!existsSync(this.rootPath)) return [];
    return readdirSync(this.rootPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => {
        const folderName = dirent.name;
        const yearMatch = folderName.match(/\d{4}/);
        const year = yearMatch ? yearMatch[0] : null;
        let display = folderName
          .replace(/\d{4}/g, '')
          .replace('ข้อสอบวิชา', '')
          .trim();
        if (!display) display = folderName;
        return { originalName: folderName, year, displayName: display };
      });
  }

  findPagesBySubject(subjectName: string) {
    if (!existsSync(this.rootPath))
      throw new NotFoundException('ไม่พบ Root Path');
    const allFolders = readdirSync(this.rootPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
    const decodedSubject = decodeURIComponent(subjectName).trim();
    const actualFolderName = allFolders.find(
      (f) => f.trim() === decodedSubject || f.includes(decodedSubject),
    );
    if (!actualFolderName)
      throw new NotFoundException(`ไม่พบโฟลเดอร์: ${decodedSubject}`);

    const subjectPath = join(this.rootPath, actualFolderName);
    const allFiles = readdirSync(subjectPath)
      .filter((file) => file.toLowerCase().endsWith('.png'))
      .sort(
        (a, b) =>
          parseInt(a.match(/\d+/)?.[0] || '0') -
          parseInt(b.match(/\d+/)?.[0] || '0'),
      );

    if (allFiles.length > 3) {
      return allFiles.filter(
        (file, index) =>
          index !== 0 && index !== 1 && index !== allFiles.length - 1,
      );
    }
    return allFiles;
  }

  async saveQuestion(data: any) {
    const newQuestion = this.questionRepo.create(data);
    return await this.questionRepo.save(newQuestion);
  }

  async getQuestionsByPage(year: string, subjectName: string, page: number) {
    const questions = await this.findAllQuestionsBySubject(year, subjectName);
    return questions.filter((q) => Number(q.pageNumber) === Number(page));
  }

  async updateQuestion(id: string, data: any) {
    const question = await this.questionRepo.findOneBy({ id: id as any });
    if (!question) throw new NotFoundException('ไม่พบข้อสอบที่ต้องการอัปเดต');
    Object.assign(question, data);
    return await this.questionRepo.save(question);
  }

  async removeQuestion(id: string) {
    return await this.questionRepo.delete(id);
  }

  async deleteQuestionsByPage(
    year: string,
    subjectName: string,
    pageNumber: any,
  ) {
    const questions = await this.getQuestionsByPage(
      year,
      subjectName,
      pageNumber,
    );
    const ids = questions.map(q => q.id);
    if (ids.length > 0) {
      return await this.questionRepo.delete(ids);
    }
    return { affected: 0 };
  }

  async updateManyAnswers(dto: UpdateManyAnswersDto) {
    const { subjectId, subjectName, year, answers } = dto;

    const operations = answers.map(async (answer) => {
      const existingQuestion = await this.questionRepo.findOne({
        where: {
          examId: subjectId,
          questionNumber: String(answer.questionNumber),
        },
      });

      if (existingQuestion) {
        return this.questionRepo.update(existingQuestion.id, {
          correctAnswer: answer.correctAnswer,
          year: String(year),
          subjectName: subjectName,
        });
      } else {
        return this.questionRepo.insert({
          year: String(year),
          subjectName: subjectName,
          questionNumber: String(answer.questionNumber),
          correctAnswer: answer.correctAnswer,
          examId: subjectId,
          pageNumber: 1, // ค่า Default
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        });
      }
    });

    await Promise.all(operations);
    return {
      status: 'success',
      message: 'ซิงค์ข้อมูลเฉลยเรียบร้อย',
    };
  }

  async getTotalPages(subjectName: string, year: string) {
    const decodedSubject = decodeURIComponent(subjectName).trim();

    const oldPath = join(this.rootPath, decodedSubject);
    const newPath = join(process.cwd(), 'uploads', year, decodedSubject);

    const pathsToSearch = [newPath, oldPath];

    try {
      for (const folderPath of pathsToSearch) {
        if (existsSync(folderPath)) {
          const files = readdirSync(folderPath).filter((f) =>
            f.toLowerCase().endsWith('.png'),
          );

          if (files.length > 0) {
            return { total: files.length };
          }
        }
      }
      return { total: 0 };
    } catch (err) {
      console.error('getTotalPages Error:', err);
      return { total: 0 };
    }
  }

  async getLastQuestionNumber(year: string, subjectName: string) {
    const questions = await this.findAllQuestionsBySubject(year, subjectName);
    if (questions.length === 0) return { lastNumber: 0 };

    const maxNum = Math.max(
      ...questions.map((q) => parseInt(q.questionNumber) || 0),
    );
    return { lastNumber: maxNum };
  }

  async findAllQuestionsBySubject(year: string, subjectName: string) {
    const decodedSubject = decodeURIComponent(subjectName).trim();
    const cleanYear = year.trim();

    let questions = await this.questionRepo.find({
      where: {
        year: cleanYear,
        subjectName: decodedSubject,
      },
      order: { questionNumber: 'ASC' } as any,
    });

    if (questions.length === 0) {
      // ตัด "2568", "ข้อสอบวิชา", "A-Level" ออกเพื่อให้เหลือคำว่า "คณิตศาสตร์ประยุกต์ 1"
      const cleanKeyword = decodedSubject
        .replace(/\d{4}/g, '')
        .replace('ข้อสอบวิชา', '')
        .replace('A-Level', '')
        .trim();

      questions = await this.questionRepo.find({
        where: [
          { year: cleanYear, subjectName: ILike(`%${cleanKeyword}%`) },
          {
            year: cleanYear,
            subjectName: ILike(`%${cleanYear}%${cleanKeyword}%`),
          },
        ],
        order: { questionNumber: 'ASC' } as any,
      });
    }

    return questions;
  }

  async createOrUpdate(data: ExamQuestionDto) {
    if (!data.pageNumber || data.pageNumber <= 0)
      throw new Error('pageNumber ผิดปกติค่ะ');
    const safeData = {
      ...data,
      year: String(data.year).trim(),
      subjectName: data.subjectName.trim(),
      questionNumber: String(data.questionNumber).trim(),
      pageNumber: Number(data.pageNumber),
    };
    return await this.questionRepo.upsert(safeData, [
      'year',
      'subjectName',
      'questionNumber',
      'pageNumber',
    ]);
  }

  async getFolderName(libraryId: string) {
    const lib = await this.findLibraryById(libraryId);
    return lib?.subjectName;
  }

  async findOneBySubjectName(subjectName: string) {
    return await this.questionRepo.findOne({
      where: { subjectName: ILike(`%${subjectName}%`) },
      relations: ['exam'],
    });
  }

  async countPages(folderName: string, thumbnailPath: string): Promise<number> {
    // scripts/extracted_exams/...
    const path1 = join(this.rootPath, 'scripts', 'extracted_exams', folderName);

    // ใช้จาก thumbnailPath ใน DB
    const path2 = join(this.rootPath, thumbnailPath);

    let finalPath = '';
    if (fs.existsSync(path1)) {
      finalPath = path1;
    } else if (fs.existsSync(path2)) {
      finalPath = path2;
    }

    if (!finalPath) return 0;

    const files = fs.readdirSync(finalPath);
    return files.filter((f) => f.toLowerCase().endsWith('.png')).length;
  }

  async findLibraryById(id: string | number) {
    const numericId = Number(id);
    return await this.libraryRepo.findOne({ where: { id: numericId } });
  }

  async findAllQuestionsByLibraryId(libraryId: string | number) {
    return await this.questionRepo.find({
      where: {
        examId: typeof libraryId === 'string' ? parseInt(libraryId) : libraryId,
      },
      order: { questionNumber: 'ASC' },
    });
  }

  async getFilePathById(id: string, page: string) {
    if (!id || id === 'undefined' || isNaN(Number(id))) return null;

    const exam = await this.libraryRepo.findOne({
      where: { id: parseInt(id) },
    });

    if (!exam || !exam.thumbnailPath) {
      console.error(`ไม่พบข้อมูล Exam หรือไม่มีค่า thumbnailPath สำหรับ ID: ${id}`);
      return null;
    }

    const fileName = `page_${page}.png`;
    const cleanPath = exam.thumbnailPath.replace(/\\/g, '/');

    const possiblePaths = [
      join('D:\\Project_Tcassist\\back_py', cleanPath, fileName),
      join(process.cwd(), cleanPath, fileName),
      join(this.rootPath, cleanPath, fileName),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }

    console.error(`ไม่พบไฟล์รูปภาพ [${fileName}] พยายามหาจากพิกัดเหล่านี้แล้ว:`, possiblePaths);
    return null;
  }

  async getQuestionsByExamId(examId: number, page: number) {
    return await this.questionRepo.find({
      where: {
        examId: examId,
        pageNumber: page,
      },
      order: { questionNumber: 'ASC' },
    });
  }

  async findLibraryBySubjectNameAndYear(subjectName: string, year: string) {
    const decodedSubject = decodeURIComponent(subjectName).trim();

    return await this.libraryRepo.findOne({
      where: {
        subjectName: ILike(`%${decodedSubject}%`),
        year: year.trim(),
      },
    });
  }
}
