import { UserRole } from '../../enums/role.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({
    description: 'เลือกสิทธิ์: user หรือ admin',
    enum: [UserRole.USER, UserRole.ADMIN],
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;
}