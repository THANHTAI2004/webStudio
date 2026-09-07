import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch(HttpException)
export class MediaUploadExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const body = exception.getResponse();

    if (hasErrorCode(body)) {
      response.status(exception.getStatus()).json(body);
      return;
    }

    if (exception instanceof PayloadTooLargeException) {
      response.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
        code: 'FILE_TOO_LARGE',
        message: 'Uploaded image exceeds the configured file size limit.',
      });
      return;
    }

    if (exception instanceof UnsupportedMediaTypeException) {
      response.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).json({
        code: 'UNSUPPORTED_MEDIA_TYPE',
        message: 'Only JPEG, PNG, and WebP images are supported.',
      });
      return;
    }

    if (exception instanceof BadRequestException) {
      response.status(HttpStatus.BAD_REQUEST).json({
        code: 'UPLOAD_FAILED',
        message: 'The upload request could not be processed.',
      });
      return;
    }

    response.status(exception.getStatus()).json(body);
  }
}

function hasErrorCode(value: unknown): value is { code: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    typeof (value as { code: unknown }).code === 'string'
  );
}
