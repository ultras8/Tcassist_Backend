import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'; // เพิ่มตัวนี้
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { Admission } from './entities/admission.entity';
import { University } from './entities/university.entity';

@Module({
  imports: [
    UsersModule,
    ConfigModule.forRoot({ isGlobal: true }), // บอกให้ทั้งโปรเจกต์รู้จักไฟล์ .env
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}', University, Admission],
        synchronize: true,
      }),
    }),
    AuthModule,
  ],
})
export class AppModule { }
