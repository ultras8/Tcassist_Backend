import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Report } from './report.entity';
import { User } from './user.entity';

@Entity()
export class ReportMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  message: string;

  @Column({ default: 'user' })
  senderRole: string;

  @ManyToOne(() => Report, (report) => report.messages)
  report: Report;

  @ManyToOne(() => User)
  sender: User; // ใครเป็นคนส่ง (Admin หรือ User)

  @CreateDateColumn()
  createdAt: Date;
}
