import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Request } from 'express';
import { User } from 'src/entities/user.entity';

interface RequestWithUser extends Request {
  user?: User;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    // ดึงสิทธิ์ที่ต้องการจาก Decorator
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    // ดึงข้อมูล User
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    // ถ้าไม่มี user ใน request (อาจจะลืมใส่ JwtAuthGuard) ให้ปฏิเสธไว้ก่อน
    if (!user) {
      return false;
    }

    if (user.role === UserRole.SUPERADMIN) {
      return true;
    }

    // เช็คrole
    return requiredRoles.some((role) => user.role === role);
  }
}
