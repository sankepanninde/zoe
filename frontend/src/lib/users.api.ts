import { api } from './api';
import type { User, UserRole, UserMinistryInput } from '@/types';

// ===========================================
// PAYLOADS
// ===========================================

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  role: UserRole;
  ministries: UserMinistryInput[];
}

export interface UpdateUserPayload {
  name?: string;
  phone?: string | null;
  role?: UserRole;
  active?: boolean;
  ministries?: UserMinistryInput[];
}

// ===========================================
// API
// ===========================================

export async function listUsers(onlyActive = false): Promise<User[]> {
  const { data } = await api.get<{ users: User[] }>('/users', {
    params: onlyActive ? { active: 'true' } : {},
  });
  return data.users;
}

export async function getUser(id: string): Promise<User> {
  const { data } = await api.get<{ user: User }>(`/users/${id}`);
  return data.user;
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const { data } = await api.post<{ user: User }>('/users', payload);
  return data.user;
}

export async function updateUser(
  id: string,
  payload: UpdateUserPayload
): Promise<User> {
  const { data } = await api.patch<{ user: User }>(`/users/${id}`, payload);
  return data.user;
}

export async function changeUserPassword(
  id: string,
  password: string
): Promise<void> {
  await api.patch(`/users/${id}/password`, { password });
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}