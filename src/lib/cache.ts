import Redis from 'ioredis'

// Инициализация Redis клиента
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  connectTimeout: 10000,
  commandTimeout: 5000,
})

// Обработка ошибок подключения
redis.on('error', (err) => {
  console.error('Redis connection error:', err)
})

redis.on('connect', () => {
  console.log('Connected to Redis')
})

// Интерфейс для кэшированных данных
export interface CacheOptions {
  ttl?: number // Time to live in seconds
  key?: string // Custom cache key
}

// Класс для работы с кэшем
export class CacheManager {
  private static instance: CacheManager
  private redis: Redis

  private constructor() {
    this.redis = redis
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  // Генерация ключа кэша
  private generateKey(prefix: string, params: any): string {
    const paramString = JSON.stringify(params)
    return `${prefix}:${Buffer.from(paramString).toString('base64')}`
  }

  // Получение данных из кэша
  async get<T>(prefix: string, params: any, options?: CacheOptions): Promise<T | null> {
    try {
      const key = options?.key || this.generateKey(prefix, params)
      const cached = await this.redis.get(key)
      
      if (cached) {
        return JSON.parse(cached) as T
      }
      
      return null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  // Сохранение данных в кэш
  async set<T>(prefix: string, params: any, data: T, options?: CacheOptions): Promise<void> {
    try {
      const key = options?.key || this.generateKey(prefix, params)
      const ttl = options?.ttl || 3600 // 1 час по умолчанию
      
      await this.redis.setex(key, ttl, JSON.stringify(data))
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  // Удаление данных из кэша
  async delete(prefix: string, params: any): Promise<void> {
    try {
      const key = this.generateKey(prefix, params)
      await this.redis.del(key)
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }

  // Очистка кэша по префиксу
  async clearByPrefix(prefix: string): Promise<void> {
    try {
      const keys = await this.redis.keys(`${prefix}:*`)
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
    } catch (error) {
      console.error('Cache clear by prefix error:', error)
    }
  }

  // Инкремент счетчика
  async increment(key: string, ttl?: number): Promise<number> {
    try {
      const result = await this.redis.incr(key)
      if (ttl) {
        await this.redis.expire(key, ttl)
      }
      return result
    } catch (error) {
      console.error('Cache increment error:', error)
      return 0
    }
  }

  // Декремент счетчика
  async decrement(key: string, ttl?: number): Promise<number> {
    try {
      const result = await this.redis.decr(key)
      if (ttl) {
        await this.redis.expire(key, ttl)
      }
      return result
    } catch (error) {
      console.error('Cache decrement error:', error)
      return 0
    }
  }

  // Проверка существования ключа
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key)
      return result === 1
    } catch (error) {
      console.error('Cache exists error:', error)
      return false
    }
  }

  // Установка времени жизни для ключа
  async expire(key: string, ttl: number): Promise<void> {
    try {
      await this.redis.expire(key, ttl)
    } catch (error) {
      console.error('Cache expire error:', error)
    }
  }

  // Получение оставшегося времени жизни
  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key)
    } catch (error) {
      console.error('Cache TTL error:', error)
      return -1
    }
  }
}

// Экспорт экземпляра менеджера кэша
export const cache = CacheManager.getInstance()

// Декоратор для кэширования результатов функций
export function cacheResult(prefix: string, options?: CacheOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cacheKey = { args, method: propertyKey }
      
      // Пробуем получить из кэша
      const cached = await cache.get(prefix, cacheKey, options)
      if (cached) {
        return cached
      }

      // Если нет в кэше, выполняем метод
      const result = await originalMethod.apply(this, args)
      
      // Сохраняем в кэш
      await cache.set(prefix, cacheKey, result, options)
      
      return result
    }
  }
}

// Утилиты для кэширования популярных запросов
export const cacheKeys = {
  // Ключи для вакансий
  jobs: {
    featured: 'jobs:featured',
    search: 'jobs:search',
    byId: (id: string) => `jobs:byId:${id}`,
    byEmployer: (employerId: string) => `jobs:byEmployer:${employerId}`,
    byCategory: (category: string) => `jobs:byCategory:${category}`,
  },
  
  // Ключи для компаний
  companies: {
    all: 'companies:all',
    byId: (id: string) => `companies:byId:${id}`,
    popular: 'companies:popular',
  },
  
  // Ключи для пользователей
  users: {
    profile: (userId: string) => `users:profile:${userId}`,
    stats: (userId: string) => `users:stats:${userId}`,
  },
  
  // Ключи для аналитики
  analytics: {
    jobViews: (jobId: string) => `analytics:jobViews:${jobId}`,
    applicationStats: (jobId: string) => `analytics:applicationStats:${jobId}`,
    platformStats: 'analytics:platformStats',
  },
  
  // Ключи для рекомендаций
  recommendations: {
    forUser: (userId: string) => `recommendations:forUser:${userId}`,
    forJob: (jobId: string) => `recommendations:forJob:${jobId}`,
  },
}

// Функция для кэширования с fallback
export async function cachedFetch<T>(
  prefix: string,
  params: any,
  fetchFn: () => Promise<T>,
  options?: CacheOptions
): Promise<T> {
  // Пробуем получить из кэша
  const cached = await cache.get<T>(prefix, params, options)
  if (cached) {
    return cached
  }

  // Если нет в кэше, получаем данные
  const data = await fetchFn()
  
  // Сохраняем в кэш
  await cache.set(prefix, params, data, options)
  
  return data
}

// Функция для инвалидации кэша
export async function invalidateCache(patterns: string[]): Promise<void> {
  try {
    for (const pattern of patterns) {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    }
  } catch (error) {
    console.error('Cache invalidation error:', error)
  }
}

// Middleware для кэширования API ответов
export function withCache(prefix: string, options?: CacheOptions) {
  return (handler: (req: any, res: any) => Promise<any>) => {
    return async (req: any, res: any) => {
      const cacheKey = {
        url: req.url,
        method: req.method,
        headers: req.headers,
        body: req.body
      }

      // Для GET запросов пробуем получить из кэша
      if (req.method === 'GET') {
        const cached = await cache.get(prefix, cacheKey, options)
        if (cached) {
          return res.json(cached)
        }
      }

      // Выполняем обработчик
      const result = await handler(req, res)

      // Для GET запросов кэшируем результат
      if (req.method === 'GET' && res.statusCode === 200) {
        await cache.set(prefix, cacheKey, result, options)
      }

      return result
    }
  }
}