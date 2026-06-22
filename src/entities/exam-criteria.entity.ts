import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('exam_criteria')
export class ExamCriteria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  year: string;

  @Column()
  subjectName: string;

  @Column({ type: 'json' })
  criteriaJson: {
    startNumber: number;
    endNumber: number;
    point: number;
    isEssay: boolean;
  }[];

  @CreateDateColumn()
  createdAt: Date;
}
