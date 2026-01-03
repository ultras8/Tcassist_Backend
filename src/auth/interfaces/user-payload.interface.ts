import { UserRole } from '../../enums/role.enum';

export interface UserPayload {
  id: string;
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
