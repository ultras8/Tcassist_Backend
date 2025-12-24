import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'; // 1. Import
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('TCASSIST API')
    .setVersion('1.0')
    .addTag('users') // จัดกลุ่ม API
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Path http://localhost:3001/api
  SwaggerModule.setup('api', app, document);

  await app.listen(3001);
}
void bootstrap();
