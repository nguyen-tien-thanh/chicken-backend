import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  const configService = app.get(ConfigService);
  const isProduction = configService.get('env') === 'production';
  const corsOrigin = configService.get<string[]>('cors.origin');

  app.use(helmet({ contentSecurityPolicy: false }));
  app.enableCors({
    origin: isProduction ? corsOrigin : true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove field không có trong dto
      forbidNonWhitelisted: true, // Throw lỗi field lạ
      transform: true, // convert sang DTO class
      transformOptions: { enableImplicitConversion: true }, // auto parse number, boolean
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('API Docs')
    .setDescription('API description')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document);

  const port = configService.get<number>('port') ?? 8080;
  await app.listen(port);

  app.get(Logger).log(`🚀 Application is running on: http://localhost:${port}`);
}
bootstrap();
