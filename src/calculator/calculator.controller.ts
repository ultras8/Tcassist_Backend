import {
  Controller,
  Get,
  Query,
  UseGuards,
  Param,
  Post,
  Body,
} from '@nestjs/common';
import { CalculatorService } from './calculator.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { UserPayload } from 'src/auth/interfaces/user-payload.interface';
import { RankSelectionDto } from './dto/rank-selection.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/enums/role.enum';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@ApiBearerAuth()
@ApiTags('calculator')
@Controller('calculator')
export class CalculatorController {
  constructor(private readonly calculatorService: CalculatorService) { }

  @Get('universities')
  @ApiOperation({ summary: 'ดึงรายชื่อมหาวิทยาลัยทั้งหมดสำหรับ Dropdown' })
  async getUnis() {
    return await this.calculatorService.getAllUniversities();
  }

  // ดึงสาขาทั้งหมด
  @Get('programs/all-majors')
  @ApiOperation({
    summary: 'ดึงรายชื่อสาขาทั้งหมดแบบไม่ซ้ำกันสำหรับโหมด MultiUni',
  })
  async getAllMajors(@Query('year') year: string) {
    return await this.calculatorService.getAllUniqueMajors(year);
  }

  // ดึงคณะรายมหาลัย
  @Get('programs/:universityId')
  @ApiOperation({ summary: 'ดึงรายชื่อคณะตามมหาลัยที่เลือกสำหรับโหมด Single' })
  async getPrograms(
    @Param('universityId') universityId: number,
    @Query('year') year: string,
  ) {
    return await this.calculatorService.getProgramsByUniversity(
      universityId,
      year,
    );
  }

  @Get('search-options')
  @ApiOperation({ summary: 'ค้นหาคณะ/มหาลัย สำหรับ Dropdown ทั่วทั้งแอป' })
  async getSearchOptions(
    @Query('q') query: string,
    @Query('year') year: string,
  ) {
    return await this.calculatorService.searchPrograms(query, year);
  }

  // --- ส่วนที่ต้องใช้การ Login (Guards) ---

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @Get('single')
  async calculateOne(
    @CurrentUser() user: UserPayload,
    @Query('programCode') programCode: string,
    @Query('year') year: string,
  ) {
    const userId = String(user.id || user.sub);
    return this.calculatorService.calculateAdmissionScore(
      userId,
      programCode,
      year,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @Get('major')
  async calculateByMajor(
    @CurrentUser() user: UserPayload,
    @Query('majorName') majorName: string,
    @Query('year') year: string,
    @Query('page') page: string = '1',
  ) {
    const userId = String(user.id || user.sub);
    return this.calculatorService.calculateByMajorName(
      userId,
      majorName,
      year,
      Number(page),
      5,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @Get('university/:id')
  async calculateUniversity(
    @CurrentUser() user: any, // UserPayload มีปัญหา เลขใช้ any
    @Param('id') universityId: number,
    @Query('year') year: string,
    @Query('page') page: string = '1',
  ) {
    const userId = String(user.id || user.sub);
    return await this.calculatorService.calculateByUniversity(
      userId,
      Number(universityId),
      year,
      Number(page),
      5,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @Post('calculate-rankings')
  async calculateRankings(
    @CurrentUser() user: UserPayload,
    @Body() dto: RankSelectionDto,
  ) {
    const userId = String(user.id || user.sub);
    return this.calculatorService.calculateMyRankings(userId, dto);
  }
}
