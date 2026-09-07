import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { PublicAdmin } from '../../admins/schemas/admin.schema';
import type { AuthenticatedAdminRequest } from '../types/jwt-payload.type';

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, context: ExecutionContext): PublicAdmin | undefined => {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedAdminRequest>();

    return request.user;
  },
);
