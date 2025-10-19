import { NextRequest } from 'next/server';
import { BaseController } from '../core/BaseController';
import { JobService } from '../services/JobService';
import { db } from '../db';

export class JobController extends BaseController {
  private jobService: JobService;

  constructor() {
    super();
    this.jobService = new JobService(db);
  }

  /**
   * GET /api/jobs - Поиск вакансий
   */
  async GET(request: NextRequest) {
    try {
      const searchParams = this.getSearchParams(request);
      const filters = {
        query: searchParams.get('q') || undefined,
        experience: searchParams.get('experience') as any,
        employmentType: searchParams.get('employmentType') as any,
        workFormat: searchParams.get('workFormat') as any,
        location: searchParams.get('location') || undefined,
        category: searchParams.get('category') as any,
        salaryMin: searchParams.get('salaryMin') ? parseInt(searchParams.get('salaryMin')!) : undefined,
        salaryMax: searchParams.get('salaryMax') ? parseInt(searchParams.get('salaryMax')!) : undefined,
        isRemote: searchParams.get('isRemote') === 'true',
        page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
      };

      const result = await this.jobService.searchJobs(filters);
      return this.success(result);
    } catch (error) {
      return this.internalError(error);
    }
  }

  /**
   * POST /api/jobs - Создание вакансии
   */
  async POST(request: NextRequest) {
    try {
      const data = await this.parseJson(request);
      const employerId = data.employerId; // Должно быть получено из сессии

      if (!employerId) {
        return this.unauthorized();
      }

      const job = await this.jobService.createJob(data, employerId);
      return this.success(job, 201);
    } catch (error) {
      return this.internalError(error);
    }
  }
}
