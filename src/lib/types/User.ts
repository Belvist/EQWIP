import { UserRole } from '@prisma/client';

export interface UserData {
  id: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  avatar?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  lastSeenAt?: Date;
  twoFactorEnabled: boolean;
  googleId?: string;
  githubId?: string;
  vkId?: string;
  telegramId?: string;
}

export interface CandidateProfile {
  id: string;
  userId: string;
  title?: string;
  bio?: string;
  location?: string;
  phone?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  resumeUrl?: string;
  experience?: number;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  preferences?: any;
}

export interface EmployerProfile {
  id: string;
  userId: string;
  companyName: string;
  description?: string;
  website?: string;
  industry?: string;
  size?: string;
  location?: string;
  logo?: string;
  createdAt: Date;
  updatedAt: Date;
  notifyOnUniversityPost: boolean;
}

export interface UniversityProfile {
  id: string;
  name: string;
  website?: string;
  contactEmail?: string;
  logo?: string;
  description?: string;
  location?: string;
  establishedYear?: number;
  studentCount?: number;
  specialties?: string;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
}

export interface UserCreateData {
  email: string;
  name?: string;
  password?: string;
  role?: UserRole;
  avatar?: string;
}

export interface UserUpdateData {
  name?: string;
  avatar?: string;
  lastSeenAt?: Date;
}
