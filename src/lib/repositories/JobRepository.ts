import { PrismaClient, Job, ExperienceLevel, EmploymentType, WorkFormat, SiteCategory } from '@prisma/client';
import { BaseRepository } from '../core/BaseRepository';
import { JobData, JobFilters, JobSearchResult } from '../types/Job';

export class JobRepository extends BaseRepository<JobData> {
  constructor(db: PrismaClient) {
    super(db, db.job);
  }

  /**
   * Поиск вакансий с фильтрами
   */
  async search(filters: JobFilters): Promise<JobSearchResult> {
    const {
      query,
      experience,
      employmentType,
      workFormat,
      location,
      category,
      salaryMin,
      salaryMax,
      isRemote,
      page = 1,
      limit = 10
    } = filters;

    const where: any = {
      isActive: true,
    };

    // Текстовый поиск
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { requirements: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Фильтры
    if (experience) where.experienceLevel = experience;
    if (employmentType) where.employmentType = employmentType;
    if (workFormat) where.workFormat = workFormat;
    if (category) where.siteCategory = category;
    if (isRemote !== undefined) where.isRemote = isRemote;

    // Фильтр по локации
    if (location && location !== 'везде') {
      where.location = {
        contains: location,
        mode: 'insensitive'
      };
    }

    // Фильтр по зарплате
    if (salaryMin || salaryMax) {
      where.OR = [
        ...(where.OR || []),
        {
          AND: [
            ...(salaryMin ? [{ salaryMin: { gte: salaryMin } }] : []),
            ...(salaryMax ? [{ salaryMax: { lte: salaryMax } }] : []),
          ]
        }
      ];
    }

    const result = await this.paginate(page, limit, where, { createdAt: 'desc' });

    return {
      jobs: result.data as JobData[],
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasMore: result.page * result.limit < result.total,
    };
  }

  /**
   * Получение популярных вакансий
   */
  async getFeatured(limit: number = 3): Promise<JobData[]> {
    const jobs = await this.model.findMany({
      where: { isActive: true },
      orderBy: [
        { isPromoted: 'desc' },
        { viewsCount: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      include: {
        employer: {
          select: {
            companyName: true,
            logo: true
          }
        },
        skills: {
          include: {
            skill: true
          }
        }
      }
    });

    return jobs.map(job => ({
      ...job,
      companyName: job.employer.companyName,
      companyLogo: job.employer.logo,
      skills: job.skills.map(js => js.skill.name)
    })) as JobData[];
  }

  /**
   * Получение вакансии по ID с полной информацией
   */
  async findByIdWithDetails(id: string): Promise<JobData | null> {
    const job = await this.model.findUnique({
      where: { id },
      include: {
        employer: {
          select: {
            companyName: true,
            logo: true,
            description: true,
            website: true,
            location: true
          }
        },
        skills: {
          include: {
            skill: true
          }
        }
      }
    });

    if (!job) return null;

    return {
      ...job,
      companyName: job.employer.companyName,
      companyLogo: job.employer.logo,
      skills: job.skills.map(js => js.skill.name)
    } as JobData;
  }

  /**
   * Увеличение счетчика просмотров
   */
  async incrementViews(id: string): Promise<void> {
    await this.model.update({
      where: { id },
      data: {
        viewsCount: {
          increment: 1
        }
      }
    });
  }

  /**
   * Получение популярных тегов
   */
  async getPopularTags(limit: number = 10): Promise<string[]> {
    const tags = await this.db.skill.findMany({
      where: {
        jobSkills: {
          some: {
            job: {
              isActive: true
            }
          }
        }
      },
      include: {
        _count: {
          select: {
            jobSkills: {
              where: {
                job: {
                  isActive: true
                }
              }
            }
          }
        }
      },
      orderBy: {
        jobSkills: {
          _count: 'desc'
        }
      },
      take: limit
    });

    return tags.map(tag => tag.name);
  }

  /**
   * Получение статистики по вакансиям
   */
  async getStats(): Promise<{
    totalJobs: number;
    totalCompanies: number;
    totalCandidates: number;
  }> {
    const [totalJobs, totalCompanies, totalCandidates] = await Promise.all([
      this.model.count({ where: { isActive: true } }),
      this.db.employerProfile.count(),
      this.db.candidateProfile.count()
    ]);

    return {
      totalJobs,
      totalCompanies,
      totalCandidates
    };
  }
}
