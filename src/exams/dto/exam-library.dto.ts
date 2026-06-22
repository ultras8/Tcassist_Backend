import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator';

export class ExamLibraryDto {
  @IsString()
  subjectName: string;

  @IsString()
  @IsOptional()
  pdfUrl: string;

  @IsOptional()
  @IsString()
  year?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsNumber()
  totalPages?: number; // รับจำนวนหน้าจากการประมวลผล PDF

  @IsOptional()
  @IsString()
  thumbnailPath?: string; // รับ Path ของรูปหน้าแรก

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pagePaths?: string[]; // ถ้าจะเก็บ Path ทุกหน้าเป็น Array
}
