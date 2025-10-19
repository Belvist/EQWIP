/**
 * Базовый класс для всех сервисов
 * Предоставляет общую функциональность для работы с базой данных и обработки ошибок
 */
export abstract class BaseService {
  protected db: any;
  protected logger: Console;

  constructor(db: any) {
    this.db = db;
    this.logger = console;
  }

  /**
   * Обработка ошибок с логированием
   */
  protected handleError(error: any, context: string): never {
    this.logger.error(`[${this.constructor.name}] ${context}:`, error);
    throw new Error(`${context}: ${error.message || 'Unknown error'}`);
  }

  /**
   * Валидация входных данных
   */
  protected validateInput<T>(data: any, schema: any): T {
    try {
      return schema.parse(data);
    } catch (error) {
      this.handleError(error, 'Validation failed');
    }
  }

  /**
   * Безопасное выполнение операций с базой данных
   */
  protected async safeDbOperation<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error, context);
    }
  }
}
