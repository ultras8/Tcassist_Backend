import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Unique,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ExamLibrary } from './exam-library.entity';

@Entity('exam_questions')
@Unique(['year', 'subjectName', 'pageNumber', 'questionNumber'])
export class ExamQuestion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  year: string;

  @Column()
  subjectName: string;

  @Column()
  pageNumber: number;

  @Column({ type: 'float', nullable: true, default: 2480 })
  imageWidth: number;

  @Column({ type: 'float', nullable: true, default: 3508 })
  imageHeight: number;

  @Column({ type: 'varchar', nullable: true })
  questionNumber: string;

  @Column({ type: 'float' })
  x: number;

  @Column({ type: 'float' })
  y: number;

  @Column({ type: 'float' })
  width: number;

  @Column({ type: 'float' })
  height: number;

  @Column({ nullable: true })
  correctAnswer: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => ExamLibrary, (library) => library.questions)
  @JoinColumn({ name: 'examId' }) // เก็บเป็น examId ในตาราง
  exam: ExamLibrary;

  @Column({ nullable: true })
  examId: number; // เก็บ ID ของชุดข้อสอบไว้ตรงๆ เลย
}
