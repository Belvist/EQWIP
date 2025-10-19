# EQWIP — платформа поиска работы на базе искусственного интеллекта

![EQWIP Logo](public/eqwipdark.png)

**EQWIP** - это современная платформа для поиска работы в IT-сфере, использующая искусственный интеллект для подбора идеальных вакансий и кандидатов.

[![GitHub stars](https://img.shields.io/github/stars/Belvist/EQWIP?style=social)](https://github.com/Belvist/EQWIP)
[![GitHub forks](https://img.shields.io/github/forks/Belvist/EQWIP?style=social)](https://github.com/Belvist/EQWIP)
[![GitHub issues](https://img.shields.io/github/issues/Belvist/EQWIP)](https://github.com/Belvist/EQWIP/issues)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Особенности

### Для соискателей
- **AI-рекомендации** - умный подбор вакансий на основе профиля и предпочтений
- **Tinder-интерфейс** - удобный свайп-интерфейс для быстрого просмотра вакансий
- **Карьерная карта** - визуализация карьерного пути и рекомендации по развитию
- **AI-оптимизация резюме** - улучшение резюме под конкретные вакансии
- **Умный поиск** - поиск по навыкам, опыту, локации и другим критериям

### Для работодателей
- **AI-подбор кандидатов** - автоматический поиск подходящих специалистов
- **Аналитика** - подробная статистика по вакансиям и откликам
- **Управление заявками** - удобный интерфейс для работы с откликами
- **Продвижение вакансий** - возможность выделить вакансию

### Для университетов
- **Стажировки** - размещение предложений о стажировках
- **Сотрудничество с компаниями** - поиск партнеров для студентов

## 🛠️ Установка и запуск

### Предварительные требования

- **Node.js 18+** - [Скачать](https://nodejs.org/)
- **Git** - [Скачать](https://git-scm.com/)
- **SQLite** (встроенная) или **PostgreSQL 13+** (опционально)

### Пошаговая установка

#### 1. Клонирование репозитория

```bash
git clone https://github.com/Belvist/EQWIP.git
cd EQWIP
```

#### 2. Установка зависимостей

```bash
npm install
```

**Если возникают ошибки с зависимостями:**
```bash
npm install --legacy-peer-deps
```

#### 3. Настройка переменных окружения

```bash
# Копируем файл с примером переменных
cp env.example .env
```

**Отредактируйте файл `.env`** (он уже содержит все необходимые настройки):

```env
# База данных (SQLite - по умолчанию)
DATABASE_URL="file:./dev.db"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-this-in-production"

# AI Provider (Ollama для локальной разработки)
AI_PROVIDER="ollama"
OLLAMA_URL="http://127.0.0.1:11434"
OLLAMA_CHAT_MODEL="qwen2.5:7b-instruct"
OLLAMA_EMBED_MODEL="nomic-embed-text:latest"

# Email (отключен в dev режиме)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@eqwip.com"
```

#### 4. Настройка базы данных

```bash
# Генерация Prisma клиента
npm run db:generate

# Применение миграций (создание таблиц)
npm run db:migrate

# Заполнение тестовыми данными
npm run db:seed
```

#### 5. Запуск в режиме разработки

```bash
npm run dev
```

**Приложение будет доступно по адресу:** http://localhost:3000

## 🔧 Конфигурация

### Переменные окружения

Основные переменные уже настроены в `env.example`:

```env
# База данных
DATABASE_URL="file:./dev.db"  # SQLite (по умолчанию)
# DATABASE_URL="postgresql://username:password@localhost:5432/eqwip_db"  # PostgreSQL

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# AI Provider
AI_PROVIDER="ollama"
OLLAMA_URL="http://127.0.0.1:11434"
OLLAMA_CHAT_MODEL="qwen2.5:7b-instruct"
OLLAMA_EMBED_MODEL="nomic-embed-text:latest"

# Email (опционально)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@eqwip.com"
```

### Настройка Ollama (для AI функций)

**Шаг 1:** Установите Ollama
- Windows: [Скачать](https://ollama.ai/download/windows)
- macOS: `brew install ollama`
- Linux: `curl -fsSL https://ollama.ai/install.sh | sh`

**Шаг 2:** Запустите Ollama
```bash
ollama serve
```

**Шаг 3:** Загрузите модели (в новом терминале)
```bash
ollama pull qwen2.5:7b-instruct
ollama pull nomic-embed-text:latest
```

**Примечание:** AI функции работают без Ollama, но с ограниченным функционалом.

## 📊 База данных

Проект использует **SQLite** по умолчанию (легко переключиться на PostgreSQL).

### Основные таблицы:
- **Users** - пользователи системы
- **Jobs** - вакансии
- **Applications** - заявки на вакансии
- **Skills** - навыки и технологии
- **Companies** - компании-работодатели
- **Universities** - университеты и образовательные учреждения

### Управление базой данных:

```bash
# Просмотр базы данных
npx prisma studio

# Сброс базы данных
npm run db:reset

# Применение миграций
npm run db:migrate

# Заполнение тестовыми данными
npm run db:seed
```

## 🎨 UI/UX

### Дизайн-система
- **Цветовая схема:** Монохромная с акцентами
- **Типографика:** Geist Sans и Geist Mono
- **Компоненты:** Radix UI + кастомные стили
- **Анимации:** Framer Motion

### Адаптивность
- **Mobile-first** подход
- Поддержка экранов всех размеров
- Сенсорный интерфейс

## 🧪 Тестирование

### Доступные тесты:

```bash
# Быстрая проверка
npm run test:quick

# Функциональное тестирование
npm run test:functional

# Проверка UI элементов
npm run test:ui

# Финальная проверка
npm run test:final

# Полное тестирование
npm run test
```

## 👥 Тестовые аккаунты

После запуска `npm run db:seed` будут созданы тестовые аккаунты:

### Администратор
- **Email:** `admin@eqwip.com`
- **Пароль:** `123456`
- **Роль:** ADMIN

### Работодатели
- **Email:** `employer1@eqwip.com`
- **Пароль:** `123456`
- **Роль:** EMPLOYER

### Кандидаты
- **Email:** `candidate1@eqwip.com`
- **Пароль:** `123456`
- **Роль:** CANDIDATE

### Университеты
- **Email:** `university1@eqwip.com`
- **Пароль:** `123456`
- **Роль:** UNIVERSITY

## 🚀 Быстрый старт

**Минимальная установка (5 минут):**

```bash
# 1. Клонируйте репозиторий
git clone https://github.com/Belvist/EQWIP.git
cd EQWIP

# 2. Установите зависимости
npm install

# 3. Настройте базу данных
npm run db:generate
npm run db:migrate
npm run db:seed

# 4. Запустите приложение
npm run dev
```

**Откройте http://localhost:3000 и войдите с любым тестовым аккаунтом!**

## 📁 Структура проекта

```
EQWIP/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API endpoints
│   │   ├── auth/           # Аутентификация
│   │   ├── jobs/           # Вакансии
│   │   ├── employer/       # Панель работодателя
│   │   ├── admin/          # Админ панель
│   │   └── ...
│   ├── components/         # React компоненты
│   │   └── ui/            # UI компоненты
│   ├── lib/               # Утилиты и конфигурация
│   │   ├── core/          # OOP архитектура
│   │   ├── services/      # Бизнес-логика
│   │   └── repositories/  # Работа с данными
│   └── types/             # TypeScript типы
├── prisma/                # База данных
├── public/                # Статические файлы
└── tests/                 # Тесты
```

## 🔧 Доступные команды

```bash
# Разработка
npm run dev          # Запуск в dev режиме
npm run build        # Сборка для продакшена
npm run start        # Запуск продакшен сборки
npm run lint         # Линтинг кода

# База данных
npm run db:generate  # Генерация Prisma клиента
npm run db:migrate   # Применение миграций
npm run db:reset     # Сброс базы данных
npm run db:seed      # Заполнение тестовыми данными

# Тестирование
npm run test         # Полное тестирование
npm run test:quick   # Быстрая проверка
npm run test:final   # Финальная проверка
```

## 🐛 Решение проблем

### Ошибка "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Ошибка базы данных
```bash
rm prisma/dev.db
npm run db:migrate
npm run db:seed
```

### Ошибка TypeScript
```bash
npm run build
# Исправьте ошибки в коде
```

### Порт занят
```bash
# Измените порт в package.json
"dev": "next dev -p 3001"
```

## 📞 Поддержка

Если у вас возникли проблемы:

1. **Проверьте логи** в терминале
2. **Запустите тесты** `npm run test:final`
3. **Создайте issue** в GitHub
4. **Проверьте документацию** в папке `docs/`

## 📄 Лицензия

MIT License - см. файл [LICENSE](LICENSE)

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

---

**EQWIP - найди работу мечты с помощью искусственного интеллекта! 🚀**

[![GitHub stars](https://img.shields.io/github/stars/Belvist/EQWIP?style=social)](https://github.com/Belvist/EQWIP)
[![GitHub forks](https://img.shields.io/github/forks/Belvist/EQWIP?style=social)](https://github.com/Belvist/EQWIP)
[![GitHub issues](https://img.shields.io/github/issues/Belvist/EQWIP)](https://github.com/Belvist/EQWIP/issues)