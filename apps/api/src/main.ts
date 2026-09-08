import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import {
  API_GLOBAL_PREFIX,
  normalizeMediaUrlPrefix,
  parseBoolean,
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
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  const trustProxy = parseBoolean(
    configService.get<string>('TRUST_PROXY'),
    false,
    'TRUST_PROXY',
  );
  const serveUploads = parseBoolean(
    configService.get<string>('SERVE_UPLOADS'),
    !isProduction,
    'SERVE_UPLOADS',
  );
  const swaggerEnabled = parseBoolean(
    configService.get<string>('SWAGGER_ENABLED'),
    !isProduction,
    'SWAGGER_ENABLED',
  );

  await ensureUploadDirectories(uploadRoot);
  app.getHttpAdapter().getInstance().disable('x-powered-by');
  app.use(helmet({
    contentSecurityPolicy: swaggerEnabled ? false : undefined,
    hsts: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }));

  if (trustProxy) {
    app.set('trust proxy', 1);
  }

  if (serveUploads) {
    app.useStaticAssets(uploadRoot, {
      prefix: `${mediaUrlPrefix}/`,
      dotfiles: 'deny',
      index: false,
    });
  }

  app.use(cookieParser());
  app.enableCors({
    origin: parseCorsOrigins(configService.get<string>('CORS_ORIGINS')),
    credentials: true,
  });
  app.setGlobalPrefix(API_GLOBAL_PREFIX);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  if (swaggerEnabled) {
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
  }

  await app.listen(port);

  new Logger('Bootstrap').log(
    [
      `Studio API running: http://localhost:${port}/${API_GLOBAL_PREFIX}`,
      `Swagger: ${swaggerEnabled ? `http://localhost:${port}/api/docs` : 'disabled'}`,
      `Static uploads: ${serveUploads ? mediaUrlPrefix : 'disabled'}`,
      `Trust proxy: ${trustProxy ? 'enabled' : 'disabled'}`,
    ].join('\n'),
  );
}

void bootstrap();
