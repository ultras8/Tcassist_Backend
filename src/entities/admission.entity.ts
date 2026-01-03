import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { University } from './university.entity';
import { AdmissionStat } from './admission-stat.entity';
import { ProgramType } from 'src/enums/university.enum';

@Entity('admission_criteria')
@Index(['programCode', 'year'], { unique: true })
export class Admission {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => University, (university) => university.admission)
  @JoinColumn({ name: 'universityId' })
  university: University;

  @Column()
  universityId: number;

  @Column()
  facultyName: string;

  @Column()
  majorName: string;

  @Column({ nullable: true })
  programCode: string;

  @Column({ type: 'int', default: 2568 })
  year: number;

  @Column({
    type: 'enum',
    enum: ProgramType,
    default: ProgramType.REGULAR,
  })
  programType: ProgramType;

  @Column({ type: 'jsonb' })
  scoreWeights: Record<string, number>;

  @Column({ type: 'jsonb', nullable: true })
  minScores: Record<string, number>;

  @Column({ nullable: true })
  sourceUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  requirements: any;

  @OneToMany(() => AdmissionStat, (stat) => stat.admission)
  stats: AdmissionStat[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
