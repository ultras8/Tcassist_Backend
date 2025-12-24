import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateStatusDto {
  @ApiProperty({ description: 'เปิดหรือปิดการใช้งาน', example: false })
  @IsBoolean()
  isActive: boolean;
}
