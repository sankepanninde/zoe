import { api } from './api';
import type { Ministry } from '@/types';

export interface MinistryWithMyRole extends Ministry {
  isLeader: boolean;
  position: string | null;
}

export async function listMinistries(): Promise<Ministry[]> {
  const { data } = await api.get<{ ministries: Ministry[] }>('/ministries');
  return data.ministries;
}

export async function listMyMinistries(): Promise<MinistryWithMyRole[]> {
  const { data } = await api.get<{ ministries: MinistryWithMyRole[] }>(
    '/ministries/mine'
  );
  return data.ministries;
}

export async function createMinistry(input: {
  name: string;
  color?: string;
  icon?: string | null;
}): Promise<Ministry> {
  const { data } = await api.post<{ ministry: Ministry }>('/ministries', input);
  return data.ministry;
}

export async function updateMinistry(
  id: string,
  input: { name?: string; color?: string; icon?: string | null; active?: boolean }
): Promise<Ministry> {
  const { data } = await api.patch<{ ministry: Ministry }>(
    `/ministries/${id}`,
    input
  );
  return data.ministry;
}

export async function deleteMinistry(id: string): Promise<void> {
  await api.delete(`/ministries/${id}`);
}