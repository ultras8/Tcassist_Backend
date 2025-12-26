import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Admission } from './admission.entity';

@Entity('universities')
export class University {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  fullName: string; // มหาวิทยาลัยจุฬาลงกรณ์มหาวิทยาลัย

  @Column({ unique: true, nullable: true })
  abbr: string; // CU

  @Column({ nullable: true })
  logoUrl: string; // สำหรับเก็บลิงก์โลโก้

  // ความสัมพันธ์: 1 มหาวิทยาลัย มีได้หลายเกณฑ์การรับ
  @OneToMany(() => Admission, (admission) => admission.university)
  admission: Admission[];

  @CreateDateColumn()
  createdAt: Date;
}
