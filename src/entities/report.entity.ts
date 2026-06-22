import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { ReportStatus } from 'src/enums/reportStatus.enum';
import { ReportMessage } from './report-message.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'text', nullable: true })
  link: string;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
  })
  status: ReportStatus;

  @ManyToOne(() => User, (user) => user.reports, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column()
  senderId: string;

  // สำหรับระบบ "ลบ" แบบซ่อน (Soft Delete)
  @Column({ default: false })
  isDeletedByAdmin: boolean;

  @Column({ default: false })
  isDeletedByUser: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ReportMessage, (message) => message.report)
  messages: ReportMessage[];
}
