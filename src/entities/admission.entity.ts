import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { University } from './university.entity';
import { ProgramType } from 'src/enums/university.enum';

@Entity('admission_criteria')
export class Admission {
  @PrimaryGeneratedColumn()
  id: number;

  // FK
  @ManyToOne(() => University, (university) => university.admission)
  @JoinColumn({ name: 'universityId' })
  university: University;

  @Column()
  universityId: number;

  @Column()
  facultyName: string; // คณะ

  @Column()
  majorName: string; // สาขา

  @Column({ unique: true, nullable: true })
  programCode: string; // รหัสหลักสูตรจาก ทปอ.

  @Column({
    type: 'enum',
    enum: ProgramType,
    default: ProgramType.REGULAR,
  })
  programType: ProgramType;

  /* jsonb ทำให้เราสามารถเพิ่มวิชาใหม่ๆได้
  โดยไม่ต้องแก้ Schema ฐานข้อมูล และ PostgreSQL
  ยังสามารถ Query ข้อมูลภายใน JSON ได้เร็ว */
  @Column({ type: 'jsonb' })
  scoreWeights: Record<string, number>;

  @Column({ type: 'jsonb', nullable: true })
  minScores: Record<string, number>;

  @Column({ nullable: true })
  sourceUrl: string;

  @Column({ type: 'jsonb', nullable: true }) // ใช้ jsonb จะค้นหาข้อมูลข้างในได้เก่งมาก
  requirements: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
