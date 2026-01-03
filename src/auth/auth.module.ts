import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { Module, forwardRef } from '@nestjs/common';

@Module({
  imports: [
    forwardRef(() => UsersModule), // หุ้ม UsersModule ด้วย forwardRef
    PassportModule,
    JwtModule.register({
      secret: 'SECRET_KEY_1234',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard],
  exports: [AuthService, RolesGuard],
})
export class AuthModule { }