import { PrismaClient } from '@prisma/client';
import { BaseService } from '../core/BaseService';
import { JobRepository } from '../repositories/JobRepository';
import { JobData, JobFilters, JobSearchResult, JobCreateData, JobUpdateData } from '../types/Job';
import { jobCreationSchema, searchSchema } from '../validation';

export class JobService extends BaseService {
  private jobRepository: JobRepository;

  constructor(db: PrismaClient) {
    super(db);
    this.jobRepository = new JobRepository(db);
  }

  /**
   * Поиск вакансий
   */
  async searchJobs(filters: JobFilters): Promise<JobSearchResult> {
    const validatedFilters = this.validateInput(filters, searchSchema);
    return await this.safeDbOperation(
      () => this.jobRepository.search(validatedFilters),
      'Search jobs'
    );
  }

  /**
   * Получение вакансии по ID
   */
  async getJobById(id: string): Promise<JobData | null> {
    return await this.safeDbOperation(
      () => this.jobRepository.findByIdWithDetails(id),
      `Get job by ID: ${id}`
    );
  }

  /**
   * Получение популярных вакансий
   */
  async getFeaturedJobs(limit: number = 3): Promise<JobData[]> {
    return await this.safeDbOperation(
      () => this.jobRepository.getFeatured(limit),
      'Get featured jobs'
    );
  }

  /**
   * Создание вакансии
   */
  async createJob(data: JobCreateData, employerId: string): Promise<JobData> {
    const validatedData = this.validateInput(data, jobCreationSchema);
    
    return await this.safeDbOperation(async () => {
      const { skills, ...jobData } = validatedData;
      
      const job = await this.jobRepository.create({
        ...jobData,
        employerId,
        isActive: false, // Требует модерации
      });

      // Добавление навыков
      if (skills && skills.length > 0) {
        await this.addJobSkills(job.id, skills);
      }

      return await this.jobRepository.findByIdWithDetails(job.id);
    }, 'Create job');
  }

  /**
   * Обновление вакансии
   */
  async updateJob(id: string, data: JobUpdateData): Promise<JobData> {
    return await this.safeDbOperation(async () => {
      const { skills, ...jobData } = data;
      
      await this.jobRepository.update(id, jobData);

      // Обновление навыков
      if (skills) {
        await this.updateJobSkills(id, skills);
      }

      return await this.jobRepository.findByIdWithDetails(id);
    }, `Update job: ${id}`);
  }

  /**
   * Удаление вакансии
   */
  async deleteJob(id: string): Promise<void> {
    await this.safeDbOperation(
      () => this.jobRepository.delete(id),
      `Delete job: ${id}`
    );
  }

  /**
   * Увеличение счетчика просмотров
   */
  async incrementJobViews(id: string): Promise<void> {
    await this.safeDbOperation(
      () => this.jobRepository.incrementViews(id),
      `Increment views for job: ${id}`
    );
  }

  /**
   * Получение популярных тегов
   */
  async getPopularTags(limit: number = 10): Promise<string[]> {
    return await this.safeDbOperation(
      () => this.jobRepository.getPopularTags(limit),
      'Get popular tags'
    );
  }

  /**
   * Получение статистики
   */
  async getStats(): Promise<{
    totalJobs: number;
    totalCompanies: number;
    totalCandidates: number;
  }> {
    return await this.safeDbOperation(
      () => this.jobRepository.getStats(),
      'Get job statistics'
    );
  }

  /**
   * Добавление навыков к вакансии
   */
  private async addJobSkills(jobId: string, skillNames: string[]): Promise<void> {
    for (const skillName of skillNames) {
      // Создание или получение навыка
      const skill = await this.db.skill.upsert({
        where: { name: skillName },
        update: {},
        create: { name: skillName }
      });

      // Связывание навыка с вакансией
      await this.db.jobSkill.create({
        data: {
          jobId,
          skillId: skill.id
        }
      });
    }
  }

  /**
   * Обновление навыков вакансии
   */
  private async updateJobSkills(jobId: string, skillNames: string[]): Promise<void> {
    // Удаление старых связей
    await this.db.jobSkill.deleteMany({
      where: { jobId }
    });

    // Добавление новых навыков
    await this.addJobSkills(jobId, skillNames);
  }
}
