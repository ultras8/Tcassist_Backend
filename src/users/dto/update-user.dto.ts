import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

// ดึงทุกตัวจาก CreateUserDto แต่จะทำให้ทุกตัวเป็น Optional
export class UpdateUserDto extends PartialType(CreateUserDto) { }
