import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { MongooseModuleFactoryOptions } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import { buildMongoUriFromParts } from '../config/env';

const logger = new Logger('MongoDB');

export function createMongooseOptions(
  configService: ConfigService,
): MongooseModuleFactoryOptions {
  const uri =
    configService.get<string>('MONGODB_URI')?.trim() ||
    buildMongoUriFromParts({
      host: configService.get<string>('MONGO_HOST'),
      port: configService.get<string>('MONGO_PORT'),
      database: configService.get<string>('MONGO_DATABASE'),
      username: configService.get<string>('MONGO_APP_USERNAME'),
      password: configService.get<string>('MONGO_APP_PASSWORD'),
      authSource: configService.get<string>('MONGO_AUTH_SOURCE'),
    });

  if (!uri) {
    throw new Error(
      'MONGODB_URI or MONGO_* application database variables are required to start the Studio API.',
    );
  }

  return {
    uri,
    lazyConnection: true,
    retryAttempts: 5,
    retryDelay: 1000,
    serverSelectionTimeoutMS: 5000,
    connectionFactory: (connection: Connection) => {
      connection.on('error', (error: Error) => {
        logger.error(`MongoDB connection error: ${error.message}`);
      });

      return connection;
    },
  };
}
