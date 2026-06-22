import { IsEnum } from 'class-validator';
import { ReportStatus } from 'src/enums/reportStatus.enum';

export class UpdateReportStatusDto {
  @IsEnum(ReportStatus, { message: 'สถานะไม่ถูกต้องค่ะ' })
  status: ReportStatus;
}
