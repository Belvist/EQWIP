import { ExperienceLevel, EmploymentType, WorkFormat, Currency, SiteCategory } from '@prisma/client';

export interface JobData {
  id: string;
  title: string;
  description: string;
  requirements: string;
  responsibilities?: string;
  benefits?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency: Currency;
  experienceLevel: ExperienceLevel;
  employmentType: EmploymentType;
  workFormat: WorkFormat;
  location?: string;
  isRemote: boolean;
  isActive: boolean;
  isPromoted: boolean;
  viewsCount: number;
  applicationsCount: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  employerId: string;
  siteCategory?: SiteCategory;
}

export interface JobFilters {
  query?: string;
  experience?: ExperienceLevel;
  employmentType?: EmploymentType;
  workFormat?: WorkFormat;
  location?: string;
  category?: SiteCategory;
  salaryMin?: number;
  salaryMax?: number;
  isRemote?: boolean;
  page?: number;
  limit?: number;
}

export interface JobSearchResult {
  jobs: JobData[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface JobCreateData {
  title: string;
  description: string;
  requirements: string;
  responsibilities?: string;
  benefits?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency: Currency;
  experienceLevel: ExperienceLevel;
  employmentType: EmploymentType;
  workFormat: WorkFormat;
  location?: string;
  isRemote?: boolean;
  siteCategory?: SiteCategory;
  skills?: string[];
}

export interface JobUpdateData extends Partial<JobCreateData> {
  isActive?: boolean;
  isPromoted?: boolean;
}
