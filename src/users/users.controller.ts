import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../enums/role.enum';
import { UpdateRoleDto } from '../auth/dto/update-auth.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@ApiBearerAuth()
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @ApiOperation({ summary: 'สมัครสมาชิกใหม่' })
  @ApiResponse({ status: 201, description: 'สร้างบัญชีสำเร็จ' })
  @ApiResponse({
    status: 400,
    description: 'ข้อมูลไม่ถูกต้อง/รหัสผ่านไม่ตรงกัน',
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'ดูรายชื่อผู้ใช้งานทั้งหมด' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get('admins')
  @Roles(UserRole.SUPERADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  findAllAdmins() {
    return this.usersService.findAllAdmins();
  }

  @Get('admins-bans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'ดูรายชื่อผู้ใช้งานทั้งหมดที่โดนแบน' })
  findSoftDeleted() {
    return this.usersService.findSoftDeleted();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/role')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'อัปเกรด User ให้เป็น Admin หรือลดสิทธิ์เป็น User' })
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto, // ใช้ DTO ที่เราจำกัด Choice ไว้
  ) {
    return this.usersService.updateRole(id, updateRoleDto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'ระงับหรือเปิดการใช้งาน User' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.usersService.updateStatus(id, updateStatusDto);
  }

  @Patch(':id/restore')
  @Roles(UserRole.SUPERADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'กู้คืนผู้ใช้งานที่เคยถูกลบแบบ Soft Delete' })
  async restore(@Param('id') id: string) {
    return this.usersService.restoreUser(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Delete(':id/soft')
  @Roles(UserRole.SUPERADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'ลบผู้ใช้งานแบบ Soft Delete (เฉพาะ SuperAdmin)' })
  softRemove(@Param('id') id: string) {
    return this.usersService.softDelete(id);
  }
}
