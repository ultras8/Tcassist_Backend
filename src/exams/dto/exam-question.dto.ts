import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExamQuestionDto {
  @ApiProperty({ example: 2 })
  @IsNumber()
  examId: number;

  @ApiProperty({ example: '2567' })
  @IsString()
  year: string;

  @ApiProperty({ example: 'A-Level คณิตศาสตร์ประยุกต์ 1' })
  @IsString()
  subjectName: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  pageNumber: number;

  @ApiProperty()
  @IsNumber()
  imageWidth: number;

  @ApiProperty()
  @IsNumber()
  imageHeight: number;

  @ApiProperty({ example: '1' })
  @IsString()
  questionNumber: string;

  @ApiProperty({ example: 10.5 })
  @IsNumber()
  x: number;

  @ApiProperty({ example: 20.0 })
  @IsNumber()
  y: number;

  @ApiProperty({ example: 400 })
  @IsNumber()
  width: number;

  @ApiProperty({ example: 150 })
  @IsNumber()
  height: number;

  @ApiProperty({ example: '3', required: false })
  @IsOptional()
  @IsString()
  correctAnswer?: string;
}
