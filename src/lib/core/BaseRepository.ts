import { PrismaClient } from '@prisma/client';

/**
 * Базовый репозиторий для работы с базой данных
 * Предоставляет общие методы для CRUD операций
 */
export abstract class BaseRepository<T> {
  protected db: PrismaClient;
  protected model: any;

  constructor(db: PrismaClient, model: any) {
    this.db = db;
    this.model = model;
  }

  /**
   * Создание записи
   */
  async create(data: Partial<T>): Promise<T> {
    return await this.model.create({ data });
  }

  /**
   * Поиск по ID
   */
  async findById(id: string): Promise<T | null> {
    return await this.model.findUnique({ where: { id } });
  }

  /**
   * Поиск по условию
   */
  async findMany(where: any, options?: any): Promise<T[]> {
    return await this.model.findMany({ where, ...options });
  }

  /**
   * Обновление записи
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    return await this.model.update({ where: { id }, data });
  }

  /**
   * Удаление записи
   */
  async delete(id: string): Promise<T> {
    return await this.model.delete({ where: { id } });
  }

  /**
   * Подсчет записей
   */
  async count(where?: any): Promise<number> {
    return await this.model.count({ where });
  }

  /**
   * Пагинация
   */
  async paginate(
    page: number = 1,
    limit: number = 10,
    where?: any,
    orderBy?: any
  ): Promise<{ data: T[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      this.model.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.model.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }
}
