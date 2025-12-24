import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  MinLength,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'กรุณากรอกชื่อ-นามสกุล' })
  fName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'กรุณากรอกชื่อ-นามสกุล' })
  lName: string;

  @ApiProperty()
  @IsEmail({}, { message: 'รูปแบบอีเมลไม่ถูกต้อง' })
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(8, { message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร' })
  password: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'กรุณายืนยันรหัสผ่าน' })
  confirmPassword: string;

  @ApiProperty()
  @IsBoolean()
  isStudying: boolean;

  @ApiProperty()
  @IsOptional()
  @IsString()
  university?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  year?: string;
}
