import { z } from 'zod'

// Схемы валидации для пользователей
export const userRegistrationSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(8, 'Пароль должен содержать минимум 8 символов')
    .regex(/[A-Z]/, 'Пароль должен содержать хотя бы одну заглавную букву')
    .regex(/[a-z]/, 'Пароль должен содержать хотя бы одну строчную букву')
    .regex(/[0-9]/, 'Пароль должен содержать хотя бы одну цифру')
    .regex(/[^A-Za-z0-9]/, 'Пароль должен содержать хотя бы один специальный символ'),
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа').max(50, 'Имя слишком длинное'),
  role: z.enum(['CANDIDATE', 'EMPLOYER']).optional().default('CANDIDATE')
})

export const userLoginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Пароль обязателен')
})

// Схемы валидации для вакансий
export const jobCreationSchema = z.object({
  title: z.string().min(3, 'Название должно содержать минимум 3 символа').max(100, 'Название слишком длинное'),
  description: z.string().min(10, 'Описание должно содержать минимум 10 символов'),
  requirements: z.string().min(10, 'Требования должны содержать минимум 10 символов'),
  responsibilities: z.string().optional(),
  benefits: z.string().optional(),
  salaryMin: z.number().min(0, 'Минимальная зарплата не может быть отрицательной').optional(),
  salaryMax: z.number().min(0, 'Максимальная зарплата не может быть отрицательной').optional(),
  currency: z.enum(['RUB', 'USD', 'EUR']).default('RUB'),
  experienceLevel: z.enum(['JUNIOR', 'MIDDLE', 'SENIOR', 'LEAD', 'INTERN']),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP']),
  workFormat: z.enum(['REMOTE', 'OFFICE', 'HYBRID']),
  location: z.string().min(2, 'Локация должна содержать минимум 2 символа').optional(),
  isRemote: z.boolean().default(false),
  expiresAt: z.string().optional(),
  // Категория сайта обязательна для агрегирования на главной
  siteCategory: z.enum([
    'IT',
    'SALES',
    'MARKETING',
    'FINANCE',
    'LOGISTICS',
    'PRODUCTION',
    'CONSTRUCTION',
    'ADMIN',
    'HR',
    'HEALTHCARE',
    'OTHER'
  ]),
  skills: z.array(z.object({
    name: z.string().min(1, 'Навык обязателен'),
    category: z.string().optional()
  })).optional()
}).refine(data => {
  if (data.salaryMin && data.salaryMax && data.salaryMin > data.salaryMax) {
    return false
  }
  return true
}, {
  message: 'Минимальная зарплата не может быть больше максимальной',
  path: ['salaryMax']
})

export const jobUpdateSchema = jobCreationSchema.partial().extend({
  id: z.string().min(1, 'ID вакансии обязателен')
})

// Схемы валидации для профилей кандидатов
export const candidateProfileSchema = z.object({
  title: z.string().min(2, 'Должность должна содержать минимум 2 символа').optional(),
  bio: z.string().max(1000, 'Биография слишком длинная').optional(),
  location: z.string().min(2, 'Локация должна содержать минимум 2 символа').optional(),
  website: z.string().url('Некорректный URL').optional().or(z.literal('')),
  linkedin: z.string().url('Некорректный URL').optional().or(z.literal('')),
  github: z.string().url('Некорректный URL').optional().or(z.literal('')),
  portfolio: z.string().url('Некорректный URL').optional().or(z.literal('')),
  experience: z.number().min(0, 'Опыт работы не может быть отрицательным').max(50, 'Опыт работы слишком большой').optional(),
  salaryMin: z.number().min(0, 'Минимальная зарплата не может быть отрицательной').optional(),
  salaryMax: z.number().min(0, 'Максимальная зарплата не может быть отрицательной').optional(),
  currency: z.enum(['RUB', 'USD', 'EUR']).default('RUB')
}).refine(data => {
  if (data.salaryMin && data.salaryMax && data.salaryMin > data.salaryMax) {
    return false
  }
  return true
}, {
  message: 'Минимальная зарплата не может быть больше максимальной',
  path: ['salaryMax']
})

