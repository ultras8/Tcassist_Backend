import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('admission_stats')
export class AdmissionStat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  programCode: string; // ตัวเชื่อมกับตารางหลัก

  @Column()
  year: number; // 2024, 2023, 2022

  @Column('float', { nullable: true })
  minScore: number;

  @Column('float', { nullable: true })
  maxScore: number;

  @Column('float', { nullable: true })
  avgScore: number;
}
