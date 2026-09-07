import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { MongooseModuleFactoryOptions } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';

const logger = new Logger('MongoDB');

export function createMongooseOptions(
  configService: ConfigService,
): MongooseModuleFactoryOptions {
  const uri = configService.get<string>('MONGODB_URI');

  if (!uri) {
    throw new Error('MONGODB_URI is required to start the Studio API.');
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
