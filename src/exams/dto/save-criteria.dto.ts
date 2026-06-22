import { IsString, IsNotEmpty, IsArray } from 'class-validator';

export class SaveCriteriaDto {
  @IsString()
  @IsNotEmpty()
  year: string;

  @IsString()
  @IsNotEmpty()
  subjectName: string;

  @IsArray()
  @IsNotEmpty()
  criteriaJson: any[];
}
