import { apiRequest } from './client';

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin';
}

interface LoginResponse {
  success: true;
  data: {
    admin: AdminProfile;
  };
}

interface MeResponse {
  success: true;
  data: AdminProfile;
}

interface SuccessResponse {
  success: true;
}

export function login(input: {
  email: string;
  password: string;
}): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: input,
  });
}

export function logout(): Promise<SuccessResponse> {
  return apiRequest<SuccessResponse>('/auth/logout', {
    method: 'POST',
  });
}

export function refresh(): Promise<SuccessResponse> {
  return apiRequest<SuccessResponse>('/auth/refresh', {
    method: 'POST',
  });
}

export function getMe(): Promise<MeResponse> {
  return apiRequest<MeResponse>('/auth/me');
}
