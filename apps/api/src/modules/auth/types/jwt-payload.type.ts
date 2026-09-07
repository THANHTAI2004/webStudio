import type { Request } from 'express';
import type { AdminRole, PublicAdmin } from '../../admins/schemas/admin.schema';

export interface JwtAccessPayload {
  sub: string;
  role: AdminRole;
  type: 'access';
}

export interface JwtRefreshPayload {
  sub: string;
  sid: string;
  type: 'refresh';
}

export type RequestWithCookies = Request & {
  cookies: Record<string, string | undefined>;
};

export type AuthenticatedAdminRequest = RequestWithCookies & {
  user?: PublicAdmin;
};
