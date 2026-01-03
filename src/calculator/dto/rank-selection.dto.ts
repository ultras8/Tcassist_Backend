import { IsString, IsArray, IsNotEmpty } from 'class-validator';

export class RankSelectionDto {
  @IsString()
  @IsNotEmpty()
  year: string;

  @IsArray()
  @IsString({ each: true }) // ระบุว่าข้อมูลข้างใน Array ต้องเป็น string
  @IsNotEmpty()
  programCodes: string[];
}
