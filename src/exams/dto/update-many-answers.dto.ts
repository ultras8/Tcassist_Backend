import { IsString, IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class AnswerItemDto {
  @ApiProperty({
    example: 123,
    description: 'ID ของข้อ (ถ้าเป็นข้อใหม่จะเป็น string "temp-xxx")',
  })
  id: number | string;

  @ApiProperty({ example: '1' })
  @IsString()
  questionNumber: string;

  @ApiProperty({ example: '3' })
  @IsString()
  correctAnswer: string;
}

export class UpdateManyAnswersDto {
  @ApiProperty({ example: 2 })
  @IsNumber()
  subjectId: number;

  @ApiProperty({ example: '2567' })
  @IsString()
  subjectName: string;

  @ApiProperty({ example: 'A-Level คณิตศาสตร์ประยุกต์ 1' })
  @IsString()
  year: string;

  @ApiProperty({
    example: [{ id: 123, questionNumber: '1', correctAnswer: '3' }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerItemDto)
  answers: AnswerItemDto[];
}
