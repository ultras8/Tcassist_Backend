import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUrl,
  MinLength,
} from 'class-validator';

export class CreateReportDto {
  @ApiProperty({ description: 'หัวข้อการร้องเรียน', example: 'พบปัญหาการใช้งาน' })
  @IsString()
  @IsNotEmpty({ message: 'กรุณาใส่หัวข้อด้วยนะคะ' })
  subject: string;

  @ApiProperty({ description: 'รายละเอียดข้อความ', example: 'เนื้อหาข้อความยาวๆ...' })
  @IsString()
  @IsNotEmpty({ message: 'อย่าลืมพิมพ์รายละเอียดมานะคะ' })
  message: string;

  @ApiProperty({ description: 'ลิงก์แนบเพิ่มเติม', example: 'https://imgur.com/xyz', required: false })
  @IsOptional() // ไม่ส่งมาก็ได้
  @IsString()
  // @IsUrl({}, { message: 'รูปแบบลิงก์ไม่ถูกต้องค่ะ' }) // ถ้าอยากบังคับว่าต้องเป็น URL เท่านั้นให้เปิดใช้บรรทัดนี้ค่ะ
  link?: string;
}
