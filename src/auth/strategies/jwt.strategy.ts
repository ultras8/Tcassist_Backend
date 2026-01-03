import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

interface JwtPayload {
  id: string;
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'SECRET_KEY_1234',
    });
  }

  validate(payload: any) {
    // คืนค่า id ออกไปเพื่อให้ Decorator หยิบไปใช้ได้
    return {
      id: payload.id || payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
