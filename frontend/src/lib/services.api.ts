import { api } from './api';
import type { Service, ServiceType, ServiceAssignment } from '@/types';

export interface CreateServicePayload {
  serviceTypeId: string;
  title?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  location?: string | null;
  notes?: string | null;
}

export type UpdateServicePayload = Partial<CreateServicePayload>;

export interface ListServicesParams {
  from?: string;
  to?: string;
  serviceTypeId?: string;
}

// ===========================================
// SERVICE TYPES
// ===========================================

export async function listServiceTypes(): Promise<ServiceType[]> {
  const { data } = await api.get<{ serviceTypes: ServiceType[] }>('/service-types');
  return data.serviceTypes;
}

export async function seedDefaultServiceTypes(): Promise<ServiceType[]> {
  const { data } = await api.post<{ serviceTypes: ServiceType[] }>(
    '/service-types/seed-defaults',
    {}
  );
  return data.serviceTypes;
}

export async function createServiceType(input: {
  name: string;
  color?: string;
  icon?: string | null;
  description?: string | null;
}): Promise<ServiceType> {
  const { data } = await api.post<{ serviceType: ServiceType }>('/service-types', input);
  return data.serviceType;
}

// ===========================================
// SERVICES
// ===========================================

export async function listServices(params?: ListServicesParams): Promise<Service[]> {
  const { data } = await api.get<{ services: Service[] }>('/services', { params });
  return data.services;
}

export async function getService(id: string): Promise<Service> {
  const { data } = await api.get<{ service: Service }>(`/services/${id}`);
  return data.service;
}

export async function createService(payload: CreateServicePayload): Promise<Service> {
  const { data } = await api.post<{ service: Service }>('/services', payload);
  return data.service;
}

export async function updateService(
  id: string,
  payload: UpdateServicePayload
): Promise<Service> {
  const { data } = await api.patch<{ service: Service }>(`/services/${id}`, payload);
  return data.service;
}

export async function deleteService(id: string): Promise<void> {
  await api.delete(`/services/${id}`);
}

// ===========================================
// ASSIGNMENTS
// ===========================================

export async function createAssignment(
  serviceId: string,
  payload: { userId: string; position: string; notes?: string | null }
): Promise<ServiceAssignment> {
  const { data } = await api.post<{ assignment: ServiceAssignment }>(
    `/services/${serviceId}/assignments`,
    payload
  );
  return data.assignment;
}

export async function updateAssignment(
  serviceId: string,
  assignmentId: string,
  payload: { position?: string; notes?: string | null; status?: string }
): Promise<ServiceAssignment> {
  const { data } = await api.patch<{ assignment: ServiceAssignment }>(
    `/services/${serviceId}/assignments/${assignmentId}`,
    payload
  );
  return data.assignment;
}

export async function deleteAssignment(
  serviceId: string,
  assignmentId: string
): Promise<void> {
  await api.delete(`/services/${serviceId}/assignments/${assignmentId}`);
}