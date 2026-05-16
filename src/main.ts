import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

const server = express();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('CRM Exhibitions API')
    .setDescription(`
## نظام إدارة زيارات المندوبين - شركة تنظيم المعارض

### الأدوار المتاحة:
- **agent** - المندوب: يسجل الزيارات ويرسل التقارير
- **admin** - المدير: يرى جميع البيانات ولوحة التحكم

### كيفية الاستخدام:
1. سجّل دخولك عبر \`POST /auth/login\`
2. انسخ الـ token
3. اضغط Authorize وأدخل: \`Bearer <token>\`
    `)
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'تسجيل الدخول والمصادقة')
    .addTag('Visits', 'إدارة الزيارات')
    .addTag('Reports', 'التقارير اليومية')
    .addTag('Dashboard (Admin)', 'لوحة تحكم المدير')
    .addTag('Users', 'إدارة المندوبين')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
    },
    customSiteTitle: 'CRM Exhibitions API',
    customCss: `
      .topbar { background: #1E3A5F !important; }
      .topbar-wrapper img { display: none; }
      .topbar-wrapper::after { content: '🏢 CRM Exhibitions API'; color: white; font-size: 18px; font-weight: bold; }
      .swagger-ui .btn.authorize { background: #2563EB; border-color: #2563EB; }
    `,
  });

  await app.init();
}

bootstrap();

export default server;