// Схемы валидации для профилей работодателей
export const employerProfileSchema = z.object({
  companyName: z.string().min(2, 'Название компании должно содержать минимум 2 символа').max(100, 'Название слишком длинное'),
  description: z.string().max(2000, 'Описание слишком длинное').optional(),
  website: z.string().url('Некорректный URL').optional().or(z.literal('')),
  industry: z.string().min(2, 'Отрасль должна содержать минимум 2 символа').optional(),
  size: z.string().min(1, 'Размер компании обязателен').optional(),
  location: z.string().min(2, 'Локация должна содержать минимум 2 символа').optional()
})

// Схемы валидации для откликов
export const applicationSchema = z.object({
  jobId: z.string().min(1, 'ID вакансии обязателен'),
  coverLetter: z.string().max(2000, 'Сопроводительное письмо слишком длинное').optional()
})

// Схемы валидации для сообщений
export const messageSchema = z.object({
  receiverId: z.string().min(1, 'ID получателя обязателен'),
  content: z.string().min(1, 'Сообщение не может быть пустым').max(5000, 'Сообщение слишком длинное'),
  applicationId: z.string().optional()
})

// Схемы валидации для уведомлений
export const notificationSchema = z.object({
  type: z.enum(['NEW_JOB', 'APPLICATION_STATUS', 'MESSAGE', 'INTERVIEW_INVITE', 'SYSTEM']),
  title: z.string().min(1, 'Заголовок обязателен').max(100, 'Заголовок слишком длинный'),
  message: z.string().min(1, 'Сообщение обязателен').max(500, 'Сообщение слишком длинное')
})

// Схемы валидации для отзывов о компаниях
export const companyReviewSchema = z.object({
  employerId: z.string().min(1, 'ID компании обязателен'),
  rating: z.number().min(1, 'Рейтинг должен быть от 1 до 5').max(5, 'Рейтинг должен быть от 1 до 5'),
  comment: z.string().max(1000, 'Комментарий слишком длинный').optional()
})

// Схемы валидации для поиска
export const searchSchema = z.object({
  q: z.string().optional(),
  page: z.string().regex(/^\d+$/, 'Страница должна быть числом').transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/, 'Лимит должен быть числом').transform(Number).default('12'),
  experience: z.string().optional(),
  employmentType: z.string().optional(),
  workFormat: z.string().optional(),
  location: z.string().optional(),
  category: z
    .enum([
      'IT',
      'SALES',
      'MARKETING',
      'FINANCE',
      'LOGISTICS',
      'PRODUCTION',
      'CONSTRUCTION',
      'ADMIN',
      'HR',
      'HEALTHCARE',
      'OTHER'
    ])
    .optional(),
  salaryMin: z.string().regex(/^\d+$/, 'Минимальная зарплата должна быть числом').transform(Number).optional(),
  salaryMax: z.string().regex(/^\d+$/, 'Максимальная зарплата должна быть числом').transform(Number).optional(),
  currency: z.enum(['RUB', 'USD', 'EUR']).default('RUB')
})

// Утилиты для валидации
export const validateRequest = <T>(schema: z.ZodSchema<T>, data: any): { success: true; data: T } | { success: false; error: z.ZodError } => {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error }
    }
    return { success: false, error: new z.ZodError([]) }
  }
}

export const formatValidationError = (error: z.ZodError): string => {
  return error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
}

// Типы для TypeScript
export type UserRegistration = z.infer<typeof userRegistrationSchema>
export type UserLogin = z.infer<typeof userLoginSchema>
export type JobCreation = z.infer<typeof jobCreationSchema>
export type JobUpdate = z.infer<typeof jobUpdateSchema>
export type CandidateProfile = z.infer<typeof candidateProfileSchema>
export type EmployerProfile = z.infer<typeof employerProfileSchema>
export type Application = z.infer<typeof applicationSchema>
export type Message = z.infer<typeof messageSchema>
export type Notification = z.infer<typeof notificationSchema>
export type CompanyReview = z.infer<typeof companyReviewSchema>
export type SearchParams = z.infer<typeof searchSchema>