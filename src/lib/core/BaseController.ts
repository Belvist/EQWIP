import { NextRequest, NextResponse } from 'next/server';

/**
 * Базовый контроллер для API эндпоинтов
 * Предоставляет общие методы для обработки HTTP запросов
 */
export abstract class BaseController {
  protected logger: Console;

  constructor() {
    this.logger = console;
  }

  /**
   * Обработка GET запросов
   */
  async GET(request: NextRequest): Promise<NextResponse> {
    return this.methodNotAllowed();
  }

  /**
   * Обработка POST запросов
   */
  async POST(request: NextRequest): Promise<NextResponse> {
    return this.methodNotAllowed();
  }

  /**
   * Обработка PUT запросов
   */
  async PUT(request: NextRequest): Promise<NextResponse> {
    return this.methodNotAllowed();
  }

  /**
   * Обработка DELETE запросов
   */
  async DELETE(request: NextRequest): Promise<NextResponse> {
    return this.methodNotAllowed();
  }

  /**
   * Обработка PATCH запросов
   */
  async PATCH(request: NextRequest): Promise<NextResponse> {
    return this.methodNotAllowed();
  }

  /**
   * Успешный ответ
   */
  protected success(data: any, status: number = 200): NextResponse {
    return NextResponse.json(data, { status });
  }

  /**
   * Ответ с ошибкой
   */
  protected error(message: string, status: number = 400, details?: any): NextResponse {
    return NextResponse.json(
      { error: message, ...(details && { details }) },
      { status }
    );
  }

  /**
   * Метод не разрешен
   */
  protected methodNotAllowed(): NextResponse {
    return this.error('Method not allowed', 405);
  }

  /**
   * Неавторизованный доступ
   */
  protected unauthorized(): NextResponse {
    return this.error('Unauthorized', 401);
  }

  /**
   * Доступ запрещен
   */
  protected forbidden(): NextResponse {
    return this.error('Forbidden', 403);
  }

  /**
   * Ресурс не найден
   */
  protected notFound(): NextResponse {
    return this.error('Not found', 404);
  }

  /**
   * Внутренняя ошибка сервера
   */
  protected internalError(error: any): NextResponse {
    this.logger.error('Internal server error:', error);
    return this.error('Internal server error', 500);
  }

  /**
   * Валидация сессии
   */
  protected async validateSession(session: any): Promise<boolean> {
    return !!session?.user;
  }

  /**
   * Извлечение параметров из URL
   */
  protected getSearchParams(request: NextRequest): URLSearchParams {
    return new URL(request.url).searchParams;
  }

  /**
   * Парсинг JSON из тела запроса
   */
  protected async parseJson(request: NextRequest): Promise<any> {
    try {
      return await request.json();
    } catch (error) {
      throw new Error('Invalid JSON');
    }
  }
}
