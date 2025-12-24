import { Entity, Column, PrimaryGeneratedColumn, DeleteDateColumn } from 'typeorm';
import { UserRole } from '../role.enum';

@Entity() // บอกว่าเป็นตารางในฐานข้อมูล
export class User {
  @PrimaryGeneratedColumn('uuid') // สร้าง ID อัตโนมัติแบบ UUID
  id: string;

  @Column()
  fName: string;

  @Column()
  lName: string;

  @Column({ unique: true }) // อีเมลห้ามซ้ำกัน
  email: string;

  @Column()
  password: string;

  @Column({ default: false })
  isStudying: boolean;

  @Column({ nullable: true }) // ให้ว่างได้ถ้าไม่ได้เรียนอยู่
  university?: string;

  @Column({ nullable: true })
  year?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ default: true }) // เริ่มต้นให้ทุกคนใช้งานได้ปกติ
  isActive: boolean;

  @DeleteDateColumn() // เก็บวันที่ลบไว้ ถ้ามีค่าแปลว่าถูกลบ
  deletedAt: Date;
}
