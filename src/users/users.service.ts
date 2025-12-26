import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateRoleDto } from '../auth/dto/update-auth.dto';
import { UserRole } from '../enums/role.enum';
import { UpdateStatusDto } from './dto/update-status.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>, // ดึงตัวจัดการ DB เข้ามา
  ) { }

  async create(dto: CreateUserDto) {
    // 1. เช็ครหัสผ่าน
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('รหัสผ่านไม่ตรงกัน');
    }

    // 2. Hash รหัสผ่าน
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 3. บันทึกลง Postgres
    const newUser = this.usersRepository.create({
      ...dto,
      password: hashedPassword,
    });

    return await this.usersRepository.save(newUser);
  }

  async findAll() {
    return await this.usersRepository.find();
  }

  async findAllAdmins() {
    return await this.usersRepository.findOne({
      where: { role: UserRole.ADMIN },
    });
  }

  async findOne(id: string) {
    return await this.usersRepository.findOne({
      where: { id },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.usersRepository.findOne({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    const updatedUser = this.usersRepository.merge(user, updateUserDto);
    return await this.usersRepository.save(updatedUser);
  }

  async remove(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    await this.usersRepository.delete(id);
    return `This action removes a #${id} user`;
  }

  async findOneByEmail(email: string): Promise<User | undefined> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException(`User #${email} not found`);
    }
    return user;
  }

  async updateRole(id: string, updateRoleDto: UpdateRoleDto) {
    console.log('--- Updating Role for ID:', id);
    console.log('--- New Role from DTO:', updateRoleDto.role);
    // 1. เช็คว่ามี User คนนี้ไหม
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('ไม่พบผู้ใช้งานคนนี้ค่ะ');

    // 2. (Optional) ป้องกันไม่ให้แอดคนเป็น SuperAdmin เพิ่มผ่านทางนี้
    if (updateRoleDto.role === UserRole.SUPERADMIN) {
      throw new BadRequestException('ไม่สามารถแต่งตั้ง SuperAdmin เพิ่มได้ค่ะ');
    }

    if (user.role === UserRole.SUPERADMIN) {
      throw new BadRequestException(
        'ไม่สามารถเปลี่ยนสิทธิ์ของ SuperAdmin ได้ค่ะ',
      );
    }

    user.role = updateRoleDto.role;
    const a = await this.usersRepository.save(user);
    return a;
  }

  // 1. ระงับการใช้งาน (เปลี่ยนสถานะ isActive)
  async updateStatus(id: string, updateStatusDto: UpdateStatusDto) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('ไม่พบผู้ใช้งานค่ะ');

    user.isActive = updateStatusDto.isActive;
    return await this.usersRepository.save(user);
  }

  // 2. Soft Delete (ลบแต่ข้อมูลยังอยู่ใน DB)
  async softDelete(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('ไม่พบผู้ใช้งานค่ะ');

    return await this.usersRepository.softRemove(user); // 👈 ใช้ softRemove แทน remove
  }

  async restoreUser(id: string) {
    // ปกติ findOne จะหาคนถูกลบไม่เจอ เราต้องใช้ withDeleted: true เพื่อให้มองเห็นคนที่ถูกลบไปแล้วค่ะ
    const user = await this.usersRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!user) throw new NotFoundException('ไม่พบผู้ใช้งานที่ต้องการกู้คืนค่ะ');
    if (!user.deletedAt)
      throw new BadRequestException('ผู้ใช้งานคนนี้ไม่ได้ถูกลบอยู่แล้วค่ะ');

    await this.usersRepository.restore(id);

    return { message: 'Restore user successfully' };
  }

  async findSoftDeleted() {
    return await this.usersRepository.find({
      withDeleted: true,
      where: {
        deletedAt: Not(IsNull()),
      },
    });
  }
}
