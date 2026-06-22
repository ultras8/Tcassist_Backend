import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: true, // หรือใส่ 'http://localhost:5173' (URL ของ React)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const rootImagesPath = `D:\\Project_Tcassist\\back_py\\scripts\\extracted_exams`;

  app.useStaticAssets(rootImagesPath, {
    prefix: '/exam-images/',
  });

  console.log('Static folder serve at:', rootImagesPath);

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

  await app.listen(3000, '0.0.0.0');
}
void bootstrap();
