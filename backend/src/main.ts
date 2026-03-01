import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SecurityFirewallInterceptor } from './common/interceptors/security-firewall.interceptor';

import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Security
  app.use(helmet());
  app.use(
    cookieParser(process.env.COOKIE_SECRET || 'default-secret-change-me'),
  );

  const origin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  app.enableCors({
    origin: origin.split(',').map((s) => s.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-CSRF-Token',
    ],
  });

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const result = errors.map((error) => ({
          property: error.property,
          message: error.constraints ? Object.values(error.constraints)[0] : 'Validation failed',
        }));
        console.error('Validation Errors:', result);
        return new BadRequestException(result);
      },
    }),
  );

  app.useGlobalInterceptors(new SecurityFirewallInterceptor());

  // Request Logging Middleware
  let requestCount = 0;
  app.use((req: any, res: any, next: any) => {
    requestCount++;
    const start = Date.now();
    const { method, originalUrl } = req;

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;
      console.log(
        `[${requestCount}] ${method} ${originalUrl} - ${statusCode} (${duration}ms)`,
      );
    });

    next();
  });

  // API Versioning
  app.setGlobalPrefix('api/v1');

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('ServiceFlow API')
    .setDescription('The ServiceFlow Backend API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT || 3001);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
