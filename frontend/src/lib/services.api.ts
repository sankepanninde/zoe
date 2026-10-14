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
  soundCheckTime?: string | null;
  sceneName?: string | null;
  patchName?: string | null;
  inputListCount?: number | null;
  setlistUrl?: string | null;
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
  payload: {
    userId: string;
    position: string;
    ministryId?: string | null;
    notes?: string | null;
  }
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
  payload: {
    position?: string;
    ministryId?: string | null;
    notes?: string | null;
    status?: string;
  }
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

export async function listMyServices(): Promise<Service[]> {
  const { data } = await api.get<{ services: Service[] }>('/services/me');
  return data.services;
}
// ===========================================
// SEED: Domingos del año
// ===========================================

export interface SeedYearResult {
  year: number;
  sundaysCount: number;
  servicesCreated: number;
  servicesSkipped: number;
  serviceTypeId: string;
}

export async function seedYear(year: number): Promise<SeedYearResult> {
  const { data } = await api.post<SeedYearResult>('/services/seed-year', { year });
  return data;
}
// ===========================================
// POSITION REQUIREMENTS
// ===========================================

export type Shift = 'MORNING' | 'AFTERNOON';

export interface PositionRequirement {
  id: string;
  serviceTypeId: string;
  shift: Shift;
  position: string;
  count: number;
  serviceType: { id: string; name: string; color: string; icon: string | null };
}

export interface RequirementInput {
  position: string;
  count: number;
}

export async function listRequirements(
  serviceTypeId?: string
): Promise<PositionRequirement[]> {
  const { data } = await api.get<{ requirements: PositionRequirement[] }>(
    '/position-requirements',
    { params: serviceTypeId ? { serviceTypeId } : {} }
  );
  return data.requirements;
}

export async function bulkUpsertRequirements(payload: {
  serviceTypeId: string;
  shift: Shift;
  requirements: RequirementInput[];
}): Promise<PositionRequirement[]> {
  const { data } = await api.post<{ requirements: PositionRequirement[] }>(
    '/position-requirements/bulk',
    payload
  );
  return data.requirements;
}

export async function deleteRequirement(id: string): Promise<void> {
  await api.delete(`/position-requirements/${id}`);
}

// ===========================================
// AUTO-ASSIGN
// ===========================================

export interface AutoAssignProposal {
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string | null;
  serviceTypeName: string;
  shift: Shift;
  assignments: Array<{
    position: string;
    userId: string;
    userName: string;
    ministryId: string;
    ministryName: string;
  }>;
  unassigned: Array<{ position: string; reason: string }>;
  existingAssignments: number;
}

export interface AutoAssignResult {
  year: number;
  month: number;
  dryRun: boolean;
  preview: AutoAssignProposal[];
  summary: {
    servicesProcessed: number;
    assignmentsCreated: number;
    positionsSkipped: number;
    positionsUnassigned: number;
  };
}

export async function autoAssign(payload: {
  year: number;
  month: number;
  dryRun: boolean;
}): Promise<AutoAssignResult> {
  const { data } = await api.post<AutoAssignResult>(
    '/services/auto-assign',
    payload
  );
  return data;
}