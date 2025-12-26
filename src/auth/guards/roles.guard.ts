import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Request } from 'express';
import { User } from 'src/users/entities/user.entity';

interface RequestWithUser extends Request {
  user?: User;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    // 1. ดึงสิทธิ์ที่ต้องการจาก Decorator
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    // 2. ดึงข้อมูล User
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    // ถ้าไม่มี user ใน request (อาจจะลืมใส่ JwtAuthGuard) ให้ปฏิเสธไว้ก่อน
    if (!user) {
      return false;
    }

    if (user.role === UserRole.SUPERADMIN) {
      return true;
    }

    // 3. เช็คว่าสิทธิ์ของ User ตรงกับที่ต้องการไหม
    return requiredRoles.some((role) => user.role === role);
  }
}
