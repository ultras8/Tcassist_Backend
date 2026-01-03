import { IsNotEmpty, IsString, IsObject } from 'class-validator';

export class CreateScoreDto {
  @IsNotEmpty()
  @IsString()
  year: string;

  @IsNotEmpty()
  @IsObject()
  scores: Record<string, number>; // รับก้อน { "TGAT": 75.5, "TPAT3": 80 }
}