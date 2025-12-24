// src/users/users.module.ts

import { forwardRef, Module } from '@nestjs/common'; // 👈 เพิ่ม forwardRef ถ้ามันฟ้อง Circular
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { AuthModule } from '../auth/auth.module'; // 👈 1. Import มาจากไฟล์ Auth

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => AuthModule), // 👈 หุ้ม AuthModule ด้วย forwardRef
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule { }