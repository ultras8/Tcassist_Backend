import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { ExamQuestion } from './exam-question.entity';

@Entity('exam_library')
export class ExamLibrary {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  subjectName: string; // ชื่อวิชาภาษาไทย (เช่น คณิตศาสตร์ 1)

  @Column()
  pdfUrl: string; // ลิงก์ UUID จาก Supabase

  @Column({ nullable: true })
  year: string; // ปีการศึกษา

  @Column({ default: 'unknow' })
  source: string; // แหล่งที่มา

  @Column({ nullable: true })
  link: string;

  @Column({ nullable: true })
  thumbnailPath: string; // เก็บ Path รูปหน้าแรก (เช่น exams/uuid-page-1.png)

  @Column({ type: 'int', default: 0 })
  totalPages: number; // เก็บจำนวนหน้าทั้งหมดของ PDF ไฟล์นี้

  @Column({ type: 'json', nullable: true })
  pagePaths: string[];

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => ExamQuestion, (question) => question.exam)
  questions: ExamQuestion[];
}
