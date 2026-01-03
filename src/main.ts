import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

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

  // Path http://localhost:3000/api
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
void bootstrap();
