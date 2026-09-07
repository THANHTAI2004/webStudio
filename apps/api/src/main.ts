import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import {
  API_GLOBAL_PREFIX,
  normalizeMediaUrlPrefix,
  parseCorsOrigins,
  parsePort,
  resolveUploadRoot,
} from './config/env';
import { ensureUploadDirectories } from './modules/media/media-storage.paths';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from './modules/auth/auth.constants';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const port = parsePort(configService.get<string>('PORT'));
  const uploadRoot = resolveUploadRoot(configService.get<string>('UPLOAD_DIR'));
  const mediaUrlPrefix = normalizeMediaUrlPrefix(
    configService.get<string>('MEDIA_URL_PREFIX'),
  );

  await ensureUploadDirectories(uploadRoot);
  app.useStaticAssets(uploadRoot, {
    prefix: `${mediaUrlPrefix}/`,
    dotfiles: 'deny',
    index: false,
  });
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
