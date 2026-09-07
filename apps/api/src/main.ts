import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import {
  API_GLOBAL_PREFIX,
  parseCorsOrigins,
  parsePort,
} from './config/env';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from './modules/auth/auth.constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = parsePort(configService.get<string>('PORT'));

  app.use(cookieParser());
  app.setGlobalPrefix(API_GLOBAL_PREFIX);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors({
    origin: parseCorsOrigins(configService.get<string>('CORS_ORIGINS')),
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Studio API')
    .setDescription('Backend REST API for Studio Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth(
      ACCESS_TOKEN_COOKIE,
      {
        type: 'apiKey',
        in: 'cookie',
      },
      ACCESS_TOKEN_COOKIE,
    )
    .addCookieAuth(
      REFRESH_TOKEN_COOKIE,
      {
        type: 'apiKey',
        in: 'cookie',
      },
      REFRESH_TOKEN_COOKIE,
    )
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api/docs', app, swaggerDocument);

  await app.listen(port);

  new Logger('Bootstrap').log(
    `Studio API running:\nhttp://localhost:${port}/${API_GLOBAL_PREFIX}\n\nSwagger:\nhttp://localhost:${port}/api/docs`,
  );
}

void bootstrap();
