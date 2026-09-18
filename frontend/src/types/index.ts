export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'LEADER' | 'TECHNICIAN';
export type Plan = 'FREE' | 'BASIC' | 'STANDARD' | 'PRO';
export type ServiceStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';
export type AssignmentStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';

export interface Church {
  id: string;
  name: string;
  slug: string;
  timezone?: string;
  country?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  plan: Plan;
  trialEndsAt: string | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  churchId: string;
  phone?: string | null;
  position?: string | null;
  avatarUrl?: string | null;
  church?: Church;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}
// ===========================================
// SERVICIOS
// ===========================================

export interface ServiceType {
  id: string;
  churchId: string;
  name: string;
  description?: string | null;
  color: string;
  icon?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceAssignment {
  id: string;
  serviceId: string;
  userId: string;
  position: string;
  status: AssignmentStatus;
  confirmedAt?: string | null;
  notes?: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    position?: string | null;
  };
}

export interface Service {
  id: string;
  churchId: string;
  serviceTypeId: string;
  serviceType: {
    id: string;
    name: string;
    color: string;
    icon?: string | null;
  };
  title?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  location?: string | null;
  notes?: string | null;
  status: ServiceStatus;
  assignments: ServiceAssignment[];
  createdAt: string;
  updatedAt: string;
}