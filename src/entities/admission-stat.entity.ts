import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Admission } from './admission.entity';

@Entity('admission_stats')
export class AdmissionStat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  programCode: string;

  @Column()
  year: number;

  @Column('integer', { nullable: true })
  total_seats: number;

  @Column('integer', { nullable: true })
  total_candidates: number;

  @Column('float', { nullable: true })
  minScore: number;

  @Column('float', { nullable: true })
  maxScore: number;

  @Column('float', { nullable: true })
  avgScore: number;

  @Column('float', { nullable: true })
  round_no: number;

  @Column({ nullable: true })
  admissionId: number;

  @ManyToOne(() => Admission, (admission) => admission.stats)
  @JoinColumn({ name: 'admissionId' })
  admission: Admission;
}
